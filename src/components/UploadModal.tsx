import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileCode,
  Sparkles,
  AlertCircle,
  Cpu,
  Layers,
  Check,
  FolderOpen,
} from 'lucide-react';
import { parseUploadedFile, base64ToArrayBuffer, parseBinaryTdb } from '../utils/tdbParser';
import { SAMPLE_TDB_BASE64 } from '../data/sampleTdbBase64';
import { BRAND_PRESETS, BrandPresetMeta } from '../data/presetDatabases';
import { DatabaseState, CarvecoTool } from '../types/tool';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDatabase: (state: DatabaseState) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadDatabase,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPreference, setUnitPreference] = useState<'auto' | 'metric' | 'imperial'>('auto');
  const [selectedBrandTab, setSelectedBrandTab] = useState<'all' | 'desktop' | 'industrial'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parseUploadedFile(file, unitPreference);
      if (result.tools.length === 0) {
        throw new Error('No valid CNC tool entries found in this file. Please verify file format.');
      }

      onLoadDatabase({
        fileName: file.name,
        format: result.isBinary ? 'carveco_binary' : 'csv',
        tools: result.tools,
        groups: result.groups,
        rawBuffer: result.rawBuffer,
        history: [result.tools],
        historyIndex: 0,
        detectedFileUnit: result.detectedFileUnit,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to read file. Please ensure it is a valid Carveco .tbd/.tdb, Easel .json, Fusion 360 .tools, or Vectric/CSV file.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleProcessFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleLoadBrandPreset = (preset: BrandPresetMeta) => {
    const tools = JSON.parse(JSON.stringify(preset.tools)) as CarvecoTool[];
    const groupsSet = new Set<string>();
    tools.forEach(t => groupsSet.add(t.group));

    let rawBuffer: ArrayBuffer | null = null;
    try {
      rawBuffer = base64ToArrayBuffer(SAMPLE_TDB_BASE64);
    } catch {
      rawBuffer = null;
    }

    onLoadDatabase({
      fileName: `${preset.brandName} Tool Database.${preset.unit === 'metric' ? 'tbd' : 'tdb'}`,
      format: 'carveco_binary',
      tools,
      groups: Array.from(groupsSet),
      rawBuffer,
      history: [tools],
      historyIndex: 0,
      detectedFileUnit: preset.unit,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Import Tool Database</h2>
              <p className="text-xs text-zinc-400">
                Load Carveco (.tbd/.tdb), Easel (.json/.csv), Fusion 360 (.tools), Vectric CSV, or Brand Presets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Unit Interpretation Bar */}
        <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">File Unit Calibration:</span>
            <span className="text-[10px] text-zinc-500 font-mono">Ensures 3.175mm bits aren't scaled to 80mm</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setUnitPreference('auto')}
              className={`py-1.5 px-2 rounded border transition-colors ${
                unitPreference === 'auto'
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 font-semibold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Auto-Detect Units
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference('metric')}
              className={`py-1.5 px-2 rounded border transition-colors ${
                unitPreference === 'metric'
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 font-semibold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Force Metric (mm & mm/min)
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference('imperial')}
              className={`py-1.5 px-2 rounded border transition-colors ${
                unitPreference === 'imperial'
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 font-semibold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Force Imperial (inches & IPM)
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            {unitPreference === 'metric'
              ? '✓ All tool diameters will be parsed in millimeters (e.g., 3.175 mm = 1/8") with feed rates in mm/min.'
              : unitPreference === 'imperial'
              ? '✓ All tool diameters will be parsed in inches (e.g., 0.25" = 1/4") with feed rates in in/min.'
              : 'Auto-detects based on Carveco binary unit flag, tool group name, and feed rate scale.'}
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all shrink-0 ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tbd,.tdb,.csv,.tsv,.txt,.json,.tools"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 mb-2">
            <Upload className="h-5 w-5" />
          </div>

          <p className="text-xs font-semibold text-zinc-200">
            {loading ? 'Analyzing tools and converting schemas...' : 'Drop your CNC tool library file here'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            or click to browse your computer (.tbd, .tdb, .tools, .json, .csv)
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-zinc-400">
            <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-750">Carveco / ArtCAM (.tbd, .tdb)</span>
            <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-750">Easel (.json, .csv)</span>
            <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-750">Fusion 360 (.tools)</span>
            <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-750">Vectric / Carbide Create (.csv)</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-900/60 p-3 text-xs text-red-300 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Brand Preset Libraries Gallery */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Or Load Built-in Bit Brand Presets:</span>
            </div>
            <span className="text-[10px] text-zinc-500">{BRAND_PRESETS.length} manufacturer libraries</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
            {BRAND_PRESETS.map(preset => {
              const isGenmitsu = preset.id === 'genmitsu';
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadBrandPreset(preset)}
                  className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all group ${
                    isGenmitsu
                      ? 'border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700 hover:bg-emerald-950/40'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                      {preset.brandName}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        preset.unit === 'metric'
                          ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {preset.toolCount} bits · {preset.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-medium">{preset.category}</span>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
