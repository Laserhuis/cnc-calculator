import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { CarvecoTool, ToolType } from '../types/tool';

interface ToolDetailModalProps {
  tool: CarvecoTool | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolId: string, updates: Partial<CarvecoTool>) => void;
  unitSystem: 'imperial' | 'metric';
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  isOpen,
  onClose,
  onSave,
  unitSystem,
}) => {
  if (!isOpen || !tool) return null;

  const [formData, setFormData] = useState<CarvecoTool>({ ...tool });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (tool) setFormData({ ...tool });
  }, [tool]);

  const handleChange = (field: keyof CarvecoTool, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(tool.id, formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  // Quick 710W Dial button click
  const setDialSpeed = (rpm: number) => {
    handleChange('spindleSpeed', rpm);
  };

  // Chip Load
  const chipLoad = formData.feedRate / (formData.spindleSpeed * (formData.fluteCount || 2));

  // Render 2D SVG Profile Preview
  const renderToolSvg = () => {
    const isVBit = formData.toolType === 'vbit';
    const isBall = formData.toolType === 'ballnose';
    const isSurfacing = formData.toolType === 'surfacing';

    return (
      <svg viewBox="0 0 160 200" className="w-32 h-40 mx-auto stroke-amber-400 fill-zinc-900">
        {/* Collet / Shank */}
        <rect x="55" y="10" width="50" height="70" rx="3" strokeWidth="2" fill="#27272a" stroke="#71717a" />
        <line x1="55" y1="45" x2="105" y2="45" stroke="#52525b" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Tool Cutting Flutes */}
        {isVBit ? (
          // V-Bit triangular point
          <polygon
            points="55,80 105,80 80,180"
            strokeWidth="2.5"
            stroke="#f59e0b"
            fill="#3f3f46"
          />
        ) : isBall ? (
          // Ball Nose curved bottom
          <path
            d="M 60,80 L 60,150 Q 60,180 80,180 Q 100,180 100,150 L 100,80 Z"
            strokeWidth="2.5"
            stroke="#f59e0b"
            fill="#3f3f46"
          />
        ) : isSurfacing ? (
          // Wide surfacing T-bar
          <g>
            <rect x="70" y="80" width="20" height="50" strokeWidth="2" stroke="#71717a" fill="#27272a" />
            <polygon
              points="30,130 130,130 130,165 30,165"
              strokeWidth="2.5"
              stroke="#f59e0b"
              fill="#3f3f46"
            />
          </g>
        ) : (
          // Standard cylindrical end mill
          <rect
            x="62"
            y="80"
            width="36"
            height="90"
            rx="1"
            strokeWidth="2.5"
            stroke="#f59e0b"
            fill="#3f3f46"
          />
        )}

        {/* Flute spiral accents */}
        <line x1="65" y1="95" x2="95" y2="115" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
        <line x1="65" y1="125" x2="95" y2="145" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

        {/* Dimension labels */}
        <text x="80" y="195" textAnchor="middle" fill="#d4d4d8" fontSize="10" fontFamily="monospace">
          Ø {formData.diameter}{formData.unitFlag === 1 ? 'mm' : '"'}
        </text>
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{formData.name}</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <span>Group: {formData.group}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{formData.toolType}</span>
              <span aria-hidden="true">·</span>
              <span>Tool #{formData.toolNo}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Split: SVG Tool Diagram + 710W Quick Dials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
          <div className="flex flex-col items-center justify-center">
            {renderToolSvg()}
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Gauge className="h-4 w-4" />
                  <span>710W Router Speed Dial Selector</span>
                </span>
                <span className="font-mono text-zinc-300 font-bold">
                  {formData.spindleSpeed.toLocaleString()} RPM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2">
                Click a dial to quickly snap spindle speed to standard Makita / Katsu router dial markings:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { dial: 1, rpm: 10000 },
                  { dial: 2, rpm: 12000 },
                  { dial: 3, rpm: 17000 },
                  { dial: 4, rpm: 22000 },
                  { dial: 5, rpm: 27000 },
                  { dial: 6, rpm: 30000 },
                ].map(d => (
                  <button
                    key={d.dial}
                    type="button"
                    onClick={() => setDialSpeed(d.rpm)}
                    className={`py-1 px-2 text-xs rounded border transition-colors flex flex-col items-center ${
                      formData.spindleSpeed === d.rpm
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400">Dial {d.dial}</span>
                    <span className="font-mono">{d.rpm / 1000}k</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Chip Load */}
            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-zinc-400 block text-[11px]">Calculated Chip Load:</span>
                <span className="font-mono text-zinc-200 font-bold">
                  {chipLoad.toFixed(4)}" / tooth ({(chipLoad * 25.4).toFixed(3)} mm)
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  chipLoad >= 0.001 && chipLoad <= 0.006
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {chipLoad < 0.001 ? 'Low Load (Rubbing Risk)' : chipLoad > 0.007 ? 'High Load' : 'Ideal Cut Load'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Tool Name & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tool Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Group / Library Folder</label>
              <input
                type="text"
                value={formData.group}
                onChange={e => handleChange('group', e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Unit selector for this bit */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
            <div>
              <span className="text-xs font-medium text-zinc-300 block">Bit Measurement Standard</span>
              <span className="text-[11px] text-zinc-500">Specifies how Carveco reads this bit's dimensions and feed units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (formData.unit !== 'mm') {
                    // Ask or convert
                    const shouldScale = confirm('Convert dimensions from inches to mm (multiply by 25.4)? Click OK to convert numbers, or Cancel to change unit tag only.');
                    if (shouldScale) {
                      setFormData(prev => ({
                        ...prev,
                        unit: 'mm',
                        unitFlag: 1,
                        diameter: Math.round(prev.diameter * 25.4 * 100) / 100,
                        stepdown: Math.round(prev.stepdown * 25.4 * 100) / 100,
                        feedRate: Math.round(prev.feedRate * 25.4),
                        plungeRate: Math.round(prev.plungeRate * 25.4),
                        feedUnit: 2,
                        plungeUnit: 2,
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, unit: 'mm', unitFlag: 1, feedUnit: 2, plungeUnit: 2 }));
                    }
                  }
                }}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  formData.unitFlag === 1 || formData.unit === 'mm'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Metric (mm & mm/min)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (formData.unit !== 'inch') {
                    const shouldScale = confirm('Convert dimensions from mm to inches (divide by 25.4)? Click OK to convert numbers, or Cancel to change unit tag only.');
                    if (shouldScale) {
                      setFormData(prev => ({
                        ...prev,
                        unit: 'inch',
                        unitFlag: 0,
                        diameter: Math.round((prev.diameter / 25.4) * 10000) / 10000,
                        stepdown: Math.round((prev.stepdown / 25.4) * 10000) / 10000,
                        feedRate: Math.round((prev.feedRate / 25.4) * 10) / 10,
                        plungeRate: Math.round((prev.plungeRate / 25.4) * 10) / 10,
                        feedUnit: 4,
                        plungeUnit: 3,
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, unit: 'inch', unitFlag: 0, feedUnit: 4, plungeUnit: 3 }));
                    }
                  }
                }}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  formData.unitFlag === 0 || formData.unit === 'inch'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Imperial (inches & IPM)
              </button>
            </div>
          </div>

          {/* Cutting Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Diameter ({formData.unitFlag === 1 ? 'mm' : 'in'})
              </label>
              <input
                type="number"
                step="any"
                value={formData.diameter}
                onChange={e => handleChange('diameter', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Stepdown ({formData.unitFlag === 1 ? 'mm' : 'in'})
              </label>
              <input
                type="number"
                step="any"
                value={formData.stepdown}
                onChange={e => handleChange('stepdown', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Feed Rate ({formData.unitFlag === 1 ? 'mm/min' : 'IPM'})
              </label>
              <input
                type="number"
                step="any"
                value={formData.feedRate}
                onChange={e => handleChange('feedRate', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Plunge Rate ({formData.unitFlag === 1 ? 'mm/min' : 'IPM'})
              </label>
              <input
                type="number"
                step="any"
                value={formData.plungeRate}
                onChange={e => handleChange('plungeRate', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Spindle Speed (RPM)</label>
              <input
                type="number"
                step="100"
                value={formData.spindleSpeed}
                onChange={e => handleChange('spindleSpeed', parseInt(e.target.value, 10) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Stepover / Param 2</label>
              <input
                type="number"
                step="any"
                value={formData.param2}
                onChange={e => handleChange('param2', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Flutes</label>
              <select
                value={formData.fluteCount}
                onChange={e => handleChange('fluteCount', parseInt(e.target.value, 10))}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                <option value={1}>1 Flute (O-Flute)</option>
                <option value={2}>2 Flutes (Standard)</option>
                <option value={3}>3 Flutes</option>
                <option value={4}>4 Flutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tool Number</label>
              <input
                type="number"
                value={formData.toolNo}
                onChange={e => handleChange('toolNo', parseInt(e.target.value, 10) || 0)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Notes & Carveco Toolpath Comments
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...tool,
                diameter: tool.originalValues.diameter,
                stepdown: tool.originalValues.stepdown,
                spindleSpeed: tool.originalValues.spindleSpeed,
                feedRate: tool.originalValues.feedRate,
                plungeRate: tool.originalValues.plungeRate,
              });
            }}
            className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Bit to Original Values</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded bg-amber-500 px-5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              {saveSuccess ? <Check className="h-4 w-4" /> : null}
              <span>{saveSuccess ? 'Saved!' : 'Save Bit Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
