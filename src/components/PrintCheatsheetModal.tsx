import React from 'react';
import { X, Printer, Gauge } from 'lucide-react';
import { CarvecoTool } from '../types/tool';
import {
  DisplayUnitMode,
  getDisplayDiameter,
  getDisplayStepdown,
  getDisplayFeedRate,
  getDisplayPlungeRate,
} from '../utils/unitConverter';

interface PrintCheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: CarvecoTool[];
  fileName: string;
  unitMode: DisplayUnitMode;
}

export const PrintCheatsheetModal: React.FC<PrintCheatsheetModalProps> = ({
  isOpen,
  onClose,
  tools,
  fileName,
  unitMode,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-zinc-100">CNC Shop Floor Feeds & Speeds Cheatsheet</h2>
              <p className="text-xs text-zinc-400">Quick-reference chart for 710W trim router operators</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Cheatsheet</span>
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-auto bg-white text-zinc-900 p-6 rounded-lg font-sans text-xs print:p-0 print:m-0 print:bg-white print:text-black">
          <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Carveco Tool Database Reference</h1>
              <p className="text-zinc-600 text-xs mt-0.5">Database: {fileName} · 710W Spindle Calibration Profile</p>
            </div>
            <div className="text-right text-[11px] text-zinc-500">
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-400 bg-zinc-100 font-semibold text-zinc-800">
                <th className="py-2 px-2.5">Tool Name</th>
                <th className="py-2 px-2.5">Diameter</th>
                <th className="py-2 px-2.5">Stepdown</th>
                <th className="py-2 px-2.5">Feed Rate</th>
                <th className="py-2 px-2.5">Makita Dial</th>
                <th className="py-2 px-2.5">Spindle RPM</th>
                <th className="py-2 px-2.5">Plunge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-mono">
              {tools.slice(0, 100).map(t => {
                let dialStr = 'Dial 3';
                if (t.spindleSpeed <= 11000) dialStr = 'Dial 1 (10k)';
                else if (t.spindleSpeed <= 14000) dialStr = 'Dial 2 (12k)';
                else if (t.spindleSpeed <= 19000) dialStr = 'Dial 3 (17k)';
                else if (t.spindleSpeed <= 24000) dialStr = 'Dial 4 (22k)';
                else if (t.spindleSpeed <= 28500) dialStr = 'Dial 5 (27k)';
                else dialStr = 'Dial 6 (30k)';

                const diam = getDisplayDiameter(t, unitMode);
                const sdown = getDisplayStepdown(t, unitMode);
                const feed = getDisplayFeedRate(t, unitMode);
                const plunge = getDisplayPlungeRate(t, unitMode);

                return (
                  <tr key={t.id} className="hover:bg-zinc-50">
                    <td className="py-1.5 px-2.5 font-sans font-medium text-zinc-900">{t.name}</td>
                    <td className="py-1.5 px-2.5">{diam.formatted}</td>
                    <td className="py-1.5 px-2.5">{sdown.formatted}</td>
                    <td className="py-1.5 px-2.5 font-semibold">{feed.formatted}</td>
                    <td className="py-1.5 px-2.5 font-sans font-semibold text-amber-700">{dialStr}</td>
                    <td className="py-1.5 px-2.5">{t.spindleSpeed.toLocaleString()}</td>
                    <td className="py-1.5 px-2.5 text-zinc-600">{plunge.formatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {tools.length > 100 && (
            <p className="mt-4 text-[10px] text-zinc-500 text-center italic">
              Showing first 100 of {tools.length} bits. Use the CSV export for the full list.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
