export type ToolType =
  | 'endmill'
  | 'ballnose'
  | 'conical' // Tapered Ball Nose
  | 'vbit'
  | 'engraving'
  | 'bowl_tray' // Round Bowl & Tray bit
  | 'radiused' // Bull Nose / Corner Radius
  | 'surfacing'
  | 'roundover'
  | 'drill'
  | 'other';

export interface OriginalToolValues {
  diameter: number;
  param2: number;
  stepdown: number;
  spindleSpeed: number;
  feedRate: number;
  plungeRate: number;
  stepover?: number;
  stepoverPercent?: number;
  tipSize?: number;
  angle?: number;
  fluteLength?: number;
  shankDiameter?: number;
  name?: string;
  notes?: string;
}

export interface CarvecoTool {
  id: string;
  name: string;
  group: string;
  notes: string;
  toolNo: number;
  unitFlag: number; // 0 = Imperial (inches), 1 = Metric (millimeters)
  unit: 'mm' | 'inch';
  diameter: number;
  param2: number; // Stepover or tip radius or angle depending on bit geometry

  // Dedicated Carveco Geometry & Tool Settings
  tipSize?: number; // Tip size: Flat diameter (w) for engraving/flat V-bits, or Tip radius (r) for tapered ball nose & bullnose
  angle?: number; // Included angle (degrees) for V-bit/engraving, or half-angle for tapered bits
  stepover?: number; // Stepover distance (in bit unit: mm or inches)
  stepoverPercent?: number; // Stepover as percentage of diameter (e.g., 40% for endmills, 8-10% for 3D relief carving)
  fluteLength?: number; // Flute / Cutting edge length (mm or inches)
  shankDiameter?: number; // Shank collet diameter (e.g., 3.175mm, 6.35mm, 1/8", 1/4")
  materialGroup?: string; // Material profile (Wood, Aluminum, Plastics/Acrylic, MDF, etc.)

  stepdown: number;
  spindleSpeed: number; // RPM
  feedRate: number;
  plungeRate: number;
  feedUnit: number; // 4 = in/min, 2 = mm/min, 1 = mm/sec, 3 = in/sec
  plungeUnit: number; // 3 or 4 = in/min, 2 = mm/min, etc.
  toolType: ToolType;
  fluteCount: number;
  originalValues: OriginalToolValues;
  paramsOffset?: number;
  nameOffset?: number;
  noteOffset?: number;
}

export interface DatabaseState {
  fileName: string;
  format: 'carveco_binary' | 'csv' | 'json' | 'text';
  tools: CarvecoTool[];
  groups: string[];
  rawBuffer: ArrayBuffer | null;
  history: CarvecoTool[][];
  historyIndex: number;
  detectedFileUnit?: 'metric' | 'imperial' | 'mixed';
}

export type BulkField =
  | 'spindleSpeed'
  | 'feedRate'
  | 'plungeRate'
  | 'stepdown'
  | 'param2'
  | 'stepover'
  | 'stepoverPercent'
  | 'tipSize'
  | 'angle'
  | 'diameter'
  | 'toolNo';

export type BulkAction =
  | 'multiply'
  | 'divide'
  | 'add'
  | 'subtract'
  | 'set'
  | 'clamp'
  | 'round'
  | 'percent';

export type BulkScope = 'all' | 'selected' | 'filtered';

export interface BulkOperationConfig {
  field: BulkField;
  action: BulkAction;
  value: number;
  minValue?: number;
  maxValue?: number;
  roundIncrement?: number;
  scope: BulkScope;
}

export interface SpindleProfile {
  id: string;
  name: string;
  powerWatts: number;
  description: string;
  minRpm: number;
  maxRpm: number;
  dials: { dial: number | string; rpm: number }[];
  desktopUpgradeFeedFactor: number;
  desktopUpgradeStepdownFactor: number;
  desktopUpgradePlungeFactor: number;
  industrialTameFeedFactor: number;
  industrialTameStepdownFactor: number;
  industrialTamePlungeFactor: number;
}
