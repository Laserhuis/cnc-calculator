import React, { useState, useEffect, useMemo } from 'react';
import {
  Gauge,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  TrendingUp,
  Shield,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { CarvecoTool } from '../types/tool';
import {
  SPINDLE_PROFILES,
  snapToNearestDial,
  calculatePowerScalingFactors,
} from '../utils/spindleProfiles';
import { GENMITSU_MACHINES, GenmitsuMachine } from '../utils/genmitsuProfiles';

interface SpindleTunerBarProps {
  tools: CarvecoTool[];
  fileName: string;
  selectedToolIds: string[];
  activeGroup: string;
  onApplyTuning: (options: SpindleTuningOptions) => void;
  onResetToOriginal: (scope: 'all' | 'selected' | 'filtered') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenHelpPhysics?: () => void;
}

export interface SpindleTuningOptions {
  profileId: string;
  rpmMultiplier: number;
  feedMultiplier: number;
  stepdownMultiplier: number;
  plungeMultiplier: number;
  clampRpm: boolean;
  snapDial: boolean;
  scope: 'all' | 'selected' | 'filtered';
}

export const SpindleTunerBar: React.FC<SpindleTunerBarProps> = ({
  tools,
  fileName,
  selectedToolIds,
  activeGroup,
  onApplyTuning,
  onResetToOriginal,
  isOpen,
  onToggleOpen,
  onOpenHelpPhysics,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState('makita-710w');

  // Detect whether the loaded file is from Genmitsu / desktop stock 775 motor (60W-120W)
  const isLikelyStockDesktop = useMemo(() => {
    const fn = fileName.toLowerCase();
    if (
      fn.includes('genmitsu') ||
      fn.includes('sainsmart') ||
      fn.includes('3018') ||
      fn.includes('3020') ||
      fn.includes('4040')
    ) {
      return true;
    }
    if (tools.length > 0) {
      const avgSpeed =
        tools.reduce((sum, t) => sum + (t.originalValues?.spindleSpeed || t.spindleSpeed || 0), 0) /
        tools.length;
      if (avgSpeed <= 11000 && avgSpeed > 0) return true;
    }
    return false;
  }, [fileName, tools]);

  // Source Baseline Spindle Wattage (what the current file was originally written for)
  const [sourceBaselineWatts, setSourceBaselineWatts] = useState<number>(
    isLikelyStockDesktop ? 100 : 100
  );

  // Custom wattage mode toggle
  const [isCustomWattage, setIsCustomWattage] = useState(false);
  const [customTargetWatts, setCustomTargetWatts] = useState(710);

  // Mode: 'upgrade_from_stock' (Boost feeds & depths) vs 'downscale_from_industrial'
  const [tuneMode, setTuneMode] = useState<'upgrade_from_stock' | 'downscale_from_industrial'>('upgrade_from_stock');

  const [rpmMultiplier, setRpmMultiplier] = useState(1.5);
  const [feedMultiplier, setFeedMultiplier] = useState(1.8);
  const [stepdownMultiplier, setStepdownMultiplier] = useState(1.75);
  const [plungeMultiplier, setPlungeMultiplier] = useState(1.5);
  const [clampRpm, setClampRpm] = useState(true);
  const [snapDial, setSnapDial] = useState(true);
  const [scope, setScope] = useState<'all' | 'selected' | 'filtered'>(
    selectedToolIds.length > 0 ? 'selected' : 'all'
  );
  const [appliedNotice, setAppliedNotice] = useState(false);

  const profile = SPINDLE_PROFILES.find(p => p.id === selectedProfileId) || SPINDLE_PROFILES[3];
  const activeTargetWatts = isCustomWattage ? customTargetWatts : profile.powerWatts;

  // Auto-calculate wattage scaling when baseline or target changes
  const applyWattageScaling = (sourceW: number, targetW: number) => {
    const scaling = calculatePowerScalingFactors(sourceW, targetW);
    setFeedMultiplier(scaling.feedFactor);
    setStepdownMultiplier(scaling.stepdownFactor);
    setPlungeMultiplier(scaling.plungeFactor);
    if (targetW > sourceW) {
      setRpmMultiplier(Math.min(2.0, Math.round(Math.pow(scaling.wattRatio, 0.25) * 100) / 100));
      setTuneMode('upgrade_from_stock');
    } else {
      setRpmMultiplier(Math.max(0.5, Math.round(Math.pow(scaling.wattRatio, 0.25) * 100) / 100));
      setTuneMode('downscale_from_industrial');
    }
  };

  const handleProfileSelect = (newProfileId: string) => {
    if (newProfileId === 'custom') {
      setIsCustomWattage(true);
      applyWattageScaling(sourceBaselineWatts, customTargetWatts);
      return;
    }
    setIsCustomWattage(false);
    setSelectedProfileId(newProfileId);
    const p = SPINDLE_PROFILES.find(x => x.id === newProfileId);
    if (p) {
      applyWattageScaling(sourceBaselineWatts, p.powerWatts);
    }
  };

  const handleSourceBaselineChange = (newSourceW: number) => {
    setSourceBaselineWatts(newSourceW);
    applyWattageScaling(newSourceW, activeTargetWatts);
  };

  const handleCustomTargetWattsChange = (watts: number) => {
    setCustomTargetWatts(watts);
    applyWattageScaling(sourceBaselineWatts, watts);
  };

  // Quick Preset handler
  const handleQuickPreset = (presetType: string) => {
    switch (presetType) {
      case 'genmitsu_balanced':
        setSourceBaselineWatts(100);
        setSelectedProfileId('makita-710w');
        setIsCustomWattage(false);
        setTuneMode('upgrade_from_stock');
        setFeedMultiplier(1.8);
        setStepdownMultiplier(1.75);
        setPlungeMultiplier(1.5);
        setRpmMultiplier(1.5);
        setClampRpm(true);
        setSnapDial(true);
        break;
      case 'genmitsu_aggressive':
        setTuneMode('upgrade_from_stock');
        setFeedMultiplier(2.4);
        setStepdownMultiplier(2.0);
        setPlungeMultiplier(1.8);
        setRpmMultiplier(1.8);
        setClampRpm(true);
        setSnapDial(true);
        break;
      case 'genmitsu_plastic':
        setTuneMode('upgrade_from_stock');
        setFeedMultiplier(2.2);
        setStepdownMultiplier(1.3);
        setPlungeMultiplier(1.5);
        setRpmMultiplier(1.2);
        setClampRpm(true);
        setSnapDial(true);
        break;
      case 'genmitsu_aluminum':
        setTuneMode('upgrade_from_stock');
        setFeedMultiplier(1.3);
        setStepdownMultiplier(1.15);
        setPlungeMultiplier(1.2);
        setRpmMultiplier(1.4);
        setClampRpm(true);
        setSnapDial(true);
        break;
      case 'industrial_balanced':
        setSourceBaselineWatts(2200);
        setSelectedProfileId('makita-710w');
        setIsCustomWattage(false);
        setTuneMode('downscale_from_industrial');
        setFeedMultiplier(0.8);
        setStepdownMultiplier(0.65);
        setPlungeMultiplier(0.75);
        setRpmMultiplier(1.0);
        setClampRpm(true);
        setSnapDial(true);
        break;
    }
  };

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    isLikelyStockDesktop ? 'genmitsu-3018-pro' : null
  );

  const handleSelectGenmitsuMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    const m = GENMITSU_MACHINES.find(x => x.id === machineId);
    if (!m) return;

    if (m.series === '3018') {
      setSourceBaselineWatts(100);
      setSelectedProfileId('genmitsu-775');
      setFeedMultiplier(1.0);
      setStepdownMultiplier(1.0);
      setPlungeMultiplier(1.0);
      setRpmMultiplier(1.0);
      setTuneMode('upgrade_from_stock');
    } else if (m.series === '3020') {
      setSourceBaselineWatts(100);
      setSelectedProfileId('brushless-500w');
      setFeedMultiplier(1.5);
      setStepdownMultiplier(1.4);
      setPlungeMultiplier(1.3);
      setRpmMultiplier(1.2);
      setTuneMode('upgrade_from_stock');
    } else if (m.series === '4040') {
      setSourceBaselineWatts(100);
      setSelectedProfileId('makita-710w');
      setFeedMultiplier(2.1);
      setStepdownMultiplier(1.9);
      setPlungeMultiplier(1.6);
      setRpmMultiplier(1.5);
      setTuneMode('upgrade_from_stock');
    } else {
      setSourceBaselineWatts(100);
      setSelectedProfileId('makita-710w');
      setFeedMultiplier(2.4);
      setStepdownMultiplier(2.2);
      setPlungeMultiplier(1.8);
      setRpmMultiplier(1.6);
      setTuneMode('upgrade_from_stock');
    }
    setClampRpm(true);
    setSnapDial(true);
  };

  const handleApply = () => {
    onApplyTuning({
      profileId: selectedProfileId,
      rpmMultiplier,
      feedMultiplier,
      stepdownMultiplier,
      plungeMultiplier,
      clampRpm,
      snapDial,
      scope,
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  const targetCount =
    scope === 'selected'
      ? selectedToolIds.length || tools.length
      : scope === 'filtered' && activeGroup !== 'all'
      ? tools.filter(t => t.group === activeGroup).length
      : tools.length;

  // Preview sample calculation using first tool
  const sampleTool = tools[0];
  let previewRpm = sampleTool ? Math.round(sampleTool.originalValues.spindleSpeed * rpmMultiplier) : 20000;
  if (clampRpm) {
    previewRpm = Math.max(profile.minRpm, Math.min(profile.maxRpm, previewRpm));
  }
  let previewDialStr = '';
  if (snapDial) {
    const dialMatch = snapToNearestDial(previewRpm, profile.dials);
    previewRpm = dialMatch.rpm;
    previewDialStr = ` (Dial ${dialMatch.dial})`;
  }
  const previewFeed = sampleTool
    ? Math.round(sampleTool.originalValues.feedRate * feedMultiplier * 10) / 10
    : 128;
  const previewStepdown = sampleTool
    ? Math.round(sampleTool.originalValues.stepdown * stepdownMultiplier * 1000) / 1000
    : 0.1;

  const wattDelta = activeTargetWatts - sourceBaselineWatts;
  const wattPercent = Math.round((activeTargetWatts / sourceBaselineWatts - 1) * 100);

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100">
                Spindle Wattage & CAM Tuner
              </span>
              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                {sourceBaselineWatts}W → {activeTargetWatts}W ({wattDelta >= 0 ? `+${wattDelta}W` : `${wattDelta}W`})
              </span>
              {isLikelyStockDesktop && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                  Genmitsu Stock Detected
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400 hidden md:inline">
              {tuneMode === 'upgrade_from_stock'
                ? `Upgrading from ${sourceBaselineWatts}W motor: Increasing feeds (+${Math.round((feedMultiplier - 1) * 100)}%) and pass depth (+${Math.round((stepdownMultiplier - 1) * 100)}%) for chip load`
                : `Downscaling from ${sourceBaselineWatts}W industrial spindle: Dampening pass depths to avoid router stalling`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOpen && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
              title="Apply calibration"
            >
              {appliedNotice ? <Check className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
              <span>{appliedNotice ? 'Tuned!' : `Apply ${activeTargetWatts}W Scaling (${targetCount} bits)`}</span>
            </button>
          )}

          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <span>{isOpen ? 'Collapse Panel' : 'Customize Wattage & Feeds'}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Tuner Controls */}
      {isOpen && (
        <div className="border-t border-zinc-800 px-4 py-4 sm:px-6 space-y-4">
          {/* Row 0: Wattage Physics Matrix (Source Baseline vs Target Spindle) */}
          <div className="bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-zinc-200">
                  Spindle Wattage Calibration Matrix
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Select your source file's original baseline motor power, and the target router you are running on your machine.
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                {onOpenHelpPhysics && (
                  <button
                    type="button"
                    onClick={onOpenHelpPhysics}
                    className="flex items-center gap-1 text-[11px] font-sans font-medium text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>Physics Guide & Dial Reference</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-mono text-xs">Power Ratio:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${wattPercent >= 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-amber-950/60 text-amber-300 border border-amber-800'}`}>
                    {wattPercent >= 0 ? `+${wattPercent}% Boost` : `${wattPercent}% Tamed`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-zinc-850">
              {/* Left: Source File Baseline Wattage */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-400">
                  1. Current File Baseline Power:
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSourceBaselineChange(100)}
                    className={`py-1.5 px-2 rounded border font-medium text-center transition-colors ${
                      sourceBaselineWatts === 100
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    100W (Stock 775)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceBaselineChange(300)}
                    className={`py-1.5 px-2 rounded border font-medium text-center transition-colors ${
                      sourceBaselineWatts === 300
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    300W DC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceBaselineChange(500)}
                    className={`py-1.5 px-2 rounded border font-medium text-center transition-colors ${
                      sourceBaselineWatts === 500
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    500W ER11
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceBaselineChange(2200)}
                    className={`py-1.5 px-2 rounded border font-medium text-center transition-colors ${
                      sourceBaselineWatts === 2200
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    2.2kW VFD
                  </button>
                </div>
              </div>

              {/* Right: Target Spindle Model / Wattage */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-400">
                  2. Target Spindle on Machine:
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={isCustomWattage ? 'custom' : selectedProfileId}
                    onChange={e => handleProfileSelect(e.target.value)}
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    {SPINDLE_PROFILES.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.powerWatts}W]
                      </option>
                    ))}
                    <option value="custom">Custom Spindle Wattage...</option>
                  </select>

                  {isCustomWattage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="50"
                        max="5000"
                        step="50"
                        value={customTargetWatts}
                        onChange={e => handleCustomTargetWattsChange(parseInt(e.target.value, 10) || 710)}
                        className="w-20 rounded border border-amber-500/60 bg-zinc-800 px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400 font-mono">Watts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Genmitsu Machine Presets Selector */}
          <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Genmitsu CNC Machine Presets & Rigidity Limits:</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono">
                Auto-configures feed caps & pass depth limits
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              {GENMITSU_MACHINES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectGenmitsuMachine(m.id)}
                  className={`py-2 px-2.5 rounded border text-left transition-all ${
                    selectedMachineId === m.id
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-emerald-800 hover:text-emerald-300'
                  }`}
                >
                  <div className="font-semibold text-xs leading-tight">{m.shortName}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{m.workArea}</div>
                  <div className="text-[9px] text-emerald-400/80 mt-0.5">Max {m.maxFeedMmMin} mm/min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Quick Material Presets */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-zinc-400 mr-1">Quick Tuning Presets:</span>
              <button
                onClick={() => handleQuickPreset('genmitsu_balanced')}
                className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                title="775 to 710W: Feed 1.8x, Stepdown 1.75x"
              >
                Wood (1.8× Feed / 1.75× Depth)
              </button>
              <button
                onClick={() => handleQuickPreset('genmitsu_aggressive')}
                className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Fast roughing: Feed 2.4x, Stepdown 2.0x"
              >
                Aggressive (2.4× Feed / 2.0× Depth)
              </button>
              <button
                onClick={() => handleQuickPreset('genmitsu_plastic')}
                className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Plastic/Acrylic: Fast feed prevents melting"
              >
                Acrylic & Plastics (Fast / Light)
              </button>
              <button
                onClick={() => handleQuickPreset('genmitsu_aluminum')}
                className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Aluminum: Feed 1.3x, Stepdown 1.15x"
              >
                Aluminum Milling
              </button>
              <button
                onClick={() => handleQuickPreset('industrial_balanced')}
                className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                title="From 2.2kW Industrial: Tame down to 710W"
              >
                From 2.2kW Industrial (0.8× Feed)
              </button>
            </div>
          </div>

          {/* Row 2: Fine-Tuning Multipliers Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800">
            {/* Feed Rate Multiplier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Feed Rate Factor</span>
                <span className="font-mono text-amber-400 font-semibold">{feedMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="3.50"
                step="0.05"
                value={feedMultiplier}
                onChange={e => setFeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.50×</span>
                <span>1.00× (Same)</span>
                <span>1.80× (710W)</span>
                <span>3.50×</span>
              </div>
            </div>

            {/* Stepdown Multiplier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Stepdown (Pass Depth)</span>
                <span className="font-mono text-amber-400 font-semibold">{stepdownMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="3.50"
                step="0.05"
                value={stepdownMultiplier}
                onChange={e => setStepdownMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.50×</span>
                <span>1.00× (Same)</span>
                <span>1.75× (710W)</span>
                <span>3.50×</span>
              </div>
            </div>

            {/* Plunge Rate Multiplier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Plunge Rate Factor</span>
                <span className="font-mono text-amber-400 font-semibold">{plungeMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="3.00"
                step="0.05"
                value={plungeMultiplier}
                onChange={e => setPlungeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.50×</span>
                <span>1.00×</span>
                <span>1.50×</span>
                <span>3.00×</span>
              </div>
            </div>

            {/* RPM Multiplier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Spindle RPM Factor</span>
                <span className="font-mono text-amber-400 font-semibold">{rpmMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="3.00"
                step="0.05"
                value={rpmMultiplier}
                onChange={e => setRpmMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.50×</span>
                <span>1.00×</span>
                <span>1.50×</span>
                <span>3.00×</span>
              </div>
            </div>
          </div>

          {/* Row 3: Dial & Clamp Options + Scope */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={clampRpm}
                  onChange={e => setClampRpm(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
                <span>Clamp RPM to Safe Range ({profile.minRpm.toLocaleString()} – {profile.maxRpm.toLocaleString()} RPM)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={snapDial}
                  onChange={e => setSnapDial(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
                <span>Snap RPM to Router Speed Dial Notches</span>
              </label>
            </div>

            {/* Scope Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Target:</span>
              <div className="flex items-center rounded border border-zinc-700 bg-zinc-800 p-0.5">
                <button
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    scope === 'all'
                      ? 'bg-zinc-700 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({tools.length})
                </button>
                {selectedToolIds.length > 0 && (
                  <button
                    onClick={() => setScope('selected')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      scope === 'selected'
                        ? 'bg-zinc-700 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Selected ({selectedToolIds.length})
                  </button>
                )}
                {activeGroup !== 'all' && (
                  <button
                    onClick={() => setScope('filtered')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      scope === 'filtered'
                        ? 'bg-zinc-700 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Current Group
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Live Preview & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            {sampleTool && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span className="text-zinc-500">Sample Bit ({sampleTool.name.slice(0, 22)}...):</span>
                <span>
                  {sampleTool.originalValues.spindleSpeed} → <strong className="text-amber-400">{previewRpm}{previewDialStr}</strong> RPM
                </span>
                <span className="text-zinc-600">·</span>
                <span>
                  Feed: {sampleTool.originalValues.feedRate} → <strong className="text-amber-400">{previewFeed}</strong>
                </span>
                <span className="text-zinc-600">·</span>
                <span>
                  Depth: {sampleTool.originalValues.stepdown} → <strong className="text-amber-400">{previewStepdown}</strong>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => onResetToOriginal(scope)}
                className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Revert modified values back to original database values"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Revert to Original</span>
              </button>

              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                {appliedNotice ? <Check className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
                <span>{appliedNotice ? 'Applied Successfully!' : `Apply ${activeTargetWatts}W Settings (${targetCount} Bits)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
