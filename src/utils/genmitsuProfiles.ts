import { CarvecoTool } from '../types/tool';

export interface GenmitsuMachine {
  id: string;
  name: string;
  shortName: string;
  series: '3018' | '3020' | '4040' | 'proverxl';
  workArea: string;
  defaultSpindleId: string;
  frameType: string;
  maxFeedMmMin: number;
  maxPlungeMmMin: number;
  maxWoodStepdownMm: number;
  maxAluStepdownMm: number;
  recommendedRpmRange: [number, number];
  description: string;
  grblDefaults: {
    xMaxRate: number;
    yMaxRate: number;
    zMaxRate: number;
    xAccel: number;
    yAccel: number;
    zAccel: number;
  };
}

export interface GenmitsuSpindleOption {
  id: string;
  name: string;
  watts: number;
  maxRpm: number;
  minRpm: number;
  collet: string;
  description: string;
  idealFeedsFactor: number;
  idealStepdownFactor: number;
}

export const GENMITSU_MACHINES: GenmitsuMachine[] = [
  {
    id: 'genmitsu-3018-pro',
    name: 'Genmitsu 3018-PRO / PROVer / V2',
    shortName: '3018-PRO / PROVer',
    series: '3018',
    workArea: '300 × 180 × 45 mm',
    defaultSpindleId: 'genmitsu-775',
    frameType: 'Bakelite + Aluminum Desktop',
    maxFeedMmMin: 1200,
    maxPlungeMmMin: 250,
    maxWoodStepdownMm: 0.6,
    maxAluStepdownMm: 0.15,
    recommendedRpmRange: [8000, 10000],
    description: 'The iconic entry-level desktop CNC. Requires conservative pass depths (0.3-0.5mm) to prevent motor stall and frame flex.',
    grblDefaults: {
      xMaxRate: 1000,
      yMaxRate: 1000,
      zMaxRate: 500,
      xAccel: 30,
      yAccel: 30,
      zAccel: 20,
    },
  },
  {
    id: 'genmitsu-3020-pro-max',
    name: 'Genmitsu 3020-PRO MAX / MAX V2',
    shortName: '3020-PRO MAX',
    series: '3020',
    workArea: '300 × 200 × 73 mm',
    defaultSpindleId: 'genmitsu-300w',
    frameType: 'All-Metal Heavy-Duty with Dual Linear Rails',
    maxFeedMmMin: 2000,
    maxPlungeMmMin: 450,
    maxWoodStepdownMm: 1.2,
    maxAluStepdownMm: 0.35,
    recommendedRpmRange: [8000, 12000],
    description: 'All-metal rigid construction with dual steel linear rails. Excellent rigidity for brass, aluminum, and deep hardwood cuts.',
    grblDefaults: {
      xMaxRate: 2000,
      yMaxRate: 2000,
      zMaxRate: 800,
      xAccel: 60,
      yAccel: 60,
      zAccel: 40,
    },
  },
  {
    id: 'genmitsu-4040-pro',
    name: 'Genmitsu 4040-PRO / 4040-Reno',
    shortName: '4040-PRO / Reno',
    series: '4040',
    workArea: '400 × 400 × 78 mm',
    defaultSpindleId: 'genmitsu-500w',
    frameType: 'Heavy Aluminum Extrusions & Dual HG15 Rails',
    maxFeedMmMin: 3200,
    maxPlungeMmMin: 800,
    maxWoodStepdownMm: 2.5,
    maxAluStepdownMm: 0.6,
    recommendedRpmRange: [10000, 24000],
    description: 'Large desktop workspace with high rigidity. Designed for 500W air-cooled spindles or 65mm trim routers (Makita/DeWalt).',
    grblDefaults: {
      xMaxRate: 3500,
      yMaxRate: 3500,
      zMaxRate: 1200,
      xAccel: 100,
      yAccel: 100,
      zAccel: 50,
    },
  },
  {
    id: 'genmitsu-proverxl-4030',
    name: 'Genmitsu PROVerXL 4030 / V2',
    shortName: 'PROVerXL 4030',
    series: 'proverxl',
    workArea: '400 × 300 × 110 mm',
    defaultSpindleId: 'genmitsu-makita-710w',
    frameType: 'Industrial C-Beam & Dual Lead Screws',
    maxFeedMmMin: 4200,
    maxPlungeMmMin: 1200,
    maxWoodStepdownMm: 4.0,
    maxAluStepdownMm: 0.9,
    recommendedRpmRange: [10000, 28000],
    description: 'Semi-industrial heavy C-beam CNC. Capable of high-speed contouring with 710W trim router or 1.5kW VFD water-cooled spindle.',
    grblDefaults: {
      xMaxRate: 4500,
      yMaxRate: 4500,
      zMaxRate: 1500,
      xAccel: 150,
      yAccel: 150,
      zAccel: 80,
    },
  },
  {
    id: 'genmitsu-proverxl-6060',
    name: 'Genmitsu PROVerXL 6060 / 1010 Plus',
    shortName: 'PROVerXL 6060/1010',
    series: 'proverxl',
    workArea: '600 × 600 × 110 mm',
    defaultSpindleId: 'genmitsu-vfd-1500w',
    frameType: 'Heavy Extruded C-Beam & Dual Lead Screws',
    maxFeedMmMin: 4500,
    maxPlungeMmMin: 1500,
    maxWoodStepdownMm: 4.5,
    maxAluStepdownMm: 1.0,
    recommendedRpmRange: [12000, 24000],
    description: 'Expanded bed format for full cabinetry, signs, and large 3D relief carvings with 1.5kW-2.2kW spindles.',
    grblDefaults: {
      xMaxRate: 5000,
      yMaxRate: 5000,
      zMaxRate: 1800,
      xAccel: 180,
      yAccel: 180,
      zAccel: 90,
    },
  },
];

export const GENMITSU_SPINDLES: GenmitsuSpindleOption[] = [
  {
    id: 'genmitsu-775',
    name: 'Stock Genmitsu 775 DC Motor (24V, 100W)',
    watts: 100,
    maxRpm: 10000,
    minRpm: 6000,
    collet: 'ER11 (1/8" - 3.175mm)',
    description: 'Standard 24V spindle supplied with 3018-PRO. Best for light engraving and soft woods.',
    idealFeedsFactor: 1.0,
    idealStepdownFactor: 1.0,
  },
  {
    id: 'genmitsu-gs-775m',
    name: 'Genmitsu GS-775M High-Speed Spindle (20,000 RPM, 120W)',
    watts: 120,
    maxRpm: 20000,
    minRpm: 8000,
    collet: 'ER11 (1/8" & 4mm)',
    description: 'High-speed motor upgrade for 3018. Enables clean PCB isolation and smooth acrylic milling.',
    idealFeedsFactor: 1.25,
    idealStepdownFactor: 1.1,
  },
  {
    id: 'genmitsu-300w',
    name: 'Genmitsu 300W Air-Cooled Spindle',
    watts: 300,
    maxRpm: 12000,
    minRpm: 3000,
    collet: 'ER11 (1/8", 4mm, 6mm)',
    description: 'Quiet desktop spindle upgrade with good torque for 3018-PRO and 3020-PRO MAX.',
    idealFeedsFactor: 1.4,
    idealStepdownFactor: 1.35,
  },
  {
    id: 'genmitsu-500w',
    name: 'Genmitsu 500W Brushless / Air-Cooled Spindle',
    watts: 500,
    maxRpm: 12000,
    minRpm: 3000,
    collet: 'ER11 (1/8", 4mm, 6mm, 1/4")',
    description: 'Powerful 52mm spindle for 3020-PRO MAX and 4040-PRO. Cuts hardwood and soft metals with ease.',
    idealFeedsFactor: 1.6,
    idealStepdownFactor: 1.5,
  },
  {
    id: 'genmitsu-makita-710w',
    name: 'Genmitsu 65mm Mount + Makita RT0700 / RT0701C (710W)',
    watts: 710,
    maxRpm: 30000,
    minRpm: 10000,
    collet: '1/4" (6.35mm), 1/8", 6mm, 8mm',
    description: 'High-power 710W variable-speed router mounted on 4040-PRO or PROVerXL 4030.',
    idealFeedsFactor: 2.1,
    idealStepdownFactor: 2.0,
  },
  {
    id: 'genmitsu-vfd-1500w',
    name: 'Genmitsu 1.5kW Air/Water-Cooled VFD Spindle (ER16)',
    watts: 1500,
    maxRpm: 24000,
    minRpm: 6000,
    collet: 'ER16 (1mm to 10mm)',
    description: 'Heavy production spindle for PROVerXL series with precise software RPM control.',
    idealFeedsFactor: 2.6,
    idealStepdownFactor: 2.5,
  },
];

/**
 * Optimizes tools specifically for a Genmitsu machine and spindle setup.
 * Clamps maximum feeds and stepdowns to safe mechanical thresholds.
 */
export function tuneToolsForGenmitsuMachine(
  tools: CarvecoTool[],
  machine: GenmitsuMachine,
  spindle: GenmitsuSpindleOption
): CarvecoTool[] {
  return tools.map(tool => {
    // Determine tool diameter in mm
    const diamMm = tool.unit === 'mm' ? tool.diameter : tool.diameter * 25.4;

    // Baseline scaling from spindle
    let newFeed = Math.round(tool.feedRate * (spindle.idealFeedsFactor / 1.5));
    let newStepdown = Math.round(tool.stepdown * (spindle.idealStepdownFactor / 1.5) * 100) / 100;
    let newPlunge = Math.round(tool.plungeRate * (spindle.idealFeedsFactor / 1.5));

    // Clamp feed rate to machine maximum axis capability
    if (tool.feedUnit === 2) {
      // mm/min
      newFeed = Math.min(newFeed, machine.maxFeedMmMin);
      newPlunge = Math.min(newPlunge, machine.maxPlungeMmMin);
    } else if (tool.feedUnit === 4) {
      // in/min
      const maxFeedIpm = Math.round(machine.maxFeedMmMin / 25.4);
      newFeed = Math.min(newFeed, maxFeedIpm);
      newPlunge = Math.min(newPlunge, Math.round(machine.maxPlungeMmMin / 25.4));
    }

    // Clamp stepdown to machine frame rigidity limit
    const stepdownLimitMm = machine.maxWoodStepdownMm;
    if (tool.unit === 'mm') {
      newStepdown = Math.min(newStepdown, stepdownLimitMm);
      // Small bits (<2mm) must have stepdown <= diameter * 0.8
      if (diamMm <= 2.0) {
        newStepdown = Math.min(newStepdown, Math.round(diamMm * 0.7 * 100) / 100);
      }
    } else {
      const stepdownLimitIn = Math.round((stepdownLimitMm / 25.4) * 1000) / 1000;
      newStepdown = Math.min(newStepdown, stepdownLimitIn);
    }

    // Clamp RPM to spindle range
    let newRpm = tool.spindleSpeed;
    if (newRpm < spindle.minRpm) newRpm = spindle.minRpm;
    if (newRpm > spindle.maxRpm) newRpm = spindle.maxRpm;

    return {
      ...tool,
      spindleSpeed: newRpm,
      feedRate: Math.max(10, newFeed),
      plungeRate: Math.max(5, newPlunge),
      stepdown: Math.max(0.05, newStepdown),
      notes: `${tool.notes ? tool.notes + ' · ' : ''}Calibrated for Genmitsu ${machine.shortName} (${spindle.watts}W)`.trim(),
    };
  });
}
