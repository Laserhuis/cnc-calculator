import { CarvecoTool, ToolType } from '../types/tool';
import { SAMPLE_TDB_BASE64 } from '../data/sampleTdbBase64';
import { isMetricDiameterValue, isToolMetric } from './unitConverter';

export interface ParseResult {
  tools: CarvecoTool[];
  groups: string[];
  rawBuffer: ArrayBuffer;
  isBinary: boolean;
  detectedFileUnit: 'metric' | 'imperial' | 'mixed';
  detectedSoftware?: 'carveco' | 'easel' | 'vectric' | 'fusion360' | 'carbide_create' | 'candle_grbl' | 'generic';
  parsingNotes?: string;
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

  // Explicit Carveco feedUnit: 1 = mm/sec, 2 = mm/min, 3 = in/sec, 4 = in/min
  if (feedUnit === 1 || feedUnit === 2) {
    return { unit: 'mm', unitFlag: 1 };
  }
  if (feedUnit === 3 || feedUnit === 4) {
    return { unit: 'inch', unitFlag: 0 };
  }

  // Explicit rawUnitFlag in file: 1 = metric (mm), 0 = imperial (inch)
  if (rawUnitFlag === 1) {
    return { unit: 'mm', unitFlag: 1 };
  }
  if (rawUnitFlag === 0 && rawDiameter > 0 && rawDiameter < 2.5) {
    return { unit: 'inch', unitFlag: 0 };
  }

  // File or Group hints
  const lowerFile = fileName.toLowerCase();
  const lowerGroup = groupName.toLowerCase();
  const lowerName = toolName.toLowerCase();

  if (lowerFile.includes('inch') || lowerGroup.includes('inch') || lowerFile.includes('imperial')) {
    return { unit: 'inch', unitFlag: 0 };
  }

  if (
    lowerFile.includes('metric') ||
    lowerGroup.includes('metric') ||
    lowerName.includes('mm')
  ) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // High feed rate check (300+ usually indicates mm/min)
  if (rawFeed >= 300) {
    return { unit: 'mm', unitFlag: 1 };
  }

  // If diameter matches typical metric values (> 2.0 mm and not typical fractional inches)
  if (isMetricDiameterValue(rawDiameter)) {
    return { unit: 'mm', unitFlag: 1 };
  }

  return { unit: 'inch', unitFlag: 0 };
}

/**
 * Parses Carveco / ArtCAM binary .TDB or .TBD file.
 * Handles both classic token headers and adaptive parameter chunk scanning.
 */
export function parseBinaryTdb(
  buffer: ArrayBuffer,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);
  const len = buffer.byteLength;
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>();

  // =========================================================================
  // PASS 1: MFC CArchive Unicode CString & Object Scanner (Standard Carveco .tdb)
  // =========================================================================
  const unicodeStrings: { offset: number; len: number; text: string; nextOffset: number }[] = [];
  for (let i = 0; i < len - 8; i++) {
    if (uint8[i] === 0xff && uint8[i + 1] === 0xfe && uint8[i + 2] === 0xff) {
      let charLen = uint8[i + 3];
      let strStart = i + 4;
      if (charLen === 0xff) {
        charLen = view.getUint16(i + 4, true);
        strStart = i + 6;
      }
      if (charLen > 0 && charLen < 300 && strStart + charLen * 2 <= len) {
        let s = '';
        let valid = true;
        for (let c = 0; c < charLen; c++) {
          const code = view.getUint16(strStart + c * 2, true);
          if (code < 32 || code > 65533) {
            valid = false;
            break;
          }
          s += String.fromCharCode(code);
        }
        if (valid && s.trim().length > 0) {
          unicodeStrings.push({ offset: i, len: charLen, text: s, nextOffset: strStart + charLen * 2 });
        }
      }
    }
  }

  if (unicodeStrings.length > 0) {
    let currentGroup = 'General';
    for (let sIdx = 0; sIdx < unicodeStrings.length; sIdx++) {
      const item = unicodeStrings[sIdx];
      const nextItem = unicodeStrings[sIdx + 1];
      const searchEnd = nextItem ? nextItem.offset : Math.min(item.nextOffset + 1200, len);

      // Skip internal notes or disclaimers
      if (
        item.text === 'No notes' ||
        item.text.startsWith('Recommended Starting') ||
        item.text.startsWith('For feed/speed') ||
        item.text.startsWith('http')
      ) {
        continue;
      }

      // Check for diameter right after the string
      let diam = 0;
      let param2 = 0;
      for (let dProbe = item.nextOffset; dProbe <= Math.min(item.nextOffset + 40, searchEnd - 8); dProbe += 2) {
        const testD = view.getFloat64(dProbe, true);
        if (!isNaN(testD) && testD > 0.001 && testD <= 200) {
          diam = testD;
          if (dProbe + 8 <= len - 8) {
            const testP2 = view.getFloat64(dProbe + 8, true);
            if (!isNaN(testP2) && testP2 >= 0 && testP2 <= 200) param2 = testP2;
          }
          break;
        }
      }

      // Scan for stepdown, speed, feed, plunge
      let stepdown = 0;
      let speed = 0;
      let feed = 0;
      let plunge = 0;
      let feedUnit = 4;
      let plungeUnit = 3;
      let paramsOffset = 0;
      let toolNo = tools.length + 1;

      for (let pProbe = item.nextOffset; pProbe <= searchEnd - 32; pProbe += 2) {
        const testSpeed = view.getFloat64(pProbe + 8, true);
        if (!isNaN(testSpeed) && testSpeed >= 1000 && testSpeed <= 100000) {
          const testStep = view.getFloat64(pProbe, true);
          const testFeed = view.getFloat64(pProbe + 16, true);
          const testPlunge = view.getFloat64(pProbe + 24, true);

          if (
            !isNaN(testStep) && testStep > 0 && testStep <= 150 &&
            !isNaN(testFeed) && testFeed > 0 && testFeed <= 60000 &&
            !isNaN(testPlunge) && testPlunge > 0 && testPlunge <= 60000
          ) {
            stepdown = testStep;
            speed = Math.round(testSpeed);
            feed = testFeed;
            plunge = testPlunge;
            paramsOffset = pProbe;
            if (pProbe + 36 <= len) feedUnit = view.getInt32(pProbe + 32, true);
            if (pProbe + 40 <= len) plungeUnit = view.getInt32(pProbe + 36, true);
            if (pProbe + 44 <= len) {
              const testToolNo = view.getInt32(pProbe + 40, true);
              if (testToolNo > 0 && testToolNo < 10000) toolNo = testToolNo;
            }
            break;
          }
        }
      }

      if (speed > 0 && (feed > 0 || diam > 0)) {
        if (diam === 0) diam = extractDiameterFromName(item.text) || 3.175;
        const detected = detectBitUnit(
          feedUnit === 1 || feedUnit === 2 ? 1 : 0,
          diam,
          feed,
          feedUnit,
          item.text,
          currentGroup,
          fileName,
          forcedUnit
        );
        groupsSet.add(currentGroup);
        const tType = detectToolType(item.text);
        const fCount = detectFluteCount(item.text);
        const tAngle = detectToolAngle(item.text, tType, param2);
        const tTipSize = detectTipSize(item.text, tType, diam, param2, detected.unit);
        const sOver = detectStepover(diam, tType, param2);
        const sDiameter = detectShankDiameter(item.text, diam, detected.unit);
        const fLength = detectFluteLength(item.text, diam, detected.unit);
        const matGroup = detectMaterialGroup(currentGroup, item.text);

        tools.push({
          id: `tool-${tools.length + 1}`,
          name: item.text.trim(),
          group: currentGroup,
          notes: '',
          toolNo,
          unitFlag: detected.unitFlag,
          unit: detected.unit,
          diameter: diam,
          param2: param2 || diam,
          tipSize: tTipSize,
          angle: tAngle,
          stepover: sOver.stepover,
          stepoverPercent: sOver.stepoverPercent,
          shankDiameter: sDiameter,
          fluteLength: fLength,
          materialGroup: matGroup,
          stepdown,
          spindleSpeed: speed,
          feedRate: feed,
          plungeRate: plunge,
          feedUnit,
          plungeUnit,
          toolType: tType,
          fluteCount: fCount,
          paramsOffset,
          nameOffset: item.offset,
          originalValues: {
            diameter: diam,
            param2: param2 || diam,
            stepdown,
            spindleSpeed: speed,
            feedRate: feed,
            plungeRate: plunge,
            stepover: sOver.stepover,
            stepoverPercent: sOver.stepoverPercent,
            tipSize: tTipSize,
            angle: tAngle,
            fluteLength: fLength,
            shankDiameter: sDiameter,
            name: item.text.trim(),
            notes: '',
          },
        });
      } else {
        // String has no cutting parameters: It is a Group/Category name!
        if (item.text.length > 2 && !item.text.includes('Notes') && !item.text.includes('http')) {
          currentGroup = item.text.trim();
        }
      }
    }
  }

  // =========================================================================
  // PASS 2: Classic ArtCAM / Token-based header scan (if Pass 1 returned 0)
  // =========================================================================
  if (tools.length === 0) {
    let offset = 0;
    while (offset < len - 4) {
      const isToolRecord =
        (uint8[offset] === 0x07 || uint8[offset] === 0x08) &&
        uint8[offset + 1] === 0x00 &&
        uint8[offset + 2] === 0x00 &&
        uint8[offset + 3] === 0x00;

      if (isToolRecord) {
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

              const searchLimit = Math.min(afterNameOffset + 800, len - 40);
              while (searchParams < searchLimit) {
                const testSpeed = view.getFloat64(searchParams + 8, true);
                if (!isNaN(testSpeed) && testSpeed >= 1000 && testSpeed <= 100000) {
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
                searchParams += 2;
              }

              if (foundParams) {
                let groupName = 'General';
                let scanBack = Math.max(0, toolHeaderOffset - 400);
                while (scanBack < toolHeaderOffset - 10) {
                  if (
                    uint8[scanBack] === 0x05 &&
                    uint8[scanBack + 1] === 0x00 &&
                    uint8[scanBack + 2] === 0x00 &&
                    uint8[scanBack + 3] === 0x00
                  ) {
                    const gLen = uint8[scanBack + 4];
                    if (gLen > 1 && gLen < 80 && scanBack + 5 + gLen * 2 <= toolHeaderOffset) {
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
  }

  // =========================================================================
  // PASS 3: Fallback Parameter-Float Cluster Extraction
  // =========================================================================
  if (tools.length === 0) {
    let scanPos = 0;
    while (scanPos < len - 32) {
      const testSpeed = view.getFloat64(scanPos + 8, true);
      if (!isNaN(testSpeed) && testSpeed >= 3000 && testSpeed <= 60000) {
        const testStep = view.getFloat64(scanPos, true);
        const testFeed = view.getFloat64(scanPos + 16, true);
        const testPlunge = view.getFloat64(scanPos + 24, true);

        if (
          !isNaN(testStep) && testStep > 0 && testStep <= 100 &&
          !isNaN(testFeed) && testFeed > 0 && testFeed <= 30000 &&
          !isNaN(testPlunge) && testPlunge > 0 && testPlunge <= 30000
        ) {
          // Look backward for a string description
          let toolName = '';
          for (let b = Math.max(0, scanPos - 250); b < scanPos - 10; b++) {
            if (uint8[b + 1] === 0 && uint8[b + 3] === 0 && uint8[b] >= 32 && uint8[b] <= 126) {
              let s = '';
              let p = b;
              while (p < scanPos && uint8[p + 1] === 0 && uint8[p] >= 32 && uint8[p] <= 126 && s.length < 80) {
                s += String.fromCharCode(uint8[p]);
                p += 2;
              }
              if (s.length >= 4 && !s.startsWith('tpmDB') && !s.startsWith('No notes')) {
                toolName = s.trim();
              }
            }
          }

          if (!toolName) {
            toolName = `Carveco Tool #${tools.length + 1}`;
          }

          const diam = extractDiameterFromName(toolName) || 3.175;
          const detected = detectBitUnit(
            testFeed >= 300 ? 1 : 0,
            diam,
            testFeed,
            testFeed >= 300 ? 2 : 4,
            toolName,
            'Carveco Database',
            fileName,
            forcedUnit
          );

          groupsSet.add('Carveco Database');
          const tType = detectToolType(toolName);
          const fCount = detectFluteCount(toolName);
          const tAngle = detectToolAngle(toolName, tType, diam);
          const tTipSize = detectTipSize(toolName, tType, diam, undefined, detected.unit);
          const sOver = detectStepover(diam, tType);
          const sDiameter = detectShankDiameter(toolName, diam, detected.unit);
          const fLength = detectFluteLength(toolName, diam, detected.unit);
          const matGroup = detectMaterialGroup('Carveco Database', toolName);

          tools.push({
            id: `tool-${tools.length + 1}`,
            name: toolName,
            group: 'Carveco Database',
            notes: 'Recovered binary definition',
            toolNo: tools.length + 1,
            unitFlag: detected.unitFlag,
            unit: detected.unit,
            diameter: diam,
            param2: diam,
            tipSize: tTipSize,
            angle: tAngle,
            stepover: sOver.stepover,
            stepoverPercent: sOver.stepoverPercent,
            shankDiameter: sDiameter,
            fluteLength: fLength,
            materialGroup: matGroup,
            stepdown: testStep,
            spindleSpeed: Math.round(testSpeed),
            feedRate: testFeed,
            plungeRate: testPlunge,
            feedUnit: detected.unit === 'mm' ? 2 : 4,
            plungeUnit: detected.unit === 'mm' ? 2 : 3,
            toolType: tType,
            fluteCount: fCount,
            paramsOffset: scanPos,
            originalValues: {
              diameter: diam,
              param2: diam,
              stepdown: testStep,
              spindleSpeed: Math.round(testSpeed),
              feedRate: testFeed,
              plungeRate: testPlunge,
              stepover: sOver.stepover,
              stepoverPercent: sOver.stepoverPercent,
              tipSize: tTipSize,
              angle: tAngle,
              fluteLength: fLength,
              shankDiameter: sDiameter,
              name: toolName,
              notes: '',
            },
          });

          scanPos += 40;
          continue;
        }
      }
      scanPos += 2;
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
    rawBuffer: buffer,
    isBinary: true,
    detectedFileUnit,
    detectedSoftware: 'carveco',
    parsingNotes: `Successfully parsed ${tools.length} bits across ${groupsSet.size} groups from Carveco binary database.`,
  };
}

/**
 * Detect tool type from name
 */
export function detectToolType(name: string): ToolType {
  const lower = name.toLowerCase();
  if (lower.includes('bowl') || lower.includes('tray') || lower.includes('dish')) return 'bowl_tray';
  if (lower.includes('taper') || lower.includes('conical')) return 'conical';
  if (lower.includes('ball nose') || lower.includes('ballnose') || lower.includes('round ball')) return 'ballnose';
  if (lower.includes('v-bit') || lower.includes('v-groove') || lower.includes(' deg') || lower.includes('degree') || lower.includes('vbit') || lower.includes('chamfer')) return 'vbit';
  if (lower.includes('engrav')) return 'engraving';
  if (lower.includes('surfac') || lower.includes('fly') || lower.includes('flatten') || lower.includes('spoilboard') || lower.includes('face mill') || lower.includes('slab')) return 'surfacing';
  if (lower.includes('radiused') || lower.includes('bull nose') || lower.includes('bullnose')) return 'radiused';
  if (lower.includes('roundover') || lower.includes('round over') || lower.includes('ogee') || lower.includes('profile')) return 'roundover';
  if (lower.includes('drill')) return 'drill';
  return 'endmill';
}

/**
 * Detect flute count from name
 */
export function detectFluteCount(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('4-wing') || lower.includes('4 flute') || lower.includes('four flute') || lower.includes('4-flute') || lower.includes('4f')) return 4;
  if (lower.includes('3-wing') || lower.includes('triple flute') || lower.includes('3 flute') || lower.includes('3-flute') || lower.includes('3f')) return 3;
  if (lower.includes('o-flute') || lower.includes('single flute') || lower.includes('1 flute') || lower.includes('1-flute') || lower.includes('1f')) return 1;
  return 2; // Default CNC router bit is 2 flutes
}

/**
 * Detect tool angle from name or Carveco param2 (degrees)
 */
export function detectToolAngle(name: string, toolType: ToolType, param2?: number): number | undefined {
  const lower = name.toLowerCase();
  
  // Look for explicit degree mention: e.g. "60 deg", "60°", "60-degree", "3.82 deg", "15 deg"
  const degMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:deg|degree|°)/);
  if (degMatch) {
    const val = parseFloat(degMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 180) return val;
  }

  // Check if param2 contains a plausible angle (e.g. 15, 20, 30, 45, 60, 90, 120)
  if (param2 && (toolType === 'vbit' || toolType === 'engraving' || toolType === 'conical')) {
    if (param2 >= 10 && param2 <= 150) return param2;
  }

  // Default angles based on type
  if (toolType === 'vbit') {
    if (lower.includes('90')) return 90;
    if (lower.includes('60')) return 60;
    if (lower.includes('30')) return 30;
    if (lower.includes('45')) return 45;
    if (lower.includes('15')) return 15;
    return 60; // Standard V-bit
  }
  if (toolType === 'conical') {
    return 3.82; // Genmitsu tapered ball nose standard half-angle
  }
  if (toolType === 'engraving') {
    return 30; // Common engraving bit angle
  }

  return undefined;
}

/**
 * Detect Tip Size / Tip Radius (w or r)
 * - For Engraving bits / Flat V-bits: Tip flat width / diameter (w) (e.g. 0.1mm, 0.2mm, 0.005")
 * - For Conical / Tapered Ball Nose bits: Tip radius (r) (e.g. 0.25mm, 0.5mm)
 * - For Ball Nose: Tip radius (diameter / 2)
 * - For Radiused / Bull Nose: Corner radius (e.g. 0.5mm, 1/16")
 */
export function detectTipSize(
  name: string,
  toolType: ToolType,
  diameter: number,
  param2?: number,
  unit: 'mm' | 'inch' = 'mm'
): number | undefined {
  const lower = name.toLowerCase();

  // 1. Explicit tip in name: e.g. "0.1mm tip", "0.2 tip", "tip 0.1", "0.005\" tip"
  const tipMatch = lower.match(/tip\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:mm|")?\s*tip/);
  if (tipMatch) {
    const rawVal = parseFloat(tipMatch[1] || tipMatch[2]);
    if (!isNaN(rawVal) && rawVal > 0) return rawVal;
  }

  // 2. Explicit radius in name: e.g. "r0.25", "r0.5", "r0.5mm", "r1.0", "r1/16"
  const rMatch = lower.match(/r\s*(\d+(?:\.\d+)?)/);
  if (rMatch) {
    const rawVal = parseFloat(rMatch[1]);
    if (!isNaN(rawVal) && rawVal > 0) return rawVal;
  }
  if (lower.includes('r1/16')) return unit === 'inch' ? 0.0625 : 1.5875;
  if (lower.includes('r1/32')) return unit === 'inch' ? 0.03125 : 0.79375;

  // 3. For standard Ball Nose: tip radius is always exactly diameter / 2
  if (toolType === 'ballnose') {
    return Math.round((diameter / 2) * 10000) / 10000;
  }

  // 4. For Conical / Tapered bits: if param2 is small (radius), use it
  if (toolType === 'conical' || toolType === 'radiused') {
    if (param2 && param2 > 0 && param2 < diameter) {
      return Math.round(param2 * 10000) / 10000;
    }
    // Standard default for Genmitsu tapered ball nose is 0.5mm or 0.25mm
    return unit === 'inch' ? 0.0197 : 0.5;
  }

  // 5. For Engraving: standard flat tip is 0.1mm or 0.2mm
  if (toolType === 'engraving') {
    if (param2 && param2 > 0 && param2 < diameter) {
      return Math.round(param2 * 10000) / 10000;
    }
    return unit === 'inch' ? 0.005 : 0.1;
  }

  // 6. If param2 is non-zero and less than diameter for radiused/engraving
  if (param2 && param2 > 0 && param2 < diameter) {
    return Math.round(param2 * 10000) / 10000;
  }

  return undefined;
}

/**
 * Detect Stepover distance and percentage
 */
export function detectStepover(
  diameter: number,
  toolType: ToolType,
  param2?: number
): { stepover: number; stepoverPercent: number } {
  // If param2 is provided and is a plausible stepover (less than diameter)
  if (param2 && param2 > 0 && param2 < diameter && toolType === 'endmill') {
    const pct = Math.round((param2 / diameter) * 100);
    return { stepover: Math.round(param2 * 10000) / 10000, stepoverPercent: pct };
  }

  // For Ball Nose & Conical (relief carving): standard Carveco stepover is 8% to 10%
  if (toolType === 'ballnose' || toolType === 'conical') {
    const step = Math.round(diameter * 0.1 * 10000) / 10000;
    return { stepover: step, stepoverPercent: 10 };
  }

  // For End Mills & Surfacing: standard Carveco stepover is 40% (clearing) or 50%
  const step = Math.round(diameter * 0.4 * 10000) / 10000;
  return { stepover: step, stepoverPercent: 40 };
}

/**
 * Detect Shank Diameter from name or fallback to cutting diameter
 */
export function detectShankDiameter(name: string, diameter: number, unit: 'mm' | 'inch' = 'mm'): number {
  const lower = name.toLowerCase();
  if (lower.includes('1/4') && (lower.includes('shank') || lower.includes('shk'))) return unit === 'inch' ? 0.25 : 6.35;
  if (lower.includes('1/8') && (lower.includes('shank') || lower.includes('shk'))) return unit === 'inch' ? 0.125 : 3.175;
  if (lower.includes('4mm shank') || lower.includes('4mm shk')) return unit === 'inch' ? 0.1575 : 4.0;
  if (lower.includes('6mm shank') || lower.includes('6mm shk')) return unit === 'inch' ? 0.2362 : 6.0;
  if (lower.includes('8mm shank') || lower.includes('8mm shk')) return unit === 'inch' ? 0.315 : 8.0;
  if (lower.includes('1/2') && (lower.includes('shank') || lower.includes('shk'))) return unit === 'inch' ? 0.5 : 12.7;

  // By default for standard hobby router bits, shank is 1/8" (3.175mm) or 1/4" (6.35mm) or equals diameter
  if (diameter <= 3.2) return unit === 'inch' ? 0.125 : 3.175;
  if (diameter <= 6.35) return unit === 'inch' ? 0.25 : 6.35;
  return diameter;
}

/**
 * Detect Flute / Cutting Length (CEL)
 */
export function detectFluteLength(name: string, diameter: number, unit: 'mm' | 'inch' = 'mm'): number {
  const lower = name.toLowerCase();
  const celMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:mm|")?\s*(?:cel|cl|flute length|cut length)/);
  if (celMatch) {
    const val = parseFloat(celMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }
  // Standard cutting length is typically 2.5x to 3x diameter
  return Math.round(diameter * 3 * 100) / 100;
}

/**
 * Detect Material Group from Group name or tool text
 */
export function detectMaterialGroup(groupName: string, toolName: string): string {
  const combined = `${groupName} ${toolName}`.toLowerCase();
  if (combined.includes('aluminum') || combined.includes('aluminium') || combined.includes('brass') || combined.includes('non-ferrous')) {
    return 'Aluminum (6061 / 5052)';
  }
  if (combined.includes('acrylic') || combined.includes('plastic') || combined.includes('polycarbonate') || combined.includes('o-flute')) {
    return 'Plastics & Acrylic';
  }
  if (combined.includes('hardwood') || combined.includes('oak') || combined.includes('walnut') || combined.includes('maple')) {
    return 'Hardwood';
  }
  if (combined.includes('softwood') || combined.includes('pine') || combined.includes('cedar')) {
    return 'Softwood';
  }
  if (combined.includes('mdf') || combined.includes('plywood')) {
    return 'MDF & Plywood';
  }
  return 'General / All Materials';
}

/**
 * Helper to extract diameter from text strings (e.g. '1/8"', '3.175mm', '6mm', '1/4 inch', '0.25')
 */
export function extractDiameterFromName(name: string): number {
  const lower = name.toLowerCase();

  // Metric mm match (e.g. 3.175mm, 3,175 mm, 6mm, 12.7mm, 0.8mm)
  const mmMatch = lower.match(/(\d+([.,]\d+)?)\s*mm/);
  if (mmMatch) {
    const val = parseFloat(mmMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0 && val < 100) return val;
  }

  // Fractional inches (1/8", 1/4", 1/16", 1/32", 3/8", 1/2")
  if (lower.includes('1/8')) return 3.175;
  if (lower.includes('1/4')) return 6.35;
  if (lower.includes('1/16')) return 1.5875;
  if (lower.includes('1/32')) return 0.79375;
  if (lower.includes('3/8')) return 9.525;
  if (lower.includes('1/2')) return 12.7;

  // Decimal inch match (0.25", 0.125", .25")
  const inchMatch = lower.match(/(0?\.\d+)\s*["'in]/);
  if (inchMatch) {
    const val = parseFloat(inchMatch[1]);
    if (!isNaN(val) && val > 0 && val < 5) return val * 25.4;
  }

  return 3.175; // Default 1/8"
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
 * Clean floating point numbers parsed from strings with support for European comma decimals (3,175)
 */
function parseNumberClean(val: any, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).trim().replace(/["'\s]/g, '');
  // If comma is decimal separator (e.g. 3,175 or 0,5)
  const normalized = str.includes(',') && !str.includes('.') ? str.replace(',', '.') : str.replace(',', '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Auto-detect delimiter across text lines (comma, semicolon, tab, pipe)
 * Crucial for European Excel exports where semicolon ';' is the default!
 */
export function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 15);
  const counts = { ';': 0, ',': 0, '\t': 0, '|': 0 };

  for (const line of sample) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (c === ';') counts[';']++;
        else if (c === ',') counts[',']++;
        else if (c === '\t') counts['\t']++;
        else if (c === '|') counts['|']++;
      }
    }
  }

  // Prioritize semicolon if significant, as European CSVs will have zero commas or commas only inside numbers
  if (counts[';'] > counts[','] && counts[';'] >= sample.length) return ';';
  if (counts['\t'] > counts[','] && counts['\t'] >= sample.length) return '\t';
  if (counts['|'] > counts[','] && counts['|'] >= sample.length) return '|';
  return ',';
}

/**
 * Parses plain text / CSV / TSV / Semicolon / JSON tool files
 * Handles English, Dutch, German, French headers, European comma decimals, and G-code comments!
 */
export function parseTextTools(
  text: string,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  // Strip UTF-8 BOM if present
  let cleanText = text.replace(/^\uFEFF/, '').trim();

  // 1. Check if JSON format
  if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
    try {
      const parsed = JSON.parse(cleanText);
      return parseJsonTools(parsed, fileName, forcedUnit);
    } catch {
      // Continue to delimited parser
    }
  }

  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
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
      parsingNotes: 'File was empty or contained no text lines.',
    };
  }

  // Check if G-code / Candle / GRBL file
  const isGcode = lines.some(l => /^(G\d|M\d|T\d|S\d|F\d|\()/i.test(l)) || /\.(nc|gcode|tap|ngc)$/i.test(fileName);
  if (isGcode) {
    return parseGcodeTools(lines, fileName, forcedUnit);
  }

  // Auto-detect delimiter
  const separator = detectDelimiter(lines);
  const headerParts = splitCsvLine(lines[0], separator).map(h => h.trim().toLowerCase());

  // Multilingual column mapping
  let colName = -1;
  let colGroup = -1;
  let colToolNo = -1;
  let colDiameter = -1;
  let colStepdown = -1;
  let colSpindle = -1;
  let colFeed = -1;
  let colPlunge = -1;
  let colFlutes = -1;
  let colNotes = -1;
  let colUnits = -1;
  let colType = -1;

  for (let idx = 0; idx < headerParts.length; idx++) {
    const h = headerParts[idx];
    if (colName === -1 && (h.includes('name') || h.includes('naam') || h.includes('tool') || h.includes('gereedschap') || h.includes('label') || h.includes('description') || h.includes('omschrijving'))) {
      colName = idx;
    } else if (colGroup === -1 && (h.includes('group') || h.includes('groep') || h.includes('category') || h.includes('categorie') || h.includes('vendor') || h.includes('merk') || h.includes('leverancier'))) {
      colGroup = idx;
    } else if (colToolNo === -1 && (h.includes('tool no') || h.includes('tool number') || h.includes('toolnumber') || h.includes('nummer') || h.includes('nr') || h.includes('id') || h === 't' || h === 'tool #')) {
      colToolNo = idx;
    } else if (colDiameter === -1 && (h.includes('diameter') || h.includes('diam') || h.includes('breedte') || h.includes('maat') || h.includes('size') || h === 'd' || h === 'dc')) {
      colDiameter = idx;
    } else if (colStepdown === -1 && (h.includes('stepdown') || h.includes('pass depth') || h.includes('depth per pass') || h.includes('diepte') || h.includes('snedediepte') || h.includes('doc') || h.includes('depth of cut') || h.includes('ap'))) {
      colStepdown = idx;
    } else if (colSpindle === -1 && (h.includes('spindle') || h.includes('rpm') || h.includes('speed') || h.includes('toerental') || h.includes('rotatie') || h.includes('toeren') || h === 's')) {
      colSpindle = idx;
    } else if (colFeed === -1 && (h.includes('feed') || h.includes('feedrate') || h.includes('feed rate') || h.includes('voeding') || h.includes('snelheid') || h === 'f')) {
      colFeed = idx;
    } else if (colPlunge === -1 && (h.includes('plunge') || h.includes('plungerate') || h.includes('duikvoeding') || h.includes('duik') || h.includes('z feed') || h.includes('fz'))) {
      colPlunge = idx;
    } else if (colFlutes === -1 && (h.includes('flute') || h.includes('tanden') || h.includes('snijkanten') || h.includes('nof'))) {
      colFlutes = idx;
    } else if (colUnits === -1 && (h.includes('unit') || h.includes('units') || h.includes('eenheid'))) {
      colUnits = idx;
    } else if (colType === -1 && (h.includes('type') || h.includes('soort') || h.includes('vorm'))) {
      colType = idx;
    } else if (colNotes === -1 && (h.includes('notes') || h.includes('opmerkingen') || h.includes('comment') || h.includes('info'))) {
      colNotes = idx;
    }
  }

  const hasRecognizedHeader = colDiameter !== -1 || colFeed !== -1 || colSpindle !== -1;
  const startIndex = hasRecognizedHeader ? 1 : 0;

  let detectedSoftware: 'carveco' | 'easel' | 'vectric' | 'carbide_create' | 'generic' = 'generic';
  const headerLower = lines[0].toLowerCase();
  if (headerLower.includes('pass depth') || headerLower.includes('stepover') || headerLower.includes('units')) {
    detectedSoftware = 'vectric';
  } else if (headerLower.includes('depth of cut') || headerLower.includes('feedrate')) {
    detectedSoftware = 'carbide_create';
  } else if (headerLower.includes('depth per pass') || headerLower.includes('cutting diameter')) {
    detectedSoftware = 'easel';
  } else if (headerLower.includes('tool') || headerLower.includes('name') || headerLower.includes('diameter')) {
    detectedSoftware = 'carveco';
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts = splitCsvLine(line, separator);
    if (parts.length < 2) continue;

    let name = `Tool ${tools.length + 1}`;
    let group = 'Imported Bits';
    let toolNo = tools.length + 1;
    let diameter = 3.175;
    let stepdown = 1.0;
    let spindleSpeed = 18000;
    let feedRate = 800;
    let plungeRate = 200;
    let flutes = 2;
    let notes = '';
    let rowUnitHint = '';

    if (hasRecognizedHeader) {
      if (colName !== -1 && parts[colName]) name = parts[colName].trim();
      if (colGroup !== -1 && parts[colGroup]) group = parts[colGroup].trim();
      if (colToolNo !== -1 && parts[colToolNo]) toolNo = parseInt(parts[colToolNo], 10) || toolNo;
      if (colDiameter !== -1 && parts[colDiameter]) diameter = parseNumberClean(parts[colDiameter], diameter);
      if (colStepdown !== -1 && parts[colStepdown]) stepdown = parseNumberClean(parts[colStepdown], stepdown);
      if (colSpindle !== -1 && parts[colSpindle]) spindleSpeed = Math.round(parseNumberClean(parts[colSpindle], spindleSpeed));
      if (colFeed !== -1 && parts[colFeed]) feedRate = parseNumberClean(parts[colFeed], feedRate);
      if (colPlunge !== -1 && parts[colPlunge]) plungeRate = parseNumberClean(parts[colPlunge], plungeRate);
      if (colFlutes !== -1 && parts[colFlutes]) flutes = parseInt(parts[colFlutes], 10) || flutes;
      if (colNotes !== -1 && parts[colNotes]) notes = parts[colNotes].trim();
      if (colUnits !== -1 && parts[colUnits]) rowUnitHint = parts[colUnits].trim().toLowerCase();
    } else {
      // Positional heuristic parser for headerless CSVs
      name = parts[0]?.trim() || `Tool ${tools.length + 1}`;

      // Search parts for numbers
      const numericParts: number[] = [];
      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const num = parseNumberClean(parts[pIdx], NaN);
        if (!isNaN(num)) numericParts.push(num);
      }

      if (numericParts.length >= 1) {
        // Find RPM (usually >= 1000)
        const rpmVal = numericParts.find(n => n >= 1000);
        if (rpmVal) spindleSpeed = Math.round(rpmVal);

        // Find diameter (usually between 0.1 and 60)
        const diamVal = numericParts.find(n => n > 0.05 && n <= 50 && n !== rpmVal);
        if (diamVal !== undefined) diameter = diamVal;

        // Find feed rate (between 10 and 10000)
        const feedVal = numericParts.find(n => n >= 50 && n < 10000 && n !== rpmVal && n !== diameter);
        if (feedVal !== undefined) feedRate = feedVal;

        // Find stepdown (usually <= diameter)
        const stepVal = numericParts.find(n => n > 0 && n <= diameter * 2 && n !== diameter);
        if (stepVal !== undefined) stepdown = stepVal;
        else stepdown = Math.round(diameter * 0.5 * 100) / 100;

        plungeRate = Math.round(feedRate * 0.3);
      }
    }

    if (!diameter || diameter <= 0) {
      diameter = extractDiameterFromName(name);
    }
    if (!stepdown || stepdown <= 0) {
      stepdown = Math.round(diameter * 0.4 * 100) / 100;
    }

    const detected = detectBitUnit(
      rowUnitHint.includes('mm') ? 1 : rowUnitHint.includes('in') ? 0 : 0,
      diameter,
      feedRate,
      feedRate >= 300 ? 2 : 4,
      name,
      group,
      fileName,
      forcedUnit
    );

    groupsSet.add(group);

    const tType = detectToolType(name);
    const fCount = flutes || detectFluteCount(name);
    const tAngle = detectToolAngle(name, tType, diameter);
    const tTipSize = detectTipSize(name, tType, diameter, undefined, detected.unit);
    const sOver = detectStepover(diameter, tType);
    const sDiameter = detectShankDiameter(name, diameter, detected.unit);
    const fLength = detectFluteLength(name, diameter, detected.unit);
    const matGroup = detectMaterialGroup(group, name);

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
      tipSize: tTipSize,
      angle: tAngle,
      stepover: sOver.stepover,
      stepoverPercent: sOver.stepoverPercent,
      shankDiameter: sDiameter,
      fluteLength: fLength,
      materialGroup: matGroup,
      stepdown,
      spindleSpeed,
      feedRate,
      plungeRate,
      feedUnit: detected.unit === 'mm' ? 2 : 4,
      plungeUnit: detected.unit === 'mm' ? 2 : 3,
      toolType: tType,
      fluteCount: fCount,
      originalValues: {
        diameter,
        param2: diameter,
        stepdown,
        spindleSpeed,
        feedRate,
        plungeRate,
        stepover: sOver.stepover,
        stepoverPercent: sOver.stepoverPercent,
        tipSize: tTipSize,
        angle: tAngle,
        fluteLength: fLength,
        shankDiameter: sDiameter,
        name,
        notes,
      },
    });
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
    parsingNotes: `Successfully parsed ${tools.length} bits from ${separator === ';' ? 'semicolon (European)' : separator === '\t' ? 'tab' : 'comma'} delimited file.`,
  };
}

/**
 * Parses JSON formats: Fusion 360 .tools, Inventables Easel, or native Carveco tools JSON
 * Robustly checks object wrappers ({ tools: [...] }, { data: [...] }, { bits: [...] })
 */
export function parseJsonTools(
  json: any,
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>();
  let detectedSoftware: 'fusion360' | 'easel' | 'carveco' | 'generic' = 'generic';

  // Extract tool array from wrapping objects if needed
  let toolArray: any[] = [];
  if (Array.isArray(json)) {
    toolArray = json;
  } else if (json && typeof json === 'object') {
    if (Array.isArray(json.data)) {
      toolArray = json.data;
      if (json.data[0]?.geometry) detectedSoftware = 'fusion360';
    } else if (Array.isArray(json.tools)) {
      toolArray = json.tools;
    } else if (Array.isArray(json.bits)) {
      toolArray = json.bits;
    } else if (Array.isArray(json.items)) {
      toolArray = json.items;
    } else if (Array.isArray(json.library)) {
      toolArray = json.library;
    } else if (Array.isArray(json.custom_tools)) {
      toolArray = json.custom_tools;
      detectedSoftware = 'easel';
    } else if (Array.isArray(json.customTools)) {
      toolArray = json.customTools;
    }
  }

  // 1. Fusion 360 CAM Tool Library format: { version: 1, data: [ ... ] }
  if (detectedSoftware === 'fusion360' || (toolArray.length > 0 && toolArray[0]?.geometry)) {
    detectedSoftware = 'fusion360';
    for (const item of toolArray) {
      const name = item.description || item.type || `Fusion Tool ${tools.length + 1}`;
      const group = item.vendor || 'Fusion 360 Library';
      groupsSet.add(group);

      const diameter = parseNumberClean(item.geometry?.DC, 6.35);
      const flutes = item.geometry?.NOF || 2;
      const preset = item['cutting-data']?.presets?.[0] || {};
      const spindleSpeed = parseNumberClean(preset.n, 18000);
      const feedRate = parseNumberClean(preset.v_f, 1200);
      const plungeRate = parseNumberClean(preset.v_f_plunge, 300);
      const stepdown = parseNumberClean(preset.stepdown, diameter * 0.5);
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
  // 2. Easel JSON format: items with cutting_diameter or depth_per_pass
  else if (
    toolArray.length > 0 &&
    ('cutting_diameter' in toolArray[0] ||
      'depth_per_pass' in toolArray[0] ||
      'cuttingDiameter' in toolArray[0] ||
      'depthPerPass' in toolArray[0] ||
      detectedSoftware === 'easel')
  ) {
    detectedSoftware = 'easel';
    for (const item of toolArray) {
      const name = item.name || item.description || `Easel Bit ${tools.length + 1}`;
      const group = item.group || item.vendor || 'Easel Bits';
      groupsSet.add(group);

      const diameter = parseNumberClean(
        item.cutting_diameter || item.cuttingDiameter || item.diameter,
        3.175
      );
      const stepdown = parseNumberClean(
        item.depth_per_pass || item.depthPerPass || item.stepdown,
        diameter * 0.5
      );
      const feedRate = parseNumberClean(item.feed_rate || item.feedRate || item.feed, 500);
      const plungeRate = parseNumberClean(item.plunge_rate || item.plungeRate || item.plunge, 150);
      const spindleSpeed = Math.round(
        parseNumberClean(item.rpm || item.spindle_speed || item.spindleSpeed || item.speed, 18000)
      );
      const flutes = item.flutes || item.fluteCount || 2;

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
  else if (toolArray.length > 0) {
    detectedSoftware = 'carveco';
    for (const item of toolArray) {
      if (item.name && (item.diameter !== undefined || item.size !== undefined)) {
        const group = item.group || 'Imported Bits';
        groupsSet.add(group);
        const diam = parseNumberClean(item.diameter || item.size, 3.175);
        const feed = parseNumberClean(item.feedRate || item.feed_rate, 800);
        const rpm = Math.round(parseNumberClean(item.spindleSpeed || item.spindle_speed || item.rpm, 18000));
        const step = parseNumberClean(item.stepdown || item.depth_per_pass, diam * 0.5);
        const plunge = parseNumberClean(item.plungeRate || item.plunge_rate, 200);

        const detected = detectBitUnit(
          item.unitFlag !== undefined ? item.unitFlag : item.unit === 'mm' ? 1 : 0,
          diam,
          feed,
          item.feedUnit || (feed >= 300 ? 2 : 4),
          item.name,
          group,
          fileName,
          forcedUnit
        );

        tools.push({
          ...item,
          id: item.id || `tool-${tools.length + 1}`,
          diameter: diam,
          param2: item.param2 || diam,
          stepdown: step,
          spindleSpeed: rpm,
          feedRate: feed,
          plungeRate: plunge,
          unitFlag: detected.unitFlag,
          unit: detected.unit,
          feedUnit: item.feedUnit || (detected.unit === 'mm' ? 2 : 4),
          plungeUnit: item.plungeUnit || (detected.unit === 'mm' ? 2 : 3),
          toolType: item.toolType || detectToolType(item.name),
          fluteCount: item.fluteCount || detectFluteCount(item.name),
          originalValues: item.originalValues || {
            diameter: diam,
            param2: item.param2 || diam,
            stepdown: step,
            spindleSpeed: rpm,
            feedRate: feed,
            plungeRate: plunge,
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
    parsingNotes: `Successfully parsed ${tools.length} bits from JSON format.`,
  };
}

/**
 * Parses tool comments from G-code / Candle / GRBL files (.nc, .gcode, .tap)
 */
export function parseGcodeTools(
  lines: string[],
  fileName: string = '',
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): ParseResult {
  const tools: CarvecoTool[] = [];
  const groupsSet = new Set<string>(['Candle / GRBL Tools']);

  let currentToolNo = 1;
  let currentToolName = '';
  let currentRpm = 10000;
  let currentFeed = 800;

  for (const line of lines) {
    // Check for Tool change: T1 M6 or M6 T1
    const tMatch = line.match(/T(\d+)/i);
    if (tMatch) {
      currentToolNo = parseInt(tMatch[1], 10) || currentToolNo;
    }

    // Check for Spindle RPM: S12000
    const sMatch = line.match(/S(\d+)/i);
    if (sMatch) {
      currentRpm = parseInt(sMatch[1], 10) || currentRpm;
    }

    // Check for Feed rate: F800
    const fMatch = line.match(/F(\d+(\.\d+)?)/i);
    if (fMatch) {
      currentFeed = parseFloat(fMatch[1]) || currentFeed;
    }

    // Check for comment with tool description: (Tool: 3.175mm End Mill)
    const commentMatch = line.match(/\((.*?)\)/);
    if (commentMatch) {
      const c = commentMatch[1].trim();
      if (
        c.toLowerCase().includes('tool') ||
        c.toLowerCase().includes('bit') ||
        c.toLowerCase().includes('mill') ||
        c.toLowerCase().includes('cutter') ||
        c.toLowerCase().includes('mm') ||
        c.toLowerCase().includes('genmitsu')
      ) {
        currentToolName = c.replace(/tool\s*#?\d*[:=-]?\s*/i, '').trim();
      }
    }

    // If we have a tool name or reached a tool change command
    if (line.includes('M6') || (currentToolName && tools.every(t => t.toolNo !== currentToolNo))) {
      const name = currentToolName || `Tool #${currentToolNo}`;
      const diam = extractDiameterFromName(name);
      const detected = detectBitUnit(
        diam >= 1.0 && diam <= 50 ? 1 : 0,
        diam,
        currentFeed,
        currentFeed >= 300 ? 2 : 4,
        name,
        'Candle / GRBL Tools',
        fileName,
        forcedUnit
      );

      tools.push({
        id: `tool-${tools.length + 1}`,
        name,
        group: 'Candle / GRBL Tools',
        notes: `Extracted from ${fileName}`,
        toolNo: currentToolNo,
        unitFlag: detected.unitFlag,
        unit: detected.unit,
        diameter: diam,
        param2: diam,
        stepdown: Math.round(diam * 0.5 * 100) / 100,
        spindleSpeed: currentRpm,
        feedRate: currentFeed,
        plungeRate: Math.round(currentFeed * 0.3),
        feedUnit: detected.unit === 'mm' ? 2 : 4,
        plungeUnit: detected.unit === 'mm' ? 2 : 3,
        toolType: detectToolType(name),
        fluteCount: detectFluteCount(name),
        originalValues: {
          diameter: diam,
          param2: diam,
          stepdown: Math.round(diam * 0.5 * 100) / 100,
          spindleSpeed: currentRpm,
          feedRate: currentFeed,
          plungeRate: Math.round(currentFeed * 0.3),
          name,
          notes: '',
        },
      });

      currentToolName = '';
      currentToolNo = tools.length + 1;
    }
  }

  return {
    tools,
    groups: Array.from(groupsSet),
    rawBuffer: new ArrayBuffer(0),
    isBinary: false,
    detectedFileUnit: 'metric',
    detectedSoftware: 'candle_grbl',
    parsingNotes: `Extracted ${tools.length} tool definitions from G-code program.`,
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
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
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
      notes: t.notes || `Group: ${t.group}`,
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
      t.param2 || Math.round(t.diameter * 0.4 * 1000) / 1000,
      t.spindleSpeed,
      t.feedRate,
      t.plungeRate,
      t.toolNo,
      escapeCsv(t.notes || `Group: ${t.group}`),
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
            name: 'CNC Spindle Preset',
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
      t.param2 || Math.round(t.diameter * 0.5 * 1000) / 1000,
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Candle (GRBL) Tool Library & G-code header snippet export
 * Official tool specification for Genmitsu CNCs running Candle GRBL
 */
export function exportToCandleGrblTools(tools: CarvecoTool[]): string {
  const lines: string[] = [
    '; =========================================================',
    '; GENMITSU / CANDLE GRBL CNC TOOL LIBRARY & PRESET HEADER',
    '; Calibrated for Genmitsu 3018, 3020, 4040, and PROVerXL',
    `; Total Bits Defined: ${tools.length}`,
    '; =========================================================',
    '',
  ];

  tools.forEach(t => {
    const isMetric = isToolMetric(t);
    const unitStr = isMetric ? 'mm' : 'in';
    const feedUnitStr = isMetric ? 'mm/min' : 'IPM';

    lines.push(`; --- Tool ${t.toolNo}: ${t.name} ---`);
    lines.push(`; Group: ${t.group}`);
    lines.push(`; Diameter: ${t.diameter} ${unitStr} | Stepdown: ${t.stepdown} ${unitStr}`);
    lines.push(`; Spindle: S${t.spindleSpeed} RPM | Feed: F${t.feedRate} ${feedUnitStr} | Plunge: F${t.plungeRate}`);
    lines.push(`T${t.toolNo} M6 (${escapeCsv(t.name).replace(/"/g, '')})`);
    lines.push(`S${t.spindleSpeed} M3`);
    lines.push(`G4 P1`);
    lines.push(`F${t.feedRate}`);
    lines.push('');
  });

  return lines.join('\r\n');
}

/**
 * Universal Gcode Sender (UGS) Tool Table CSV export
 */
export function exportToUgsCsv(tools: CarvecoTool[]): string {
  const headers = ['Number', 'Name', 'Diameter', 'Type', 'Description'];
  const rows = tools.map(t => [
    t.toolNo,
    escapeCsv(t.name),
    t.diameter,
    t.toolType,
    escapeCsv(`${t.group} - S${t.spindleSpeed} F${t.feedRate}`),
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Universal auto-detector and parser.
 * Bulletproof fallback logic: Never crashes, checks both binary and text,
 * handles UTF-8 BOM, European semicolons, and corrupt header bytes.
 */
export async function parseUploadedFile(
  file: File,
  forcedUnit?: 'metric' | 'imperial' | 'auto'
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const lowerName = file.name.toLowerCase();
  const isTdbExt = lowerName.endsWith('.tdb') || lowerName.endsWith('.tbd');

  // Check if binary Carveco / ArtCAM
  const textHeader = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 200));
  const hasBinarySignature =
    textHeader.includes('tpmDB_') ||
    textHeader.includes('ArtCAM') ||
    textHeader.includes('Carveco') ||
    (bytes[0] === 0xc2 && bytes[1] === 0x00);

  // Check for presence of binary null bytes in first 512 bytes
  let nullCount = 0;
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    if (bytes[i] === 0x00) nullCount++;
  }
  const isLikelyBinary = isTdbExt || hasBinarySignature || (nullCount > 20 && !lowerName.endsWith('.txt') && !lowerName.endsWith('.csv') && !lowerName.endsWith('.json'));

  // Attempt binary parsing first if binary indicators are present
  if (isLikelyBinary) {
    try {
      const binaryResult = parseBinaryTdb(arrayBuffer, file.name, forcedUnit);
      if (binaryResult.tools.length > 0) {
        return binaryResult;
      }
    } catch (e) {
      console.warn('Binary parse error, attempting text fallback:', e);
    }
  }

  // Attempt UTF-8 text / CSV / JSON parsing
  try {
    const text = new TextDecoder('utf-8').decode(bytes);
    const textResult = parseTextTools(text, file.name, forcedUnit);
    if (textResult.tools.length > 0) {
      return textResult;
    }
  } catch (e) {
    console.warn('Text parse error:', e);
  }

  // If text parsing returned 0 tools and we haven't tried binary yet, try binary
  if (!isLikelyBinary) {
    try {
      const binaryResult = parseBinaryTdb(arrayBuffer, file.name, forcedUnit);
      if (binaryResult.tools.length > 0) {
        return binaryResult;
      }
    } catch {
      // Fall through
    }
  }

  // Return empty result with clear diagnostic notes
  return {
    tools: [],
    groups: [],
    rawBuffer: arrayBuffer,
    isBinary: isLikelyBinary,
    detectedFileUnit: 'metric',
    detectedSoftware: 'generic',
    parsingNotes: `Could not parse tools from "${file.name}" (${bytes.length} bytes). Ensure the file contains recognizable CNC tool parameters (diameter, spindle speed, feed rate).`,
  };
}
