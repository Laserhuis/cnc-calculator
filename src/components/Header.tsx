import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  Gauge,
  SlidersHorizontal,
  Printer,
  Sparkles,
  ChevronDown,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DatabaseState } from '../types/tool';
import { BRAND_PRESETS } from '../data/presetDatabases';

interface HeaderProps {
  database: DatabaseState;
  unitMode: 'metric' | 'imperial' | 'native';
  onChangeUnitMode: (mode: 'metric' | 'imperial' | 'native') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenPrint: () => void;
  onOpenBulkModal: () => void;
  onOpenSpindleTuner: () => void;
  onOpenHelp: () => void;
  onFixUnitSwap?: (action: 'div254' | 'mul254' | 'setMetric' | 'setImperial') => void;
  onLoadBrandPreset?: (presetId: string) => void;
  modifiedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  database,
  unitMode,
  onChangeUnitMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenUpload,
  onOpenExport,
  onOpenPrint,
  onOpenBulkModal,
  onOpenSpindleTuner,
  onOpenHelp,
  onFixUnitSwap,
  onLoadBrandPreset,
  modifiedCount,
}) => {
  const metricCount = database.tools.filter(t => t.unitFlag === 1 || t.unit === 'mm').length;
  const imperialCount = database.tools.length - metricCount;
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & File Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-100">
                Carveco Bit Studio
              </h1>
              <span className="text-xs text-zinc-500 font-mono">.TBD / .TDB Multi-CAM Toolbase</span>
            </div>
            {/* Metadata without pills: clean unboxed text with typographic separators */}
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono text-zinc-300">{database.fileName}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{database.tools.length} bits</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-zinc-400">
                {metricCount > 0 && imperialCount > 0
                  ? `${metricCount} mm / ${imperialCount} in`
                  : metricCount > 0
                  ? 'All Metric (mm)'
                  : 'All Imperial (in)'}
              </span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className={modifiedCount > 0 ? 'text-amber-400 font-medium' : 'text-zinc-500'}>
                {modifiedCount > 0 ? `${modifiedCount} modified` : 'No unsaved edits'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Mode Selector (3 options: Metric, Imperial, Native) */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              onClick={() => onChangeUnitMode('metric')}
              className={`px-2.5 py-1 font-medium transition-colors rounded ${
                unitMode === 'metric'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Display all bit diameters & stepdowns in millimeters (mm)"
            >
              Metric (mm)
            </button>
            <button
              onClick={() => onChangeUnitMode('imperial')}
              className={`px-2.5 py-1 font-medium transition-colors rounded ${
                unitMode === 'imperial'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Display all bit diameters & stepdowns in inches"
            >
              Imperial (in)
            </button>
            <button
              onClick={() => onChangeUnitMode('native')}
              className={`px-2.5 py-1 font-medium transition-colors rounded ${
                unitMode === 'native'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Display each bit in its exact database storage unit"
            >
              Native Units
            </button>
          </div>

          {/* Quick Unit Scale Fixers */}
          {onFixUnitSwap && (
            <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-xs">
              <button
                onClick={() => onFixUnitSwap('div254')}
                className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-amber-300 transition-colors"
                title="If 3.175mm bits were multiplied by 25.4 (showing as 80.65mm), click to divide by 25.4"
              >
                Fix ÷25.4
              </button>
              <div className="h-3.5 w-px bg-zinc-800" />
              <button
                onClick={() => onFixUnitSwap('setMetric')}
                className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-amber-300 transition-colors"
                title="Force set all bits to Metric (mm)"
              >
                Set All mm
              </button>
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-zinc-800" />
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* Bit Brands Quick Presets Dropdown */}
          {onLoadBrandPreset && (
            <div className="relative" ref={brandDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                title="Load manufacturer bit catalogs (Genmitsu, Whiteside, Amana, Freud, etc.)"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Bit Brands</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {isBrandDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Select Manufacturer Bit Catalog
                  </div>
                  {BRAND_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onLoadBrandPreset(preset.id);
                        setIsBrandDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-amber-300 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-zinc-200">{preset.brandName}</div>
                        <div className="text-[10px] text-zinc-500">{preset.category}</div>
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
                        {preset.toolCount} bits
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 710W Quick Tuner Trigger */}
          <button
            onClick={onOpenSpindleTuner}
            className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            title="Spindle wattage & feeds tuner bar"
          >
            <Gauge className="h-3.5 w-3.5 text-amber-400" />
            <span>Spindle Tuner</span>
          </button>

          {/* Advanced Bulk Math */}
          <button
            onClick={onOpenBulkModal}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Bulk math, multiply, clamp, find & replace"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
            <span>Bulk Math</span>
          </button>

          {/* Help & Assistance Guide */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:text-amber-300 hover:bg-zinc-850 transition-colors shadow-sm"
            title="Comprehensive operational guide, 710W physics & calculator (Press ?)"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Help & Guide</span>
            <kbd className="hidden sm:inline text-[9px] font-mono text-zinc-400 bg-zinc-950 px-1 py-0.2 rounded border border-zinc-800">
              ?
            </kbd>
          </button>

          {/* Print / Cheatsheet */}
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Printable Shop Floor Bit Chart"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>

          {/* Upload File */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
            title="Upload Carveco (.tbd/.tdb), Easel, Fusion 360, or Vectric files"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>

          {/* Export & Download */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm font-semibold"
            title="Export to Carveco, Easel, Vectric, Fusion 360, or Carbide Create"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Export & Save</span>
          </button>
        </div>
      </div>
    </header>
  );
};
