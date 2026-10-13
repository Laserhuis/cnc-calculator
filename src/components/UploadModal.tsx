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
  ClipboardList,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { parseUploadedFile, parseTextTools, base64ToArrayBuffer } from '../utils/tdbParser';
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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPreference, setUnitPreference] = useState<'auto' | 'metric' | 'imperial'>('auto');
  const [pastedText, setPastedText] = useState('');
  const [pastedFileName, setPastedFileName] = useState('Pasted Tool Library.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parseUploadedFile(file, unitPreference);
      if (result.tools.length === 0) {
        throw new Error(
          result.parsingNotes ||
            `No valid CNC bit entries could be parsed from "${file.name}". Please check that the file contains tool names and diameter values, or use the Paste Data tab.`
        );
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
          'Failed to read file. Please verify it is a valid Carveco (.tbd/.tdb), Easel (.json/.csv), Fusion 360 (.tools), Vectric CSV, or Candle G-code file.'
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setError('Please paste your tool library text, CSV, or JSON first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = parseTextTools(pastedText, pastedFileName, unitPreference);
      if (result.tools.length === 0) {
        throw new Error('Could not identify CNC bits in the pasted text. Ensure lines contain bit names and numeric diameters.');
      }

      onLoadDatabase({
        fileName: pastedFileName || 'Pasted Tools.csv',
        format: 'csv',
        tools: result.tools,
        groups: result.groups,
        rawBuffer: new ArrayBuffer(0),
        history: [result.tools],
        historyIndex: 0,
        detectedFileUnit: result.detectedFileUnit,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to parse pasted data.');
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
    if (file) {
      handleProcessFile(file);
    }
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

  // Find Genmitsu preset for prominent sponsor highlighting
  const genmitsuPreset = BRAND_PRESETS.find(p => p.id === 'genmitsu');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">Import Tool Database</h2>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                  Genmitsu Optimized
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Supports Carveco (.tbd/.tdb), Easel (.json/.csv), Vectric/Excel CSV (;, tab, comma), Candle G-code, Fusion 360
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

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-zinc-800 text-amber-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'paste'
                  ? 'bg-zinc-800 text-amber-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Paste CSV / Text
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'presets'
                  ? 'bg-zinc-800 text-amber-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Manufacturer Presets
            </button>
          </div>

          {/* Unit Preference Selector */}
          <div className="flex items-center rounded border border-zinc-800 bg-zinc-900 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setUnitPreference('auto')}
              className={`px-2 py-0.5 rounded transition-colors ${
                unitPreference === 'auto' ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Auto-detect metric vs imperial from data"
            >
              Auto Units
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference('metric')}
              className={`px-2 py-0.5 rounded transition-colors ${
                unitPreference === 'metric' ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Force mm & mm/min"
            >
              Metric (mm)
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference('imperial')}
              className={`px-2 py-0.5 rounded transition-colors ${
                unitPreference === 'imperial' ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Force inches & IPM"
            >
              Imperial (in)
            </button>
          </div>
        </div>

        {/* Sponsor Spotlight: Genmitsu One-Click Load */}
        {genmitsuPreset && (
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300">Official Genmitsu Bit Catalog</span>
                <span className="text-[10px] text-emerald-400 font-mono">28 bits · Metric pre-calibrated</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Complete official library: Nano Blue, TiN, Ball Nose 3D, V-Bits, O-Flutes, and Surfacing cutters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleLoadBrandPreset(genmitsuPreset)}
              className="shrink-0 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs px-3 py-1.5 transition-colors shadow-sm"
            >
              Load Genmitsu Library
            </button>
          </div>
        )}

        {/* Tab 1: Drag & Drop Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tbd,.tdb,.csv,.tsv,.txt,.json,.tools,.nc,.gcode,.tap"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 mb-2">
                <Upload className="h-5 w-5" />
              </div>

              <p className="text-xs font-semibold text-zinc-200">
                {loading ? 'Analyzing tools and converting schemas...' : 'Drop your CNC tool library file here'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                or click to browse (.tbd, .tdb, .csv, .json, .tools, .nc)
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-zinc-400">
                <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">Carveco (.tbd, .tdb)</span>
                <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">European / Dutch Excel (;, comma)</span>
                <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">Easel (.json, .csv)</span>
                <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">Candle GRBL (.nc, .gcode)</span>
                <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">Fusion 360 (.tools)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Paste Text / CSV / JSON */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Paste comma or semicolon CSV, tab-delimited text, or JSON:</span>
              <input
                type="text"
                value={pastedFileName}
                onChange={e => setPastedFileName(e.target.value)}
                placeholder="Database name"
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono w-48"
              />
            </div>
            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={`Example CSV (Dutch / European or English):
Tool Name;Diameter;Stepdown;RPM;Feed;Plunge
Genmitsu 1/8 Nano Blue;3,175;0,6;10000;600;180
Genmitsu 60 V-Bit;12,7;1,5;9000;750;200
Genmitsu 4mm Roughing;4,0;0,8;8500;700;180`}
              rows={6}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleProcessPastedText}
              disabled={loading || !pastedText.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-zinc-950 font-semibold text-xs py-2 transition-colors"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Parse & Load Pasted Tools</span>
            </button>
          </div>
        )}

        {/* Tab 3: Presets Gallery */}
        {activeTab === 'presets' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRAND_PRESETS.map(preset => {
                const isGenmitsu = preset.id === 'genmitsu';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleLoadBrandPreset(preset)}
                    className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all group ${
                      isGenmitsu
                        ? 'border-emerald-800 bg-emerald-950/30 hover:border-emerald-600 hover:bg-emerald-950/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300">
                        {preset.brandName}
                      </span>
                      <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded font-mono text-zinc-300">
                        {preset.toolCount} bits · {preset.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">{preset.category}</span>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-900/60 p-3 text-xs text-red-300 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Upload failed:</span>
              <p>{error}</p>
              <div className="text-[11px] text-red-400/90 pt-1 border-t border-red-900/40">
                Tip: If your file is a European Excel CSV with semicolons (;) or commas in numbers (3,175), use the <strong>Paste CSV / Text</strong> tab above to preview and import instantly.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
