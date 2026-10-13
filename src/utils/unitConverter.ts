import { CarvecoTool } from '../types/tool';

export type DisplayUnitMode = 'metric' | 'imperial' | 'native';

/**
 * Standard fraction lookup for common CNC router bits
 */
export function getInchFraction(inches: number): string | null {
  const rounded = Math.round(inches * 10000) / 10000;
  if (Math.abs(rounded - 0.03125) < 0.002) return '1/32"';
  if (Math.abs(rounded - 0.0625) < 0.002) return '1/16"';
  if (Math.abs(rounded - 0.09375) < 0.002) return '3/16"';
  if (Math.abs(rounded - 0.125) < 0.002) return '1/8"';
  if (Math.abs(rounded - 0.15625) < 0.002) return '5/32"';
  if (Math.abs(rounded - 0.1875) < 0.002) return '3/16"';
  if (Math.abs(rounded - 0.25) < 0.002) return '1/4"';
  if (Math.abs(rounded - 0.3125) < 0.002) return '5/16"';
  if (Math.abs(rounded - 0.375) < 0.002) return '3/8"';
  if (Math.abs(rounded - 0.5) < 0.002) return '1/2"';
  if (Math.abs(rounded - 0.625) < 0.002) return '5/8"';
  if (Math.abs(rounded - 0.75) < 0.002) return '3/4"';
  if (Math.abs(rounded - 1.0) < 0.002) return '1"';
  if (Math.abs(rounded - 1.25) < 0.002) return '1-1/4"';
  if (Math.abs(rounded - 1.5) < 0.002) return '1-1/2"';
  if (Math.abs(rounded - 2.0) < 0.002) return '2"';
  if (Math.abs(rounded - 2.5) < 0.002) return '2-1/2"';
  return null;
}

/**
 * Checks whether a numerical diameter value is a metric millimeter value
 */
export function isMetricDiameterValue(dia: number, name: string = ''): boolean {
  const lower = name.toLowerCase();
  if (lower.includes('mm')) return true;

  // Specific common metric equivalents of imperial shanks used by Genmitsu / SainSmart
  if (Math.abs(dia - 3.175) < 0.005) return true; // 1/8" = 3.175mm
  if (Math.abs(dia - 6.35) < 0.005) return true;  // 1/4" = 6.35mm
  if (Math.abs(dia - 9.525) < 0.005) return true; // 3/8" = 9.525mm
  if (Math.abs(dia - 12.7) < 0.005) return true;  // 1/2" = 12.7mm

  // Standard metric bit diameters (0.8mm to 35mm)
  // Check if it's an imperial surfacing bit (e.g. Whiteside 2" or 2.5" fly cutter)
  const isSurfacing = lower.includes('surfac') || lower.includes('fly') || lower.includes('spoilboard') || lower.includes('flatten');
  if (isSurfacing && (dia === 2.0 || dia === 2.5 || dia === 3.0)) {
    return false;
  }

  // Any milling cutter with diameter between 1.2 and 40 on hobby CNC is stored in millimeters
  if (dia >= 1.2 && dia <= 40) {
    return true;
  }

  return false;
}

/**
 * Robustly checks whether a tool is natively metric (mm) based on unit flag,
 * explicit feed units, feed magnitude, diameter magnitude, or tool name.
 */
export function isToolMetric(tool: CarvecoTool): boolean {
  // If explicitly flagged
  if (tool.unit === 'mm' || tool.unitFlag === 1) return true;

  // Check explicit feed units in Carveco (1 = mm/sec, 2 = mm/min)
  if (tool.feedUnit === 1 || tool.feedUnit === 2) return true;

  // Check if feed rate is in mm/min (>= 300 mm/min is standard for wood/plastics)
  if (tool.feedRate >= 300) return true;

  // Check if name has mm
  if (tool.name.toLowerCase().includes('mm') || tool.group.toLowerCase().includes('metric')) return true;

  // Check if raw diameter value is a known metric dimension
  if (isMetricDiameterValue(tool.diameter, tool.name)) return true;

  // Otherwise imperial
  return false;
}

/**
 * Checks if a tool has a suspicious / corrupt diameter
 * e.g., an 80.65mm or 161.29mm bit caused by multiplying a 3.175mm or 6.35mm bit by 25.4
 */
export function isSuspiciousToolDiameter(tool: CarvecoTool): boolean {
  const isSurfacing = tool.name.toLowerCase().includes('surfac') || tool.name.toLowerCase().includes('spoilboard');
  if (isSurfacing) return false;

  // 80.65 mm (3.175 * 25.4) or 161.29 mm (6.35 * 25.4) or 101.6 mm (4.0 * 25.4)
  if (tool.diameter > 45 && !isSurfacing) return true;
  if (Math.abs(tool.diameter - 80.645) < 0.1) return true;
  if (Math.abs(tool.diameter - 161.29) < 0.2) return true;
  if (Math.abs(tool.diameter - 101.6) < 0.2) return true;

  return false;
}

/**
 * Gets diameter formatted for display according to the active unit mode
 */
export function getDisplayDiameter(
  tool: CarvecoTool,
  mode: DisplayUnitMode
): {
  value: number;
  formatted: string;
  unit: string;
  fraction: string | null;
  nativeNote: string;
  isSuspicious: boolean;
} {
  const isMetric = isToolMetric(tool);
  const isSuspicious = isSuspiciousToolDiameter(tool);

  // Compute values in mm and inches
  let mmVal = tool.diameter;
  let inVal = tool.diameter;

  if (isMetric) {
    mmVal = tool.diameter;
    inVal = tool.diameter / 25.4;
  } else {
    inVal = tool.diameter;
    mmVal = tool.diameter * 25.4;
  }

  const fraction = getInchFraction(inVal);

  const formatMm = (val: number): string => {
    if (val % 1 === 0) return `${val} mm`;
    if (Math.abs(val - 3.175) < 0.005) return '3.18 mm';
    if (Math.abs(val - 6.35) < 0.005) return '6.35 mm';
    if (Math.abs(val - 9.525) < 0.005) return '9.53 mm';
    if (Math.abs(val - 12.7) < 0.005) return '12.7 mm';
    const rounded = Math.round(val * 100) / 100;
    return `${rounded} mm`;
  };

  const nativeNote = isMetric
    ? formatMm(tool.diameter)
    : fraction
    ? `${fraction} (${tool.diameter}")`
    : `${tool.diameter.toFixed(tool.diameter < 0.1 ? 4 : 3)}"`;

  if (mode === 'native') {
    if (isMetric) {
      return {
        value: tool.diameter,
        formatted: formatMm(tool.diameter),
        unit: 'mm',
        fraction,
        nativeNote,
        isSuspicious,
      };
    } else {
      return {
        value: tool.diameter,
        formatted: fraction ? `${fraction}` : `${tool.diameter.toFixed(tool.diameter < 0.1 ? 4 : 3)}"`,
        unit: 'in',
        fraction,
        nativeNote,
        isSuspicious,
      };
    }
  }

  if (mode === 'metric') {
    return {
      value: mmVal,
      formatted: formatMm(mmVal),
      unit: 'mm',
      fraction,
      nativeNote,
      isSuspicious,
    };
  } else {
    // mode === 'imperial'
    return {
      value: inVal,
      formatted: fraction ? `${fraction}` : `${inVal.toFixed(inVal < 0.1 ? 4 : 3)}"`,
      unit: 'in',
      fraction,
      nativeNote,
      isSuspicious,
    };
  }
}

/**
 * Gets stepdown formatted for display according to the active unit mode
 */
export function getDisplayStepdown(
  tool: CarvecoTool,
  mode: DisplayUnitMode
): { value: number; formatted: string; unit: string } {
  const isMetric = isToolMetric(tool);

  if (mode === 'native') {
    if (isMetric) {
      return {
        value: tool.stepdown,
        formatted: `${tool.stepdown.toFixed(2)} mm`,
        unit: 'mm',
      };
    } else {
      return {
        value: tool.stepdown,
        formatted: `${tool.stepdown.toFixed(3)}"`,
        unit: 'in',
      };
    }
  }

  if (mode === 'metric') {
    const mmVal = isMetric ? tool.stepdown : tool.stepdown * 25.4;
    return {
      value: mmVal,
      formatted: `${mmVal.toFixed(2)} mm`,
      unit: 'mm',
    };
  } else {
    const inVal = isMetric ? tool.stepdown / 25.4 : tool.stepdown;
    return {
      value: inVal,
      formatted: `${inVal.toFixed(3)}"`,
      unit: 'in',
    };
  }
}

/**
 * Gets feed rate formatted for display according to the active unit mode
 */
export function getDisplayFeedRate(
  tool: CarvecoTool,
  mode: DisplayUnitMode
): { value: number; formatted: string; unit: string } {
  const isMetric = isToolMetric(tool);
  const feedIsMetric = isMetric || tool.feedUnit === 1 || tool.feedUnit === 2 || tool.feedRate > 300;

  if (mode === 'native') {
    if (feedIsMetric) {
      return {
        value: tool.feedRate,
        formatted: `${Math.round(tool.feedRate)} mm/min`,
        unit: 'mm/min',
      };
    } else {
      return {
        value: tool.feedRate,
        formatted: `${Math.round(tool.feedRate * 10) / 10} IPM`,
        unit: 'IPM',
      };
    }
  }

  if (mode === 'metric') {
    const mmMin = feedIsMetric ? tool.feedRate : tool.feedRate * 25.4;
    return {
      value: mmMin,
      formatted: `${Math.round(mmMin)} mm/min`,
      unit: 'mm/min',
    };
  } else {
    const ipm = feedIsMetric ? tool.feedRate / 25.4 : tool.feedRate;
    return {
      value: ipm,
      formatted: `${Math.round(ipm * 10) / 10} IPM`,
      unit: 'IPM',
    };
  }
}

/**
 * Gets plunge rate formatted for display
 */
export function getDisplayPlungeRate(
  tool: CarvecoTool,
  mode: DisplayUnitMode
): { value: number; formatted: string; unit: string } {
  const isMetric = isToolMetric(tool);
  const feedIsMetric = isMetric || tool.plungeUnit === 1 || tool.plungeUnit === 2 || tool.plungeRate > 300;

  if (mode === 'native') {
    if (feedIsMetric) {
      return {
        value: tool.plungeRate,
        formatted: `${Math.round(tool.plungeRate)} mm/min`,
        unit: 'mm/min',
      };
    } else {
      return {
        value: tool.plungeRate,
        formatted: `${Math.round(tool.plungeRate * 10) / 10} IPM`,
        unit: 'IPM',
      };
    }
  }

  if (mode === 'metric') {
    const mmMin = feedIsMetric ? tool.plungeRate : tool.plungeRate * 25.4;
    return {
      value: mmMin,
      formatted: `${Math.round(mmMin)} mm/min`,
      unit: 'mm/min',
    };
  } else {
    const ipm = feedIsMetric ? tool.plungeRate / 25.4 : tool.plungeRate;
    return {
      value: ipm,
      formatted: `${Math.round(ipm * 10) / 10} IPM`,
      unit: 'IPM',
    };
  }
}

/**
 * When the user enters an edited dimension in the active display mode,
 * convert it back to the tool's native stored format.
 */
export function inputToNativeDimension(inputValue: number, tool: CarvecoTool, mode: DisplayUnitMode): number {
  const isMetric = isToolMetric(tool);

  if (mode === 'native') {
    return inputValue;
  }

  if (mode === 'metric') {
    // Input is in mm
    return isMetric ? inputValue : inputValue / 25.4;
  } else {
    // Input is in inches
    return isMetric ? inputValue * 25.4 : inputValue;
  }
}

/**
 * When the user enters an edited feed in the active display mode,
 * convert it back to the tool's native stored format.
 */
export function inputToNativeFeed(inputValue: number, tool: CarvecoTool, mode: DisplayUnitMode): number {
  const isMetric = isToolMetric(tool);
  const feedIsMetric = isMetric || tool.feedUnit === 1 || tool.feedUnit === 2 || tool.feedRate > 300;

  if (mode === 'native') {
    return inputValue;
  }

  if (mode === 'metric') {
    // Input is in mm/min
    return feedIsMetric ? inputValue : inputValue / 25.4;
  } else {
    // Input is in IPM
    return feedIsMetric ? inputValue * 25.4 : inputValue;
  }
}
