export type ToolType =
  | 'endmill'
  | 'ballnose'
  | 'vbit'
  | 'conical'
  | 'radiused'
  | 'engraving'
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
