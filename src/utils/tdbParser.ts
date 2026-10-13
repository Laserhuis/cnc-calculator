import { CarvecoTool, ToolType } from '../types/tool';
import { SAMPLE_TDB_BASE64 } from '../data/sampleTdbBase64';
import { isMetricDiameterValue, isToolMetric } from './unitConverter';

export interface ParseResult {
  tools: CarvecoTool[];
  groups: string[];
  rawBuffer: ArrayBuffer;
  isBinary: boolean;
  detectedFileUnit: 'metric' | 'imperial' | 'mixed';
  detectedSoftware?: 'carveco' | 'easel' | 'vectric' | 'fusion360' | 'carbide_create' | 'generic';
}

/**
 * Decode base64 to ArrayBuffer in browser / node
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Smart bit unit detection
 */
export function detectBitUnit(
  rawUnitFlag: number,
  rawDiameter: number,
  rawFeed: number,
  feedUnit: number,
  toolName: string,
  groupName: string = '',
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): { unit: 'mm' | 'inch'; unitFlag: number } {
  if (forcedUnit === 'metric') return { unit: 'mm', unitFlag: 1 };
  if (forcedUnit === 'imperial') return { unit: 'inch', unitFlag: 0 };

  // Explicit Carveco feedUnit: 1 = mm/sec, 2 = mm/min
  if (feedUnit === 1 || feedUnit === 2) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // Explicit rawUnitFlag in file
  if (rawUnitFlag === 1) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // High feed rate check (300+ mm/min)
  if (rawFeed >= 300) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // File or Group hints
  const lowerFile = fileName.toLowerCase();
  const lowerGroup = groupName.toLowerCase();
  const lowerName = toolName.toLowerCase();
  if (lowerFile.includes('metric') || lowerGroup.includes('metric') || lowerName.includes('mm')) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // If diameter matches typical metric values (> 2.0 mm)
  if (isMetricDiameterValue(rawDiameter)) {
    return { unit: 'mm', unitFlag: 1 };
  }

  return { unit: 'inch', unitFlag: 0 };
}

/**
 * Parses Carveco / ArtCAM binary .TDB or .TBD file.
 */
export function parseBinaryTdb(
  buffer: ArrayBuffer,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>();

  let offset = 0;
  const len = buffer.byteLength;

  while (offset < len - 4) {
    if (
      uint8[offset] === 0x07 &&
      uint8[offset + 1] === 0x00 &&
      uint8[offset + 2] === 0x00 &&
      uint8[offset + 3] === 0x00
    ) {
      const toolHeaderOffset = offset;
      const strLenOffset = toolHeaderOffset + 4;

      if (strLenOffset < len) {
        let strLen = uint8[strLenOffset];
        let nameStart = strLenOffset + 1;

        if (strLen === 0xff && strLenOffset + 2 < len) {
          strLen = view.getUint16(strLenOffset + 1, true);
          nameStart = strLenOffset + 3;
        }

        const nameByteLen = strLen * 2;
        if (nameStart + nameByteLen <= len && strLen > 0 && strLen < 250) {
          let toolName = '';
          for (let i = 0; i < strLen; i++) {
            const charCode = view.getUint16(nameStart + i * 2, true);
            if (charCode > 0 && charCode < 65535) {
              toolName += String.fromCharCode(charCode);
            }
          }

          if (toolName.trim().length > 0) {
            const afterNameOffset = nameStart + nameByteLen;
            let rawUnitFlag = 0;
            let rawDiameter = 0;
            let rawParam2 = 0;

            if (afterNameOffset + 20 <= len) {
              rawUnitFlag = view.getInt32(afterNameOffset, true);
              rawDiameter = view.getFloat64(afterNameOffset + 4, true);
              rawParam2 = view.getFloat64(afterNameOffset + 12, true);
            }

            let searchParams = afterNameOffset;
            let foundParams = false;
            let stepdown = 0;
            let spindleSpeed = 0;
            let feedRate = 0;
            let plungeRate = 0;
            let feedUnit = 4;
            let plungeUnit = 3;
            let paramsOffset = 0;
            let toolNo = tools.length + 1;

            const searchLimit = Math.min(afterNameOffset + 500, len - 40);
            while (searchParams < searchLimit) {
              const testSpeed = view.getFloat64(searchParams + 8, true);
              if (
                !isNaN(testSpeed) &&
                testSpeed >= 1000 &&
                testSpeed <= 100000 &&
                testSpeed % 100 === 0
              ) {
                const testStepdown = view.getFloat64(searchParams, true);
                const testFeed = view.getFloat64(searchParams + 16, true);
                const testPlunge = view.getFloat64(searchParams + 24, true);

                if (
                  !isNaN(testStepdown) &&
                  testStepdown > 0 &&
                  testStepdown < 100 &&
                  !isNaN(testFeed) &&
                  testFeed > 0 &&
                  testFeed < 50000 &&
                  !isNaN(testPlunge) &&
                  testPlunge > 0 &&
                  testPlunge < 50000
                ) {
                  stepdown = testStepdown;
                  spindleSpeed = Math.round(testSpeed);
                  feedRate = testFeed;
                  plungeRate = testPlunge;
                  paramsOffset = searchParams;
                  foundParams = true;

                  if (searchParams + 36 <= len) {
                    feedUnit = view.getInt32(searchParams + 32, true);
                  }
                  if (searchParams + 40 <= len) {
                    plungeUnit = view.getInt32(searchParams + 36, true);
                  }
                  if (searchParams + 44 <= len) {
                    const parsedToolNo = view.getInt32(searchParams + 40, true);
                    if (parsedToolNo > 0 && parsedToolNo < 10000) {
                      toolNo = parsedToolNo;
                    }
                  }
                  break;
                }
              }
              searchParams += 4;
            }

            if (foundParams) {
              let groupName = 'General';
              let scanBack = Math.max(0, toolHeaderOffset - 300);
              while (scanBack < toolHeaderOffset - 10) {
                if (
                  uint8[scanBack] === 0x05 &&
                  uint8[scanBack + 1] === 0x00 &&
                  uint8[scanBack + 2] === 0x00 &&
                  uint8[scanBack + 3] === 0x00
                ) {
                  const gLen = uint8[scanBack + 4];
                  if (gLen > 1 && gLen < 60 && scanBack + 5 + gLen * 2 <= toolHeaderOffset) {
                    let gStr = '';
                    for (let gi = 0; gi < gLen; gi++) {
                      gStr += String.fromCharCode(view.getUint16(scanBack + 5 + gi * 2, true));
                    }
                    if (gStr.trim().length > 1 && !gStr.includes('\0')) {
                      groupName = gStr.trim();
                    }
                  }
                }
                scanBack += 2;
              }

              groupsSet.add(groupName);

              const detected = detectBitUnit(
                rawUnitFlag,
                rawDiameter,
                feedRate,
                feedUnit,
                toolName,
                groupName,
                fileName,
                forcedUnit
              );

              tools.push({
                id: `tool-${tools.length + 1}`,
                name: toolName.trim(),
                group: groupName,
                notes: '',
                toolNo,
                unitFlag: detected.unitFlag,
                unit: detected.unit,
                diameter: rawDiameter,
                param2: rawParam2,
                stepdown,
                spindleSpeed,
                feedRate,
                plungeRate,
                feedUnit,
                plungeUnit,
                toolType: detectToolType(toolName),
                fluteCount: detectFluteCount(toolName),
                paramsOffset,
                nameOffset: toolHeaderOffset + 1,
                originalValues: {
                  diameter: rawDiameter,
                  param2: rawParam2,
                  stepdown,
                  spindleSpeed,
                  feedRate,
                  plungeRate,
                  name: toolName.trim(),
                  notes: '',
                },
              });

              offset = paramsOffset + 40;
              continue;
            }
          }
        }
      }
    }
    offset += 2;
  }

  const metricCount = tools.filter(t => t.unitFlag === 1 || t.unit === 'mm').length;
  let detectedFileUnit: 'metric' | 'imperial' | 'mixed' = 'metric';
  if (metricCount === tools.length && tools.length > 0) {
    detectedFileUnit = 'metric';
  } else if (metricCount === 0 && tools.length > 0) {
    detectedFileUnit = 'imperial';
  } else {
    detectedFileUnit = metricCount > tools.length / 2 ? 'metric' : 'imperial';
  }

  return {
    tools,
    groups: Array.from(groupsSet),
    rawBuffer: buffer,
    isBinary: true,
    detectedFileUnit,
    detectedSoftware: 'carveco',
  };
}

/**
 * Detect tool type from name
 */
export function detectToolType(name: string): ToolType {
  const lower = name.toLowerCase();
  if (lower.includes('ball nose') || lower.includes('ballnose')) return 'ballnose';
  if (lower.includes('v-bit') || lower.includes('v-groove') || lower.includes(' deg') || lower.includes('degree')) return 'vbit';
  if (lower.includes('surfac') || lower.includes('fly cutter') || lower.includes('spoilboard') || lower.includes('flatten')) return 'surfacing';
  if (lower.includes('roundover')) return 'roundover';
  if (lower.includes('engrav') || lower.includes('liner') || lower.includes('veining')) return 'engraving';
  if (lower.includes('drill')) return 'drill';
  if (lower.includes('conical') || lower.includes('taper')) return 'conical';
  if (lower.includes('radiused') || lower.includes('bull nose')) return 'radiused';
  return 'endmill';
}

/**
 * Detect flute count from name
 */
export function detectFluteCount(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('4-wing') || lower.includes('4 flute') || lower.includes('four flute')) return 4;
  if (lower.includes('3-wing') || lower.includes('triple flute') || lower.includes('3 flute')) return 3;
  if (lower.includes('o-flute') || lower.includes('single flute') || lower.includes('1 flute')) return 1;
  return 2; // Default CNC router bit is 2 flutes
}

/**
 * Writes updated tools into a Carveco binary buffer.
 */
export function writeBinaryTdb(tools: CarvecoTool[], originalBuffer: ArrayBuffer | null): ArrayBuffer {
  let targetBuffer: ArrayBuffer;

  if (originalBuffer && originalBuffer.byteLength > 100) {
    targetBuffer = originalBuffer.slice(0);
  } else {
    targetBuffer = base64ToArrayBuffer(SAMPLE_TDB_BASE64);
  }

  const view = new DataView(targetBuffer);

  for (const tool of tools) {
    if (tool.paramsOffset !== undefined && tool.paramsOffset + 40 <= targetBuffer.byteLength) {
      view.setFloat64(tool.paramsOffset, tool.stepdown, true);
      view.setFloat64(tool.paramsOffset + 8, tool.spindleSpeed, true);
      view.setFloat64(tool.paramsOffset + 16, tool.feedRate, true);
      view.setFloat64(tool.paramsOffset + 24, tool.plungeRate, true);

      if (tool.nameOffset !== undefined) {
        let strLen = new Uint8Array(targetBuffer)[tool.nameOffset + 3];
        let nameNextPos = tool.nameOffset + 4 + strLen * 2;
        if (strLen === 0xff) {
          strLen = view.getUint16(tool.nameOffset + 4, true);
          nameNextPos = tool.nameOffset + 6 + strLen * 2;
        }
        if (nameNextPos + 20 <= targetBuffer.byteLength) {
          view.setInt32(nameNextPos, tool.unitFlag, true);
          view.setFloat64(nameNextPos + 4, tool.diameter, true);
          view.setFloat64(nameNextPos + 12, tool.param2, true);
        }
      }
    }
  }

  return targetBuffer;
}

/**
 * Parses plain text / CSV / TSV / JSON tool files from Carveco, Easel, Vectric, Fusion 360, Carbide Create
 */
export function parseTextTools(
  text: string,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const trimmed = text.trim();

  // 1. Check if JSON format (Easel, Fusion 360, or native JSON)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseJsonTools(parsed, fileName, forcedUnit);
    } catch {
      // Fall through to text/csv parser
    }
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>();

  if (lines.length === 0) {
    return {
      tools: [],
      groups: [],
      rawBuffer: new ArrayBuffer(0),
      isBinary: false,
      detectedFileUnit: 'metric',
      detectedSoftware: 'generic',
    };
  }

  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headerLower = lines[0].toLowerCase();
  let startIndex = 0;
  let detectedSoftware: 'carveco' | 'easel' | 'vectric' | 'carbide_create' | 'generic' = 'generic';

  if (headerLower.includes('pass depth') || headerLower.includes('stepover') || headerLower.includes('units')) {
    detectedSoftware = 'vectric';
    startIndex = 1;
  } else if (headerLower.includes('depth of cut') || headerLower.includes('feedrate')) {
    detectedSoftware = 'carbide_create';
    startIndex = 1;
  } else if (headerLower.includes('depth per pass') || headerLower.includes('cutting diameter')) {
    detectedSoftware = 'easel';
    startIndex = 1;
  } else if (headerLower.includes('tool') || headerLower.includes('name') || headerLower.includes('diameter')) {
    detectedSoftware = 'carveco';
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts = splitCsvLine(line, separator);
    if (parts.length >= 3) {
      let name = parts[0]?.trim() || `Tool ${i}`;
      let group = 'General';
      let toolNo = i;
      let diameter = 0.25;
      let stepdown = 0.125;
      let spindleSpeed = 18000;
      let feedRate = 100;
      let plungeRate = 25;
      let notes = '';

      if (detectedSoftware === 'vectric') {
        // Vectric columns: Tool Name, Tool Type, Diameter, Units, Pass Depth, Stepover, Spindle Speed, Feed Rate, Plunge Rate, Tool Number
        name = parts[0] || `Tool ${i}`;
        diameter = parseFloat(parts[2]) || 0.25;
        const unitsStr = (parts[3] || '').toLowerCase();
        stepdown = parseFloat(parts[4]) || diameter * 0.5;
        spindleSpeed = Math.round(parseFloat(parts[6]) || 18000);
        feedRate = parseFloat(parts[7]) || 100;
        plungeRate = parseFloat(parts[8]) || 25;
        toolNo = parseInt(parts[9], 10) || i;
        group = parts[1] || 'Vectric Tools';
        if (unitsStr.includes('mm')) {
          forcedUnit = forcedUnit || 'metric';
        }
      } else if (detectedSoftware === 'carbide_create') {
        // Carbide Create: Tool Number, Name, Type, Diameter, Flute Count, RPM, Feedrate, Plungerate, Depth of Cut
        toolNo = parseInt(parts[0], 10) || i;
        name = parts[1] || `Tool ${i}`;
        group = 'Carbide Create Tools';
        diameter = parseFloat(parts[3]) || 0.25;
        spindleSpeed = Math.round(parseFloat(parts[5]) || 18000);
        feedRate = parseFloat(parts[6]) || 100;
        plungeRate = parseFloat(parts[7]) || 25;
        stepdown = parseFloat(parts[8]) || diameter * 0.5;
      } else if (detectedSoftware === 'easel') {
        // Easel: Name, Type, Diameter, Flutes, Feed Rate, Plunge Rate, Depth Per Pass, RPM
        name = parts[0] || `Tool ${i}`;
        group = 'Easel Bits';
        diameter = parseFloat(parts[2]) || 0.25;
        feedRate = parseFloat(parts[4]) || 100;
        plungeRate = parseFloat(parts[5]) || 25;
        stepdown = parseFloat(parts[6]) || diameter * 0.5;
        spindleSpeed = Math.round(parseFloat(parts[7]) || 18000);
      } else {
        // Standard / Carveco CSV
        name = parts[0]?.trim() || `Tool ${i}`;
        group = parts[1]?.trim() || 'General';
        toolNo = parseInt(parts[2]?.trim() || '0', 10) || i;
        diameter = parseFloat(parts[3]?.trim() || '0.25') || 0.25;
        stepdown = parseFloat(parts[4]?.trim() || '0.125') || 0.125;
        spindleSpeed = Math.round(parseFloat(parts[5]?.trim() || '18000') || 18000);
        feedRate = parseFloat(parts[6]?.trim() || '100') || 100;
        plungeRate = parseFloat(parts[7]?.trim() || '20') || 20;
        notes = parts[8]?.trim() || '';
      }

      const detected = detectBitUnit(
        0,
        diameter,
        feedRate,
        feedRate >= 300 ? 2 : 4,
        name,
        group,
        fileName,
        forcedUnit
      );

      groupsSet.add(group);

      tools.push({
        id: `tool-${tools.length + 1}`,
        name,
        group,
        notes,
        toolNo,
        unitFlag: detected.unitFlag,
        unit: detected.unit,
        diameter,
        param2: diameter,
        stepdown,
        spindleSpeed,
        feedRate,
        plungeRate,
        feedUnit: detected.unit === 'mm' ? 2 : 4,
        plungeUnit: detected.unit === 'mm' ? 2 : 3,
        toolType: detectToolType(name),
        fluteCount: detectFluteCount(name),
        originalValues: {
          diameter,
          param2: diameter,
          stepdown,
          spindleSpeed,
          feedRate,
          plungeRate,
          name,
          notes,
        },
      });
    }
  }

  const metricCount = tools.filter(t => t.unitFlag === 1 || t.unit === 'mm').length;
  let detectedFileUnit: 'metric' | 'imperial' | 'mixed' = 'metric';
  if (metricCount === tools.length && tools.length > 0) {
    detectedFileUnit = 'metric';
  } else if (metricCount === 0 && tools.length > 0) {
    detectedFileUnit = 'imperial';
  } else {
    detectedFileUnit = metricCount > tools.length / 2 ? 'metric' : 'imperial';
  }

  return {
    tools,
    groups: Array.from(groupsSet),
    rawBuffer: new ArrayBuffer(0),
    isBinary: false,
    detectedFileUnit,
    detectedSoftware,
  };
}

/**
 * Parses JSON formats: Fusion 360 .tools, Inventables Easel, or native Carveco tools JSON
 */
export function parseJsonTools(
  json: any,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>();
  let detectedSoftware: 'fusion360' | 'easel' | 'carveco' | 'generic' = 'generic';

  // 1. Fusion 360 CAM Tool Library format: { version: 1, data: [ ... ] }
  if (json && Array.isArray(json.data) && json.data.length > 0 && json.data[0].geometry) {
    detectedSoftware = 'fusion360';
    for (const item of json.data) {
      const name = item.description || item.type || `Fusion Tool ${tools.length + 1}`;
      const group = item.vendor || 'Fusion 360 Library';
      groupsSet.add(group);

      const diameter = item.geometry?.DC || 6.35;
      const flutes = item.geometry?.NOF || 2;
      const preset = item['cutting-data']?.presets?.[0] || {};
      const spindleSpeed = preset.n || 18000;
      const feedRate = preset.v_f || 1200;
      const plungeRate = preset.v_f_plunge || 300;
      const stepdown = preset.stepdown || diameter * 0.5;
      const toolNo = item['post-process']?.number || tools.length + 1;

      const detected = detectBitUnit(
        0,
        diameter,
        feedRate,
        feedRate >= 300 ? 2 : 4,
        name,
        group,
        fileName,
        forcedUnit
      );

      tools.push({
        id: `tool-${tools.length + 1}`,
        name,
        group,
        notes: item.vendor ? `Vendor: ${item.vendor}` : '',
        toolNo,
        unitFlag: detected.unitFlag,
        unit: detected.unit,
        diameter,
        param2: diameter,
        stepdown,
        spindleSpeed,
        feedRate,
        plungeRate,
        feedUnit: detected.unit === 'mm' ? 2 : 4,
        plungeUnit: detected.unit === 'mm' ? 2 : 3,
        toolType: detectToolType(name),
        fluteCount: flutes,
        originalValues: {
          diameter,
          param2: diameter,
          stepdown,
          spindleSpeed,
          feedRate,
          plungeRate,
          name,
          notes: '',
        },
      });
    }
  }
  // 2. Easel JSON format: array of { name, cutting_diameter, depth_per_pass, feed_rate, ... }
  else if (Array.isArray(json) && json.length > 0 && ('cutting_diameter' in json[0] || 'depth_per_pass' in json[0])) {
    detectedSoftware = 'easel';
    for (const item of json) {
      const name = item.name || `Easel Bit ${tools.length + 1}`;
      const group = 'Easel Custom Bits';
      groupsSet.add(group);

      const diameter = item.cutting_diameter || item.diameter || 3.175;
      const stepdown = item.depth_per_pass || diameter * 0.5;
      const feedRate = item.feed_rate || 500;
      const plungeRate = item.plunge_rate || 150;
      const spindleSpeed = item.rpm || item.spindle_speed || 18000;
      const flutes = item.flutes || 2;

      const detected = detectBitUnit(
        item.unit === 'mm' ? 1 : 0,
        diameter,
        feedRate,
        feedRate >= 300 ? 2 : 4,
        name,
        group,
        fileName,
        forcedUnit
      );

      tools.push({
        id: `tool-${tools.length + 1}`,
        name,
        group,
        notes: item.material ? `Material: ${item.material}` : '',
        toolNo: tools.length + 1,
        unitFlag: detected.unitFlag,
        unit: detected.unit,
        diameter,
        param2: diameter,
        stepdown,
        spindleSpeed,
        feedRate,
        plungeRate,
        feedUnit: detected.unit === 'mm' ? 2 : 4,
        plungeUnit: detected.unit === 'mm' ? 2 : 3,
        toolType: detectToolType(name),
        fluteCount: flutes,
        originalValues: {
          diameter,
          param2: diameter,
          stepdown,
          spindleSpeed,
          feedRate,
          plungeRate,
          name,
          notes: '',
        },
      });
    }
  }
  // 3. Standard / Native Carveco Tools JSON array
  else if (Array.isArray(json)) {
    detectedSoftware = 'carveco';
    for (const item of json) {
      if (item.name && item.diameter !== undefined) {
        const group = item.group || 'Imported Bits';
        groupsSet.add(group);
        tools.push({
          ...item,
          id: item.id || `tool-${tools.length + 1}`,
          originalValues: item.originalValues || {
            diameter: item.diameter,
            param2: item.param2 || item.diameter,
            stepdown: item.stepdown,
            spindleSpeed: item.spindleSpeed,
            feedRate: item.feedRate,
            plungeRate: item.plungeRate,
            name: item.name,
            notes: item.notes || '',
          },
        });
      }
    }
  }

  const metricCount = tools.filter(t => t.unitFlag === 1 || t.unit === 'mm').length;
  const detectedFileUnit = metricCount > tools.length / 2 ? 'metric' : 'imperial';

  return {
    tools,
    groups: Array.from(groupsSet),
    rawBuffer: new ArrayBuffer(0),
    isBinary: false,
    detectedFileUnit,
    detectedSoftware,
  };
}

function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeCsv(val: string | number): string {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Standard CSV Export
 */
export function exportToCsv(tools: CarvecoTool[]): string {
  const headers = [
    'Tool Name',
    'Group',
    'Tool Number',
    'Diameter',
    'Stepdown',
    'Spindle Speed (RPM)',
    'Feed Rate',
    'Plunge Rate',
    'Feed Unit',
    'Plunge Unit',
    'Tool Type',
    'Flutes',
    'Notes',
  ];

  const rows = tools.map(t => [
    escapeCsv(t.name),
    escapeCsv(t.group),
    t.toolNo,
    t.diameter,
    t.stepdown,
    t.spindleSpeed,
    t.feedRate,
    t.plungeRate,
    t.feedUnit === 4 ? 'in/min' : t.feedUnit === 2 ? 'mm/min' : t.feedUnit === 1 ? 'mm/sec' : 'in/sec',
    t.plungeUnit === 3 ? 'in/min' : t.plungeUnit === 2 ? 'mm/min' : t.plungeUnit === 1 ? 'mm/sec' : 'in/sec',
    t.toolType,
    t.fluteCount,
    escapeCsv(t.notes),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Standard JSON Export
 */
export function exportToJson(tools: CarvecoTool[]): string {
  return JSON.stringify(tools, null, 2);
}

/**
 * Inventables Easel Custom Tool Library JSON export
 */
export function exportToEaselJson(tools: CarvecoTool[]): string {
  const easelTools = tools.map(t => {
    const isMetric = isToolMetric(t);
    return {
      name: t.name,
      type: t.toolType === 'vbit' ? 'vbit' : t.toolType === 'ballnose' ? 'ballnose' : 'endmill',
      material: 'solid carbide',
      cutting_diameter: t.diameter,
      shank_diameter: t.diameter,
      flutes: t.fluteCount || 2,
      feed_rate: t.feedRate,
      plunge_rate: t.plungeRate,
      depth_per_pass: t.stepdown,
      rpm: t.spindleSpeed,
      unit: isMetric ? 'mm' : 'in',
      notes: t.notes || `Calibrated for 710W spindle. Group: ${t.group}`,
    };
  });
  return JSON.stringify(easelTools, null, 2);
}

/**
 * Inventables Easel CSV Tool Database export
 */
export function exportToEaselCsv(tools: CarvecoTool[]): string {
  const headers = [
    'Name',
    'Type',
    'Diameter',
    'Unit',
    'Flutes',
    'Feed Rate',
    'Plunge Rate',
    'Depth Per Pass',
    'RPM',
    'Notes',
  ];

  const rows = tools.map(t => {
    const isMetric = isToolMetric(t);
    return [
      escapeCsv(t.name),
      t.toolType === 'vbit' ? 'V-Bit' : t.toolType === 'ballnose' ? 'Ball Nose' : 'End Mill',
      t.diameter,
      isMetric ? 'mm' : 'in',
      t.fluteCount || 2,
      t.feedRate,
      t.plungeRate,
      t.stepdown,
      t.spindleSpeed,
      escapeCsv(t.notes || t.group),
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Vectric (VCarve Pro / Aspire / Cut2D) CSV Tool Database export
 */
export function exportToVectricCsv(tools: CarvecoTool[]): string {
  const headers = [
    'Tool Name',
    'Tool Type',
    'Diameter',
    'Units',
    'Pass Depth',
    'Stepover',
    'Spindle Speed',
    'Feed Rate',
    'Plunge Rate',
    'Tool Number',
    'Notes',
  ];

  const rows = tools.map(t => {
    const isMetric = isToolMetric(t);
    const vType =
      t.toolType === 'vbit'
        ? 'V-Bit'
        : t.toolType === 'ballnose'
        ? 'Ball Nose'
        : t.toolType === 'engraving'
        ? 'Engraving'
        : t.toolType === 'surfacing'
        ? 'Fly Cutter'
        : 'End Mill';

    return [
      escapeCsv(t.name),
      vType,
      t.diameter,
      isMetric ? 'mm' : 'inches',
      t.stepdown,
      t.param2 || t.diameter * 0.4,
      t.spindleSpeed,
      t.feedRate,
      t.plungeRate,
      t.toolNo,
      escapeCsv(t.notes || `Exported from Carveco Bit Studio. ${t.group}`),
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Autodesk Fusion 360 CAM Tool Library (.tools / JSON) export
 */
export function exportToFusion360Tools(tools: CarvecoTool[]): string {
  const fusionData = tools.map(t => {
    const isMetric = isToolMetric(t);
    // Convert to mm if imperial, as Fusion 360 CAM standardizes geometries in mm
    const diamMm = isMetric ? t.diameter : t.diameter * 25.4;
    const stepdownMm = isMetric ? t.stepdown : t.stepdown * 25.4;
    const feedMmMin = isMetric
      ? t.feedUnit === 1
        ? t.feedRate * 60
        : t.feedRate
      : t.feedRate * 25.4;
    const plungeMmMin = isMetric
      ? t.plungeUnit === 1
        ? t.plungeRate * 60
        : t.plungeRate
      : t.plungeRate * 25.4;

    const toolTypeStr =
      t.toolType === 'ballnose'
        ? 'ball end mill'
        : t.toolType === 'vbit'
        ? 'chamfer mill'
        : t.toolType === 'surfacing'
        ? 'face mill'
        : 'flat end mill';

    return {
      type: toolTypeStr,
      description: t.name,
      vendor: t.group || 'Carveco Bit Studio',
      'product-id': `TOOL-${t.toolNo}`,
      geometry: {
        DC: Math.round(diamMm * 1000) / 1000,
        SFDM: Math.round(diamMm * 1000) / 1000,
        OAL: 50.8,
        LC: Math.round(diamMm * 3 * 10) / 10,
        NOF: t.fluteCount || 2,
        HAND: true,
      },
      'post-process': {
        number: t.toolNo,
        'diameter-offset': t.toolNo,
        'length-offset': t.toolNo,
        turret: 0,
        comment: t.notes || '',
      },
      'cutting-data': {
        presets: [
          {
            name: '710W Spindle Preset',
            n: t.spindleSpeed,
            v_f: Math.round(feedMmMin),
            v_f_leadIn: Math.round(feedMmMin),
            v_f_leadOut: Math.round(feedMmMin),
            v_f_plunge: Math.round(plungeMmMin),
            v_f_ramp: Math.round(feedMmMin * 0.5),
            stepdown: Math.round(stepdownMm * 1000) / 1000,
            stepover: Math.round(diamMm * 0.4 * 1000) / 1000,
          },
        ],
      },
    };
  });

  return JSON.stringify(
    {
      version: 1,
      data: fusionData,
    },
    null,
    2
  );
}

/**
 * Carbide Create Custom Tool Library CSV export
 */
export function exportToCarbideCreateCsv(tools: CarvecoTool[]): string {
  const headers = [
    'Tool Number',
    'Name',
    'Type',
    'Diameter',
    'Flute Count',
    'RPM',
    'Feedrate',
    'Plungerate',
    'Depth of Cut',
    'Stepover',
  ];

  const rows = tools.map(t => {
    return [
      t.toolNo,
      escapeCsv(t.name),
      t.toolType === 'vbit' ? 'V-Bit' : t.toolType === 'ballnose' ? 'Ball' : 'Endmill',
      t.diameter,
      t.fluteCount || 2,
      t.spindleSpeed,
      t.feedRate,
      t.plungeRate,
      t.stepdown,
      t.param2 || t.diameter * 0.5,
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Universal auto-detector and parser
 */
export async function parseUploadedFile(
  file: File,
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check if binary Carveco / ArtCAM
  const textHeader = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 100));
  const isCarvecoBinary = textHeader.includes('tpmDB_') || (bytes[0] === 0xc2 && bytes[1] === 0x00);

  if (isCarvecoBinary) {
    return parseBinaryTdb(arrayBuffer, file.name, forcedUnit);
  }

  // Otherwise parse text/json
  const text = new TextDecoder('utf-8').decode(bytes);
  return parseTextTools(text, file.name, forcedUnit);
}
