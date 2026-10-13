import React, { useState } from 'react';
import {
  Download,
  X,
  FileCode,
  FileSpreadsheet,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { CarvecoTool } from '../types/tool';
import {
  writeBinaryTdb,
  exportToCsv,
  exportToJson,
  exportToEaselJson,
  exportToEaselCsv,
  exportToVectricCsv,
  exportToFusion360Tools,
  exportToCarbideCreateCsv,
  exportToCandleGrblTools,
  exportToUgsCsv,
} from '../utils/tdbParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: CarvecoTool[];
  fileName: string;
  rawBuffer: ArrayBuffer | null;
  modifiedCount: number;
}

type SoftwareTab = 'all' | 'genmitsu_grbl' | 'carveco' | 'easel' | 'vectric' | 'fusion' | 'carbide';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tools,
  fileName,
  rawBuffer,
  modifiedCount,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SoftwareTab>('all');
  const [expandedInstructions, setExpandedInstructions] = useState<string | null>('candle');

  if (!isOpen) return null;

  // Base filename without extension
  const baseName = fileName.replace(/\.(tbd|tdb|csv|json|tools|nc|gcode)$/i, '') || 'calibrated_tools';

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadCandleGrbl = () => {
    const content = exportToCandleGrblTools(tools);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_candle_grbl.nc`);
  };

  const handleDownloadUgsCsv = () => {
    const csv = exportToUgsCsv(tools);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_ugs_tools.csv`);
  };

  const handleDownloadTbd = () => {
    const binary = writeBinaryTdb(tools, rawBuffer);
    const blob = new Blob([binary], { type: 'application/octet-stream' });
    triggerDownload(blob, `${baseName}.tbd`);
  };

  const handleDownloadTdb = () => {
    const binary = writeBinaryTdb(tools, rawBuffer);
    const blob = new Blob([binary], { type: 'application/octet-stream' });
    triggerDownload(blob, `${baseName}.tdb`);
  };

  const handleDownloadEaselJson = () => {
    const json = exportToEaselJson(tools);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `${baseName}_easel_tools.json`);
  };

  const handleDownloadEaselCsv = () => {
    const csv = exportToEaselCsv(tools);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_easel.csv`);
  };

  const handleDownloadVectricCsv = () => {
    const csv = exportToVectricCsv(tools);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_vectric_tool_database.csv`);
  };

  const handleDownloadFusion360 = () => {
    const toolsJson = exportToFusion360Tools(tools);
    const blob = new Blob([toolsJson], { type: 'application/json' });
    triggerDownload(blob, `${baseName}_fusion360.tools`);
  };

  const handleDownloadCarbideCreate = () => {
    const csv = exportToCarbideCreateCsv(tools);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_carbide_create.csv`);
  };

  const handleDownloadCsv = () => {
    const csv = exportToCsv(tools);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${baseName}_spreadsheet.csv`);
  };

  const handleDownloadJson = () => {
    const json = exportToJson(tools);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `${baseName}_backup.json`);
  };

  const toggleInstructions = (software: string) => {
    setExpandedInstructions(prev => (prev === software ? null : software));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">Export Multi-CAM Tool Database</h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                  Genmitsu & All Brands
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {modifiedCount > 0
                  ? `${modifiedCount} of ${tools.length} bits calibrated & ready to export`
                  : `Export all ${tools.length} bits with current parameters`}
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

        {/* Software Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => setActiveTab('genmitsu_grbl')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'genmitsu_grbl'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Candle / GRBL (Genmitsu)
          </button>
          <button
            onClick={() => setActiveTab('carveco')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'carveco'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Carveco / ArtCAM
          </button>
          <button
            onClick={() => setActiveTab('easel')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'easel'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Inventables Easel
          </button>
          <button
            onClick={() => setActiveTab('vectric')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'vectric'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Vectric (VCarve/Aspire)
          </button>
          <button
            onClick={() => setActiveTab('fusion')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'fusion'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Fusion 360
          </button>
          <button
            onClick={() => setActiveTab('carbide')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'carbide'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Carbide Create
          </button>
        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-900/60 p-2.5 text-xs text-emerald-300 shrink-0">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              Downloaded <strong className="font-mono text-white">{downloadSuccess}</strong> successfully.
            </span>
          </div>
        )}

        {/* Scrollable Export Card Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 1. GENMITSU / CANDLE GRBL EXPORT */}
          {(activeTab === 'all' || activeTab === 'genmitsu_grbl') && (
            <div className="space-y-2 border border-emerald-900/50 rounded-xl bg-emerald-950/15 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span>Genmitsu CNC / Candle (GRBL) & UGS</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Official Genmitsu Sender</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCandleGrbl}
                  className="flex items-center justify-between rounded-lg border border-emerald-800/80 bg-zinc-900/90 p-3 hover:border-emerald-600 hover:bg-emerald-950/30 transition-all text-left group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300">
                        Candle GRBL Tool Definitions (.nc)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      T-codes, RPM speeds (S), and feed rates (F) ready for Candle & Genmitsu controllers
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadUgsCsv}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Universal Gcode Sender (.csv)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      UGS tool database table with diameters, descriptions, and offsets
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 2. CARVECO / ARTCAM */}
          {(activeTab === 'all' || activeTab === 'carveco') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <FileCode className="h-4 w-4 text-amber-400" />
                <span>Carveco Maker, Pro & ArtCAM</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTbd}
                  className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-zinc-900/90 p-3 hover:border-amber-500 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                        Carveco .TBD Binary
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-medium">
                        Standard
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Native binary tool database file with .tbd extension
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-amber-400 shrink-0 ml-2" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTdb}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Carveco .TDB Binary
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Standard Tool Database format compatible with ArtCAM
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 3. INVENTABLES EASEL */}
          {(activeTab === 'all' || activeTab === 'easel') && (
            <div className="space-y-2 pt-1 border-t border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Inventables Easel (Web CAM)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadEaselJson}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Easel Custom Bits (.json)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Direct JSON format for Easel Toolbox & Custom Bit Manager
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadEaselCsv}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Easel Spreadsheet (.csv)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      CSV schema with depth per pass, feed, plunge & RPM
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 4. VECTRIC */}
          {(activeTab === 'all' || activeTab === 'vectric') && (
            <div className="space-y-2 pt-1 border-t border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Cpu className="h-4 w-4 text-amber-400" />
                <span>Vectric Software (VCarve Pro / Desktop, Aspire, Cut2D)</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadVectricCsv}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                        Vectric Tool Database Import (.csv)
                      </span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-mono">
                        VCarve & Aspire
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Tool Name, Type, Diameter, Pass Depth, Stepover, Speeds & Feeds
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 5. AUTODESK FUSION 360 */}
          {(activeTab === 'all' || activeTab === 'fusion') && (
            <div className="space-y-2 pt-1 border-t border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Layers className="h-4 w-4 text-amber-400" />
                <span>Autodesk Fusion 360 CAM</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadFusion360}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Fusion 360 CAM Tool Library (.tools)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Standard JSON tool library with cutting presets, stepover, stepdown, and spindle RPM
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 6. CARBIDE CREATE */}
          {(activeTab === 'all' || activeTab === 'carbide') && (
            <div className="space-y-2 pt-1 border-t border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Cpu className="h-4 w-4 text-amber-400" />
                <span>Carbide Create (Shapeoko & Nomad)</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCarbideCreate}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Carbide Create Custom Library (.csv)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Importable CSV tool library matching Carbide 3D schema
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* 7. UNIVERSAL SPREADSHEET & BACKUP */}
          {activeTab === 'all' && (
            <div className="space-y-2 pt-1 border-t border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                <span>Universal Spreadsheet & Backup</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Universal CSV (.csv)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      For Excel, LibreOffice, or Google Sheets
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left group"
                >
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 group-hover:text-zinc-200">
                      Raw JSON Backup (.json)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Full digital twin of all bits with original baseline data
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Import Guides */}
        <div className="border-t border-zinc-800 pt-3 shrink-0 space-y-1.5">
          <span className="text-xs font-medium text-zinc-400 block">How to import into your software:</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Candle Guide */}
            <div className="rounded-lg border border-emerald-900/40 bg-zinc-900/50 p-2.5">
              <button
                type="button"
                onClick={() => toggleInstructions('candle')}
                className="flex items-center justify-between w-full font-medium text-emerald-300 hover:text-emerald-200"
              >
                <span>Candle (Genmitsu GRBL)</span>
                {expandedInstructions === 'candle' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {expandedInstructions === 'candle' && (
                <ol className="mt-2 list-decimal list-inside text-[11px] text-zinc-400 space-y-1">
                  <li>In Candle, open <strong>Service</strong> &gt; <strong>Settings</strong> &gt; <strong>Tool Table</strong>.</li>
                  <li>Or load the exported <code className="text-emerald-300">.nc</code> header before running your G-code to verify spindle RPM and speeds.</li>
                </ol>
              )}
            </div>

            {/* Carveco Guide */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
              <button
                type="button"
                onClick={() => toggleInstructions('carveco')}
                className="flex items-center justify-between w-full font-medium text-zinc-200 hover:text-amber-300"
              >
                <span>Carveco / ArtCAM</span>
                {expandedInstructions === 'carveco' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {expandedInstructions === 'carveco' && (
                <ol className="mt-2 list-decimal list-inside text-[11px] text-zinc-400 space-y-1">
                  <li>In Carveco, open <strong>Toolpath</strong> &gt; <strong>Tool Database</strong>.</li>
                  <li>Click <strong>Import...</strong> at bottom left.</li>
                  <li>Choose your downloaded <code className="text-amber-300">.tbd</code> or <code className="text-amber-300">.tdb</code>.</li>
                </ol>
              )}
            </div>

            {/* Easel Guide */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
              <button
                type="button"
                onClick={() => toggleInstructions('easel')}
                className="flex items-center justify-between w-full font-medium text-zinc-200 hover:text-amber-300"
              >
                <span>Inventables Easel</span>
                {expandedInstructions === 'easel' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {expandedInstructions === 'easel' && (
                <ol className="mt-2 list-decimal list-inside text-[11px] text-zinc-400 space-y-1">
                  <li>In Easel, click <strong>Carve</strong> &gt; <strong>Change bit</strong>.</li>
                  <li>Select <strong>Manage Custom Bits</strong>.</li>
                  <li>Click <strong>Import</strong> and select your downloaded <code className="text-amber-300">.json</code> or <code className="text-amber-300">.csv</code>.</li>
                </ol>
              )}
            </div>

            {/* Vectric Guide */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
              <button
                type="button"
                onClick={() => toggleInstructions('vectric')}
                className="flex items-center justify-between w-full font-medium text-zinc-200 hover:text-amber-300"
              >
                <span>Vectric (VCarve / Aspire)</span>
                {expandedInstructions === 'vectric' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {expandedInstructions === 'vectric' && (
                <ol className="mt-2 list-decimal list-inside text-[11px] text-zinc-400 space-y-1">
                  <li>Open <strong>Toolpaths</strong> tab &gt; <strong>Tool Database</strong>.</li>
                  <li>Click the <strong>Import</strong> button (folder icon) at bottom.</li>
                  <li>Select your downloaded <code className="text-amber-300">.csv</code> file.</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
