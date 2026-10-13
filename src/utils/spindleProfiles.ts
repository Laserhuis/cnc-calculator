import { SpindleProfile } from '../types/tool';

export interface SpindleProfileExtended extends SpindleProfile {
  category: 'desktop_stock' | 'desktop_mid' | 'trim_router' | 'vfd_spindle' | 'custom';
  colletType: string;
  nominalVoltage?: string;
}

export const SPINDLE_PROFILES: SpindleProfile[] = [
  // 1. Stock Genmitsu / Desktop 775 Spindle (60W - 120W)
  {
    id: 'genmitsu-775',
    name: 'Stock Genmitsu 775 Motor (60W-120W)',
    powerWatts: 100,
    description: 'Stock DC motor on Genmitsu 3018-PRO / PROVer / CNC 1610. Max ~10,000 RPM. Light pass depths (0.3-0.6mm).',
    minRpm: 6000,
    maxRpm: 10000,
    dials: [
      { dial: 'Low (40%)', rpm: 6000 },
      { dial: 'Mid (70%)', rpm: 8000 },
      { dial: 'Max (100%)', rpm: 10000 },
    ],
    desktopUpgradeFeedFactor: 1.0,
    desktopUpgradeStepdownFactor: 1.0,
    desktopUpgradePlungeFactor: 1.0,
    industrialTameFeedFactor: 0.45,
    industrialTameStepdownFactor: 0.35,
    industrialTamePlungeFactor: 0.4,
  },

  // 2. 300W Air-Cooled DC Spindle
  {
    id: 'dc-300w',
    name: '300W Air-Cooled DC Spindle (ER11)',
    powerWatts: 300,
    description: 'Quiet desktop DC spindle upgrade. Speeds 3,000 to 12,000 RPM with ER11 collet.',
    minRpm: 3000,
    maxRpm: 12000,
    dials: [
      { dial: 'Low', rpm: 3000 },
      { dial: 'Mid', rpm: 8000 },
      { dial: 'High', rpm: 12000 },
    ],
    desktopUpgradeFeedFactor: 1.35,
    desktopUpgradeStepdownFactor: 1.3,
    desktopUpgradePlungeFactor: 1.25,
    industrialTameFeedFactor: 0.6,
    industrialTameStepdownFactor: 0.5,
    industrialTamePlungeFactor: 0.55,
  },

  // 3. 500W Brushless / Air-Cooled Spindle
  {
    id: 'brushless-500w',
    name: '500W Air-Cooled Spindle (SainSmart / Genmitsu 4030)',
    powerWatts: 500,
    description: 'Popular 500W brushless/DC upgrade with ER11 collet. Speeds up to 12,000 RPM with good low-end torque.',
    minRpm: 3000,
    maxRpm: 12000,
    dials: [
      { dial: 'Speed 1', rpm: 3000 },
      { dial: 'Speed 2', rpm: 6000 },
      { dial: 'Speed 3', rpm: 9000 },
      { dial: 'Speed 4', rpm: 12000 },
    ],
    desktopUpgradeFeedFactor: 1.55,
    desktopUpgradeStepdownFactor: 1.5,
    desktopUpgradePlungeFactor: 1.35,
    industrialTameFeedFactor: 0.7,
    industrialTameStepdownFactor: 0.6,
    industrialTamePlungeFactor: 0.65,
  },

  // 4. Makita RT0700 / RT0701C (710W)
  {
    id: 'makita-710w',
    name: 'Makita RT0700 / RT0701C (710W)',
    powerWatts: 710,
    description: 'Most popular 710W trim router for hobby CNCs (Shapeoko, Onefinity, Stepcraft, OpenBuilds). Speeds 10k-30k RPM across 6 dial positions.',
    minRpm: 10000,
    maxRpm: 30000,
    dials: [
      { dial: 1, rpm: 10000 },
      { dial: 2, rpm: 12000 },
      { dial: 3, rpm: 17000 },
      { dial: 4, rpm: 22000 },
      { dial: 5, rpm: 27000 },
      { dial: 6, rpm: 30000 },
    ],
    desktopUpgradeFeedFactor: 1.8,
    desktopUpgradeStepdownFactor: 1.75,
    desktopUpgradePlungeFactor: 1.5,
    industrialTameFeedFactor: 0.8,
    industrialTameStepdownFactor: 0.65,
    industrialTamePlungeFactor: 0.75,
  },

  // 5. Katsu 101750 (710W)
  {
    id: 'katsu-710w',
    name: 'Katsu 101750 / VonHaus (710W)',
    powerWatts: 710,
    description: 'Direct Makita-compatible 710W clone router with identical 6-speed dial notches (10k-30k RPM).',
    minRpm: 10000,
    maxRpm: 30000,
    dials: [
      { dial: 1, rpm: 10000 },
      { dial: 2, rpm: 12000 },
      { dial: 3, rpm: 17000 },
      { dial: 4, rpm: 22000 },
      { dial: 5, rpm: 27000 },
      { dial: 6, rpm: 30000 },
    ],
    desktopUpgradeFeedFactor: 1.8,
    desktopUpgradeStepdownFactor: 1.75,
    desktopUpgradePlungeFactor: 1.5,
    industrialTameFeedFactor: 0.8,
    industrialTameStepdownFactor: 0.65,
    industrialTamePlungeFactor: 0.75,
  },

  // 6. 800W VFD Spindle (Water / Air-Cooled)
  {
    id: 'vfd-800w',
    name: '800W VFD High-Speed Spindle (ER11)',
    powerWatts: 800,
    description: 'Precision balanced 65mm body VFD spindle with ER11 collet. Very quiet, low runout, up to 24,000 RPM.',
    minRpm: 6000,
    maxRpm: 24000,
    dials: [
      { dial: '100Hz', rpm: 6000 },
      { dial: '200Hz', rpm: 12000 },
      { dial: '300Hz', rpm: 18000 },
      { dial: '400Hz', rpm: 24000 },
    ],
    desktopUpgradeFeedFactor: 1.9,
    desktopUpgradeStepdownFactor: 1.8,
    desktopUpgradePlungeFactor: 1.55,
    industrialTameFeedFactor: 0.82,
    industrialTameStepdownFactor: 0.68,
    industrialTamePlungeFactor: 0.76,
  },

  // 7. DeWalt D26200 / DWP611 (900W / 1.25 HP)
  {
    id: 'dewalt-d26200',
    name: 'DeWalt D26200 / DWP611 (900W / 1.25HP)',
    powerWatts: 900,
    description: 'High-torque compact router with 69mm mount and speed dial settings from 16,000 to 27,000 RPM.',
    minRpm: 16000,
    maxRpm: 27000,
    dials: [
      { dial: 1, rpm: 16000 },
      { dial: 2, rpm: 18200 },
      { dial: 3, rpm: 20400 },
      { dial: 4, rpm: 22600 },
      { dial: 5, rpm: 24800 },
      { dial: 6, rpm: 27000 },
    ],
    desktopUpgradeFeedFactor: 2.0,
    desktopUpgradeStepdownFactor: 1.85,
    desktopUpgradePlungeFactor: 1.6,
    industrialTameFeedFactor: 0.85,
    industrialTameStepdownFactor: 0.7,
    industrialTamePlungeFactor: 0.8,
  },

  // 8. Bosch Colt GKF125CE (930W / 1.25 HP)
  {
    id: 'bosch-colt',
    name: 'Bosch Colt GKF125CE (930W / 1.25HP)',
    powerWatts: 930,
    description: 'Variable speed palm router with 16k - 35k RPM range with electronic constant feedback under load.',
    minRpm: 16000,
    maxRpm: 35000,
    dials: [
      { dial: 1, rpm: 16000 },
      { dial: 2, rpm: 20000 },
      { dial: 3, rpm: 24000 },
      { dial: 4, rpm: 28000 },
      { dial: 5, rpm: 32000 },
      { dial: 6, rpm: 35000 },
    ],
    desktopUpgradeFeedFactor: 2.0,
    desktopUpgradeStepdownFactor: 1.85,
    desktopUpgradePlungeFactor: 1.6,
    industrialTameFeedFactor: 0.85,
    industrialTameStepdownFactor: 0.7,
    industrialTamePlungeFactor: 0.8,
  },

  // 9. 1.5 kW (1500W) VFD Spindle (ER11 / ER16)
  {
    id: 'vfd-1500w',
    name: '1.5 kW (1500W) VFD Inverter Spindle',
    powerWatts: 1500,
    description: 'Commercial grade 65mm/80mm VFD spindle. Continuous heavy cutting in hardwoods and aluminum up to 24,000 RPM.',
    minRpm: 6000,
    maxRpm: 24000,
    dials: [
      { dial: '100Hz', rpm: 6000 },
      { dial: '200Hz', rpm: 12000 },
      { dial: '300Hz', rpm: 18000 },
      { dial: '400Hz', rpm: 24000 },
    ],
    desktopUpgradeFeedFactor: 2.35,
    desktopUpgradeStepdownFactor: 2.2,
    desktopUpgradePlungeFactor: 1.8,
    industrialTameFeedFactor: 0.9,
    industrialTameStepdownFactor: 0.8,
    industrialTamePlungeFactor: 0.85,
  },

  // 10. 2.2 kW (2200W) Heavy-Duty VFD Spindle (ER20)
  {
    id: 'vfd-2200w',
    name: '2.2 kW (2200W) Heavy-Duty VFD Spindle (ER20)',
    powerWatts: 2200,
    description: 'Industrial 80mm water-cooled spindle with ER20 collet (accepts up to 1/2" bits). Massive torque across 6k-24k RPM.',
    minRpm: 6000,
    maxRpm: 24000,
    dials: [
      { dial: '100Hz', rpm: 6000 },
      { dial: '200Hz', rpm: 12000 },
      { dial: '300Hz', rpm: 18000 },
      { dial: '400Hz', rpm: 24000 },
    ],
    desktopUpgradeFeedFactor: 2.7,
    desktopUpgradeStepdownFactor: 2.5,
    desktopUpgradePlungeFactor: 2.0,
    industrialTameFeedFactor: 1.0,
    industrialTameStepdownFactor: 1.0,
    industrialTamePlungeFactor: 1.0,
  },
];

/**
 * Calculates physical power-based scaling multipliers given source wattage and target wattage.
 * Uses empirical machining chip load power formula: Feed ∝ (P_target / P_source)^0.38
 */
export function calculatePowerScalingFactors(sourceWatts: number, targetWatts: number): {
  feedFactor: number;
  stepdownFactor: number;
  plungeFactor: number;
  wattRatio: number;
} {
  const safeSource = Math.max(50, sourceWatts || 100);
  const safeTarget = Math.max(50, targetWatts || 710);
  const wattRatio = safeTarget / safeSource;

  if (Math.abs(wattRatio - 1.0) < 0.05) {
    return { feedFactor: 1.0, stepdownFactor: 1.0, plungeFactor: 1.0, wattRatio: 1.0 };
  }

  // If upgrading up (e.g., 100W -> 710W), ratio > 1:
  if (wattRatio > 1) {
    const feedFactor = Math.min(3.2, Math.round(Math.pow(wattRatio, 0.38) * 100) / 100);
    const stepdownFactor = Math.min(3.0, Math.round(Math.pow(wattRatio, 0.35) * 100) / 100);
    const plungeFactor = Math.min(2.5, Math.round(Math.pow(wattRatio, 0.28) * 100) / 100);
    return { feedFactor, stepdownFactor, plungeFactor, wattRatio };
  } else {
    // If downscaling (e.g., 2200W -> 710W or 710W -> 100W):
    const feedFactor = Math.max(0.3, Math.round(Math.pow(wattRatio, 0.38) * 100) / 100);
    const stepdownFactor = Math.max(0.25, Math.round(Math.pow(wattRatio, 0.35) * 100) / 100);
    const plungeFactor = Math.max(0.35, Math.round(Math.pow(wattRatio, 0.28) * 100) / 100);
    return { feedFactor, stepdownFactor, plungeFactor, wattRatio };
  }
}

export function snapToNearestDial(rpm: number, dials: { dial: number | string; rpm: number }[]): { dial: number | string; rpm: number } {
  let closest = dials[0];
  let minDiff = Math.abs(rpm - dials[0].rpm);
  for (let i = 1; i < dials.length; i++) {
    const diff = Math.abs(rpm - dials[i].rpm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dials[i];
    }
  }
  return closest;
}
