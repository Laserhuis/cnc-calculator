import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Calculator,
  Compass,
  Layers,
  Cpu,
  ChevronRight,
  ShieldAlert,
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
  const [activeTab, setActiveTab] = useState<'geometry' | 'feeds' | 'material'>('geometry');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (tool) {
      setFormData({
        ...tool,
        stepover: tool.stepover ?? (tool.toolType === 'ballnose' || tool.toolType === 'conical' ? Math.round(tool.diameter * 0.1 * 1000) / 1000 : Math.round(tool.diameter * 0.4 * 1000) / 1000),
        stepoverPercent: tool.stepoverPercent ?? (tool.toolType === 'ballnose' || tool.toolType === 'conical' ? 10 : 40),
        tipSize: tool.tipSize ?? (tool.toolType === 'ballnose' ? Math.round((tool.diameter / 2) * 1000) / 1000 : tool.toolType === 'engraving' ? 0.1 : undefined),
        angle: tool.angle ?? (tool.toolType === 'vbit' ? 60 : tool.toolType === 'conical' ? 3.82 : tool.toolType === 'engraving' ? 30 : undefined),
        fluteLength: tool.fluteLength ?? Math.round(tool.diameter * 3 * 100) / 100,
        shankDiameter: tool.shankDiameter ?? (tool.diameter <= 3.2 ? 3.175 : tool.diameter <= 6.35 ? 6.35 : tool.diameter),
        materialGroup: tool.materialGroup ?? 'General / All Materials',
      });
    }
  }, [tool]);

  const handleChange = (field: keyof CarvecoTool, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      // Keep stepover distance and percentage synchronized
      if (field === 'stepover') {
        const numDist = parseFloat(value) || 0;
        if (next.diameter > 0) {
          next.stepoverPercent = Math.round((numDist / next.diameter) * 100);
        }
        next.param2 = numDist;
      } else if (field === 'stepoverPercent') {
        const numPct = parseFloat(value) || 0;
        next.stepover = Math.round((next.diameter * (numPct / 100)) * 10000) / 10000;
        next.param2 = next.stepover;
      } else if (field === 'diameter') {
        const numDiam = parseFloat(value) || 0;
        if (next.stepoverPercent && next.stepoverPercent > 0) {
          next.stepover = Math.round((numDiam * (next.stepoverPercent / 100)) * 10000) / 10000;
        }
        if (next.toolType === 'ballnose') {
          next.tipSize = Math.round((numDiam / 2) * 10000) / 10000;
        }
      } else if (field === 'tipSize') {
        const numTip = parseFloat(value) || 0;
        if (next.toolType === 'conical' || next.toolType === 'engraving' || next.toolType === 'radiused') {
          next.param2 = numTip;
        }
      } else if (field === 'angle') {
        const numAngle = parseFloat(value) || 0;
        if (next.toolType === 'vbit') {
          next.param2 = numAngle;
        }
      }

      return next;
    });
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

  // Chip Load calculation: Feed / (RPM * Flutes)
  const isMetric = formData.unitFlag === 1 || formData.unit === 'mm';
  const effectiveFeedPerMin =
    formData.feedUnit === 1
      ? formData.feedRate * 60 // mm/sec to mm/min
      : formData.feedUnit === 3
      ? formData.feedRate * 60 // in/sec to in/min
      : formData.feedRate;

  const chipLoad = effectiveFeedPerMin / (Math.max(1, formData.spindleSpeed) * (formData.fluteCount || 2));
  const chipLoadInches = isMetric ? chipLoad / 25.4 : chipLoad;
  const chipLoadMm = isMetric ? chipLoad : chipLoad * 25.4;

  // Render 2D SVG Profile Preview with Dimension Callouts
  const renderToolSvg = () => {
    const isVBit = formData.toolType === 'vbit';
    const isBall = formData.toolType === 'ballnose';
    const isConical = formData.toolType === 'conical';
    const isBowlTray = formData.toolType === 'bowl_tray';
    const isEngraving = formData.toolType === 'engraving';
    const isRadiused = formData.toolType === 'radiused';
    const isSurfacing = formData.toolType === 'surfacing';
    const isDrill = formData.toolType === 'drill';

    const tipSizeLabel = formData.tipSize !== undefined
      ? `${formData.tipSize}${isMetric ? 'mm' : '"'}`
      : isBall
      ? `R${(formData.diameter / 2).toFixed(2)}${isMetric ? 'mm' : '"'}`
      : null;

    const angleLabel = formData.angle !== undefined ? `${formData.angle}°` : isVBit ? '60°' : isConical ? '3.82°' : null;

    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 160 210" className="w-36 h-48 mx-auto select-none">
          {/* Background grid markings */}
          <line x1="80" y1="10" x2="80" y2="195" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* Collet / Shank */}
          <rect x="56" y="15" width="48" height="60" rx="2" strokeWidth="2" fill="#27272a" stroke="#71717a" />
          <line x1="56" y1="42" x2="104" y2="42" stroke="#52525b" strokeWidth="1" strokeDasharray="2 2" />
          <text x="80" y="32" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontFamily="sans-serif">
            SHANK {formData.shankDiameter ? `${formData.shankDiameter}${isMetric ? 'mm' : '"'}` : ''}
          </text>

          {/* Cutter Neck Transition */}
          <polygon points="56,75 104,75 96,88 64,88" fill="#3f3f46" stroke="#71717a" strokeWidth="1.5" />

          {/* Tool Cutting Flutes by Type */}
          {isVBit ? (
            // V-Bit Triangular Point (with flat tip width if tipSize > 0)
            <g>
              {formData.tipSize && formData.tipSize > 0 ? (
                // Flat-bottom V-bit (Trapezoid)
                <polygon
                  points="62,88 98,88 84,175 76,175"
                  strokeWidth="2.5"
                  stroke="#f59e0b"
                  fill="#78350f"
                />
              ) : (
                // Sharp V-bit (Triangle)
                <polygon
                  points="62,88 98,88 80,180"
                  strokeWidth="2.5"
                  stroke="#f59e0b"
                  fill="#78350f"
                />
              )}
              {/* Angle arc indicator */}
              <path d="M 72,110 Q 80,118 88,110" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
              {angleLabel && (
                <text x="80" y="125" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                  {angleLabel}
                </text>
              )}
            </g>
          ) : isConical ? (
            // Tapered Ball Nose (Tapered shaft + small rounded ball tip)
            <g>
              <path
                d="M 64,88 L 96,88 L 84,170 Q 84,178 80,178 Q 76,178 76,170 Z"
                strokeWidth="2.5"
                stroke="#38bdf8"
                fill="#0369a1"
              />
              <circle cx="80" cy="174" r="4" fill="#38bdf8" />
              <line x1="68" y1="110" x2="92" y2="125" stroke="#38bdf8" strokeWidth="1.2" opacity="0.6" />
              <line x1="72" y1="135" x2="88" y2="148" stroke="#38bdf8" strokeWidth="1.2" opacity="0.6" />
            </g>
          ) : isEngraving ? (
            // Engraving Bit (Flat tipped conical spear)
            <g>
              <polygon
                points="66,88 94,88 83,174 77,174"
                strokeWidth="2.5"
                stroke="#a855f7"
                fill="#6b21a8"
              />
              {/* Flat tip callout */}
              <line x1="77" y1="174" x2="83" y2="174" stroke="#e9d5ff" strokeWidth="3" />
            </g>
          ) : isBall ? (
            // Ball Nose curved bottom
            <g>
              <path
                d="M 64,88 L 64,152 Q 64,180 80,180 Q 96,180 96,152 L 96,88 Z"
                strokeWidth="2.5"
                stroke="#10b981"
                fill="#065f46"
              />
              {/* Flute spiral accents */}
              <line x1="66" y1="105" x2="94" y2="120" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
              <line x1="66" y1="130" x2="94" y2="145" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
            </g>
          ) : isBowlTray ? (
            // Round Bowl & Tray Bit
            <g>
              <path
                d="M 48,88 L 48,150 Q 48,175 68,175 L 92,175 Q 112,175 112,150 L 112,88 Z"
                strokeWidth="2.5"
                stroke="#14b8a6"
                fill="#0f766e"
              />
              <path d="M 50,150 Q 50,173 68,173" stroke="#5eead4" strokeWidth="2" fill="none" />
              <path d="M 110,150 Q 110,173 92,173" stroke="#5eead4" strokeWidth="2" fill="none" />
              <line x1="68" y1="175" x2="92" y2="175" stroke="#f0fdfa" strokeWidth="2.5" />
              <text x="80" y="165" textAnchor="middle" fill="#ccfbf1" fontSize="7" fontWeight="bold">
                BOWL FLAT
              </text>
            </g>
          ) : isRadiused ? (
            // Radiused Bull Nose (Cylindrical body with rounded bottom corners)
            <g>
              <path
                d="M 64,88 L 64,168 Q 64,178 72,178 L 88,178 Q 96,178 96,168 L 96,88 Z"
                strokeWidth="2.5"
                stroke="#ec4899"
                fill="#831843"
              />
              <line x1="66" y1="105" x2="94" y2="120" stroke="#f472b6" strokeWidth="1.5" opacity="0.7" />
            </g>
          ) : isSurfacing ? (
            // Wide Surfacing / Spoilboard flattening T-bar
            <g>
              <rect x="72" y="88" width="16" height="45" strokeWidth="2" stroke="#71717a" fill="#27272a" />
              <polygon
                points="24,133 136,133 136,168 24,168"
                strokeWidth="2.5"
                stroke="#f59e0b"
                fill="#78350f"
              />
              {/* Carbide insert cutters */}
              <rect x="26" y="145" width="12" height="20" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              <rect x="122" y="145" width="12" height="20" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            </g>
          ) : isDrill ? (
            // Pointed Twist Drill Bit
            <g>
              <polygon
                points="66,88 94,88 94,165 80,180 66,165"
                strokeWidth="2.5"
                stroke="#64748b"
                fill="#334155"
              />
              <line x1="66" y1="110" x2="94" y2="125" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="66" y1="135" x2="94" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          ) : (
            // Standard End Mill (Square bottom cylindrical spiral)
            <g>
              <rect
                x="64"
                y="88"
                width="32"
                height="90"
                rx="0.5"
                strokeWidth="2.5"
                stroke="#f59e0b"
                fill="#78350f"
              />
              {/* Flute spiral accents */}
              <line x1="66" y1="105" x2="94" y2="120" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
              <line x1="66" y1="130" x2="94" y2="145" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
              <line x1="66" y1="155" x2="94" y2="170" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
            </g>
          )}

          {/* Dimension Callout: Diameter Ø */}
          <line x1="48" y1="88" x2="48" y2="175" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
          <text x="80" y="196" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
            Ø {formData.diameter}{isMetric ? 'mm' : '"'}
          </text>

          {/* Tip Callout if applicable */}
          {tipSizeLabel && (isVBit || isConical || isEngraving || isRadiused || isBall || isBowlTray) && (
            <text x="80" y="206" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="sans-serif">
              {isBowlTray ? `Corner R: ${formData.tipSize ?? ''}${isMetric ? 'mm' : '"'}` : `Tip: ${tipSizeLabel}`}
            </text>
          )}
        </svg>

        <span className="text-[10px] font-mono text-zinc-400 capitalize mt-1">
          {formData.toolType} Profile ({isMetric ? 'Metric' : 'Imperial'})
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-100">{formData.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                isMetric
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {isMetric ? 'METRIC (mm)' : 'IMPERIAL (in)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
              <span>Group: {formData.group}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize text-zinc-300 font-medium">{formData.toolType}</span>
              <span aria-hidden="true">·</span>
              <span>Tool #{formData.toolNo}</span>
              {formData.materialGroup && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">{formData.materialGroup}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Visual Panel: 2D Tool SVG + 710W Makita/Katsu Dials + Chip Load */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
          <div className="flex flex-col items-center justify-center">
            {renderToolSvg()}
          </div>

          <div className="sm:col-span-2 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Gauge className="h-4 w-4" />
                  <span>710W Trim Router Dial Quick Selector</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {formData.spindleSpeed.toLocaleString()} RPM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2">
                Click a dial to snap spindle speed to standard Genmitsu / Makita RT0700 / Katsu 710W router dial markings:
              </p>
              <div className="grid grid-cols-6 gap-1.5">
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
                    className={`py-1.5 px-1 text-xs rounded border transition-colors flex flex-col items-center ${
                      formData.spindleSpeed === d.rpm
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400">Dial {d.dial}</span>
                    <span className="font-mono text-[11px]">{d.rpm / 1000}k</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Chip Load */}
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-zinc-400 block text-[11px]">Calculated Chip Load (Feed / [RPM × Flutes]):</span>
                <span className="font-mono text-zinc-100 font-bold text-sm">
                  {chipLoadMm.toFixed(3)} mm/tooth <span className="text-zinc-400 font-normal">({chipLoadInches.toFixed(4)}" / tooth)</span>
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-1 rounded inline-block self-start sm:self-auto ${
                  chipLoadInches >= 0.001 && chipLoadInches <= 0.006
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : chipLoadInches < 0.001
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {chipLoadInches < 0.001 ? 'Rubbing Risk (Increase Feed / Lower RPM)' : chipLoadInches > 0.006 ? 'Heavy Chip Load (Desktop Deflection Risk)' : 'Ideal 710W Cut Range'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Carveco Settings */}
        <div className="flex border-b border-zinc-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('geometry')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'geometry'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>1. Tool Geometry & Tip Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feeds')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'feeds'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>2. Cutting Parameters & Feeds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('material')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'material'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>3. Material Strategy & Notes</span>
          </button>
        </div>

        {/* Tab 1: Tool Geometry & Tip Settings */}
        {activeTab === 'geometry' && (
          <div className="space-y-4">
            {/* Tool Name, Group & Tool Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-zinc-300 mb-1">Carveco Tool Type</label>
                <select
                  value={formData.toolType}
                  onChange={e => handleChange('toolType', e.target.value as ToolType)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="endmill">End Mill (Flat Bottom Straight Spiral)</option>
                  <option value="ballnose">Round Ball Nose (Straight Shank 3D)</option>
                  <option value="conical">Tapered Ball Nose (3D Relief Carving)</option>
                  <option value="vbit">V-Bit (V-Carving & Lettering)</option>
                  <option value="bowl_tray">Round Bowl & Tray Bit (Dish & Box Bottoms)</option>
                  <option value="engraving">Engraving (Flat Tip Conical Chisel)</option>
                  <option value="radiused">Radiused / Bull Nose End Mill</option>
                  <option value="surfacing">Surfacing / Spoilboard Fly Cutter</option>
                  <option value="roundover">Roundover / Ogee Edge</option>
                  <option value="drill">Drill Bit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tool Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Library Folder / Group</label>
                <input
                  type="text"
                  value={formData.group}
                  onChange={e => handleChange('group', e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Geometry Grid: Diameter, Tip Size, Angle, Shank, Flute Length */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-amber-400">Physical Cutter Geometry</span>
                <span className="text-[11px] text-zinc-400">Settings exactly matching Carveco Tool Geometry inputs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Diameter */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Cutter Diameter (D) <span className="text-zinc-400 font-normal font-mono">[{isMetric ? 'mm' : 'in'}]</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.diameter}
                    onChange={e => handleChange('diameter', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Full diameter of cut
                  </span>
                </div>

                {/* TIP SIZE / TIP RADIUS - The user's specific requested feature! */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-200">
                      {formData.toolType === 'bowl_tray'
                        ? 'Corner Radius (r)'
                        : formData.toolType === 'engraving'
                        ? 'Tip Size / Flat Width (w)'
                        : formData.toolType === 'vbit'
                        ? 'Flat Tip Size (w)'
                        : formData.toolType === 'conical'
                        ? 'Tip Radius (r)'
                        : formData.toolType === 'radiused'
                        ? 'Corner Radius (r)'
                        : formData.toolType === 'ballnose'
                        ? 'Ball Radius (r)'
                        : 'Tip Size / Radius'}
                      <span className="text-zinc-400 font-normal font-mono ml-1">[{isMetric ? 'mm' : 'in'}]</span>
                    </label>
                  </div>

                  <input
                    type="number"
                    step="any"
                    disabled={formData.toolType === 'ballnose'}
                    value={
                      formData.toolType === 'ballnose'
                        ? Math.round((formData.diameter / 2) * 1000) / 1000
                        : formData.tipSize ?? ''
                    }
                    onChange={e => handleChange('tipSize', parseFloat(e.target.value) || 0)}
                    placeholder={formData.toolType === 'ballnose' ? 'D / 2' : 'e.g. 0.1mm / 0.5mm'}
                    className={`w-full rounded border px-3 py-1.5 text-xs font-mono focus:outline-none ${
                      formData.toolType === 'ballnose'
                        ? 'border-zinc-800 bg-zinc-800/50 text-zinc-400 cursor-not-allowed'
                        : 'border-zinc-700 bg-zinc-900 text-amber-300 focus:border-amber-500'
                    }`}
                  />
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
                    {formData.toolType === 'ballnose' ? (
                      <span>For ball nose, tip radius is locked to half diameter.</span>
                    ) : formData.toolType === 'bowl_tray' ? (
                      <span>Corner fillet radius. Flat center floor = {Math.max(0, formData.diameter - (formData.tipSize ? formData.tipSize * 2 : 0)).toFixed(2)}{isMetric ? 'mm' : '"'}.</span>
                    ) : formData.toolType === 'conical' ? (
                      <span>Apex ball radius (e.g. 0.25mm, 0.5mm).</span>
                    ) : formData.toolType === 'engraving' || formData.toolType === 'vbit' ? (
                      <span>Flat flat-spot at tip for lettering/isolation.</span>
                    ) : (
                      <span>Corner fillet radius for bull nose bits.</span>
                    )}
                  </div>
                  {/* Quick Tip Size Presets */}
                  {formData.toolType !== 'ballnose' && formData.toolType !== 'endmill' && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">Presets:</span>
                      {(isMetric
                        ? [0.1, 0.2, 0.25, 0.5, 1.0]
                        : [0.005, 0.01, 0.015, 0.031]
                      ).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleChange('tipSize', val)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 border border-zinc-700"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tool Included / Taper Angle */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    {formData.toolType === 'conical'
                      ? 'Half / Taper Angle (A) [°]'
                      : 'Included Angle (A) [°]'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={formData.toolType === 'endmill' || formData.toolType === 'ballnose' || formData.toolType === 'surfacing'}
                    value={formData.angle ?? ''}
                    onChange={e => handleChange('angle', parseFloat(e.target.value) || 0)}
                    placeholder={formData.toolType === 'vbit' ? '60°' : formData.toolType === 'conical' ? '3.82°' : 'N/A'}
                    className={`w-full rounded border px-3 py-1.5 text-xs font-mono focus:outline-none ${
                      formData.toolType === 'endmill' || formData.toolType === 'ballnose' || formData.toolType === 'surfacing'
                        ? 'border-zinc-800 bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                        : 'border-zinc-700 bg-zinc-900 text-amber-300 focus:border-amber-500'
                    }`}
                  />
                  {/* Quick Angle Presets */}
                  {(formData.toolType === 'vbit' || formData.toolType === 'engraving' || formData.toolType === 'conical') && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">Presets:</span>
                      {[15, 20, 30, 45, 60, 90, 3.82].map(deg => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => handleChange('angle', deg)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 border border-zinc-700"
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Second row: Shank Diameter & Flute Length */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Shank Collet Diameter <span className="text-zinc-500 font-normal">[{isMetric ? 'mm' : 'in'}]</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.shankDiameter ?? formData.diameter}
                    onChange={e => handleChange('shankDiameter', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500">Standard router collets:</span>
                    {[
                      { label: '1/8" (3.175mm)', val: isMetric ? 3.175 : 0.125 },
                      { label: '1/4" (6.35mm)', val: isMetric ? 6.35 : 0.25 },
                      { label: '4mm', val: isMetric ? 4.0 : 0.1575 },
                      { label: '6mm', val: isMetric ? 6.0 : 0.2362 },
                      { label: '1/2" (12.7mm)', val: isMetric ? 12.7 : 0.5 },
                    ].map(shk => (
                      <button
                        key={shk.label}
                        type="button"
                        onClick={() => handleChange('shankDiameter', shk.val)}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 border border-zinc-700"
                      >
                        {shk.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Flute / Cutting Edge Length (CEL) <span className="text-zinc-500 font-normal">[{isMetric ? 'mm' : 'in'}]</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.fluteLength ?? Math.round(formData.diameter * 3 * 100) / 100}
                    onChange={e => handleChange('fluteLength', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Maximum single-plunge cutting depth without shank rubbing.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cutting Parameters & Feeds */}
        {activeTab === 'feeds' && (
          <div className="space-y-4">
            {/* Stepdown and Stepover */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-amber-400">Stepdown & Stepover Passes (Pass Depths)</span>
                <span className="text-[11px] text-zinc-400">Synchronized distance and % diameter</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stepdown */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Stepdown / Pass Depth (d) <span className="text-zinc-400 font-mono">[{isMetric ? 'mm' : 'in'}]</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.stepdown}
                    onChange={e => handleChange('stepdown', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Z-depth per cutting layer.
                  </span>
                </div>

                {/* Stepover Distance */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Stepover Distance (s) <span className="text-zinc-400 font-mono">[{isMetric ? 'mm' : 'in'}]</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.stepover ?? Math.round(formData.diameter * 0.4 * 1000) / 1000}
                    onChange={e => handleChange('stepover', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Lateral distance between passes.
                  </span>
                </div>

                {/* Stepover Percentage */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">
                    Stepover % of Tool Diameter
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={formData.stepoverPercent ?? 40}
                      onChange={e => handleChange('stepoverPercent', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-400 font-mono">%</span>
                  </div>
                  {/* Stepover Quick Presets */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {[
                      { label: '8% (3D Relief)', val: 8 },
                      { label: '10% (3D Ball)', val: 10 },
                      { label: '40% (Carveco Standard)', val: 40 },
                      { label: '50% (Clearing)', val: 50 },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleChange('stepoverPercent', item.val)}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 border border-zinc-700"
                      >
                        {item.val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Speeds & Feeds Grid */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-amber-400">Speeds, Feeds & Units</span>
                <span className="text-[11px] text-zinc-400">Individual unit settings for Carveco CAM post-processors</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Spindle Speed */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">Spindle Speed (RPM)</label>
                  <input
                    type="number"
                    step="100"
                    value={formData.spindleSpeed}
                    onChange={e => handleChange('spindleSpeed', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    710W trim router operates 10,000 - 30,000 RPM.
                  </span>
                </div>

                {/* Feed Rate + Unit */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">Feed Rate (F)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={formData.feedRate}
                      onChange={e => handleChange('feedRate', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <select
                      value={formData.feedUnit}
                      onChange={e => handleChange('feedUnit', parseInt(e.target.value, 10))}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
                    >
                      <option value={2}>mm/min</option>
                      <option value={1}>mm/sec</option>
                      <option value={4}>in/min (IPM)</option>
                      <option value={3}>in/sec</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    XY cutting feed rate.
                  </span>
                </div>

                {/* Plunge Rate + Unit */}
                <div>
                  <label className="block text-xs font-medium text-zinc-200 mb-1">Plunge Rate (Z)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={formData.plungeRate}
                      onChange={e => handleChange('plungeRate', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <select
                      value={formData.plungeUnit}
                      onChange={e => handleChange('plungeUnit', parseInt(e.target.value, 10))}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
                    >
                      <option value={2}>mm/min</option>
                      <option value={1}>mm/sec</option>
                      <option value={4}>in/min (IPM)</option>
                      <option value={3}>in/sec</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Z vertical ramp/entry rate.
                  </span>
                </div>
              </div>

              {/* Flutes and Tool Number */}
              <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Flute Count</label>
                  <select
                    value={formData.fluteCount}
                    onChange={e => handleChange('fluteCount', parseInt(e.target.value, 10))}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value={1}>1 Flute (O-Flute for Acrylic & Aluminum)</option>
                    <option value={2}>2 Flutes (Standard CNC Wood bit)</option>
                    <option value={3}>3 Flutes (Aluminum Finishing)</option>
                    <option value={4}>4 Flutes (Surfacing / Steel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Tool Number (T#)</label>
                  <input
                    type="number"
                    value={formData.toolNo}
                    onChange={e => handleChange('toolNo', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Material Strategy & Notes */}
        {activeTab === 'material' && (
          <div className="space-y-4">
            {/* Material Strategy Selector */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-amber-400">Carveco Material Strategy</span>
                <span className="text-[11px] text-zinc-400">Designates which material cutting profile this tool applies to</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Material Profile</label>
                <select
                  value={formData.materialGroup ?? 'General / All Materials'}
                  onChange={e => handleChange('materialGroup', e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="General / All Materials">General / All Materials</option>
                  <option value="Hardwood (Oak, Walnut, Maple, Cherry)">Hardwood (Oak, Walnut, Maple, Cherry)</option>
                  <option value="Softwood (Pine, Cedar, Basswood)">Softwood (Pine, Cedar, Basswood)</option>
                  <option value="MDF & Plywood">MDF & Plywood</option>
                  <option value="Plastics & Acrylic (Plexiglas, Delrin)">Plastics & Acrylic (Plexiglas, Delrin)</option>
                  <option value="Aluminum (6061, 5052 - Non-ferrous)">Aluminum (6061, 5052 - Non-ferrous)</option>
                  <option value="Brass & Soft Metals">Brass & Soft Metals</option>
                  <option value="PCB & FR4 / Composites">PCB & FR4 / Composites</option>
                </select>
              </div>

              <div className="flex items-start gap-2 bg-zinc-950 p-3 rounded border border-zinc-800 text-[11px] text-zinc-400">
                <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  In Carveco, each tool can have distinct feeds, stepdowns, and speeds per material. Assigning the material profile keeps your library organized and prevents burning hardwood or melting acrylic.
                </span>
              </div>
            </div>

            {/* Notes & CAM Comments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Notes & Carveco Toolpath Comments
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500">Insert preset:</span>
                  {[
                    'Genmitsu 4040-PRO 710W Dial 3',
                    'Climb cut recommended',
                    'Ramping plunge required',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        handleChange(
                          'notes',
                          formData.notes ? `${formData.notes}\n${preset}` : preset
                        )
                      }
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 border border-zinc-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Add cutting tips, workpiece clamping notes, or Carveco post-processor remarks..."
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Bit Measurement Standard Switch */}
            <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">Bit Measurement Standard</span>
                <span className="text-[11px] text-zinc-500">Convert this bit's dimensions and feeds between Metric & Imperial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.unit !== 'mm') {
                      setFormData(prev => ({
                        ...prev,
                        unit: 'mm',
                        unitFlag: 1,
                        diameter: Math.round(prev.diameter * 25.4 * 100) / 100,
                        stepdown: Math.round(prev.stepdown * 25.4 * 100) / 100,
                        stepover: prev.stepover ? Math.round(prev.stepover * 25.4 * 100) / 100 : undefined,
                        tipSize: prev.tipSize ? Math.round(prev.tipSize * 25.4 * 100) / 100 : undefined,
                        shankDiameter: prev.shankDiameter ? Math.round(prev.shankDiameter * 25.4 * 100) / 100 : undefined,
                        fluteLength: prev.fluteLength ? Math.round(prev.fluteLength * 25.4 * 100) / 100 : undefined,
                        feedRate: Math.round(prev.feedRate * 25.4),
                        plungeRate: Math.round(prev.plungeRate * 25.4),
                        feedUnit: 2,
                        plungeUnit: 2,
                      }));
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    isMetric
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Metric (mm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.unit !== 'inch') {
                      setFormData(prev => ({
                        ...prev,
                        unit: 'inch',
                        unitFlag: 0,
                        diameter: Math.round((prev.diameter / 25.4) * 10000) / 10000,
                        stepdown: Math.round((prev.stepdown / 25.4) * 10000) / 10000,
                        stepover: prev.stepover ? Math.round((prev.stepover / 25.4) * 10000) / 10000 : undefined,
                        tipSize: prev.tipSize ? Math.round((prev.tipSize / 25.4) * 10000) / 10000 : undefined,
                        shankDiameter: prev.shankDiameter ? Math.round((prev.shankDiameter / 25.4) * 10000) / 10000 : undefined,
                        fluteLength: prev.fluteLength ? Math.round((prev.fluteLength / 25.4) * 10000) / 10000 : undefined,
                        feedRate: Math.round((prev.feedRate / 25.4) * 10) / 10,
                        plungeRate: Math.round((prev.plungeRate / 25.4) * 10) / 10,
                        feedUnit: 4,
                        plungeUnit: 3,
                      }));
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    !isMetric
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Imperial (inches)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...tool,
                diameter: tool.originalValues.diameter,
                param2: tool.originalValues.param2,
                stepdown: tool.originalValues.stepdown,
                spindleSpeed: tool.originalValues.spindleSpeed,
                feedRate: tool.originalValues.feedRate,
                plungeRate: tool.originalValues.plungeRate,
                stepover: tool.originalValues.stepover,
                stepoverPercent: tool.originalValues.stepoverPercent,
                tipSize: tool.originalValues.tipSize,
                angle: tool.originalValues.angle,
                fluteLength: tool.originalValues.fluteLength,
                shankDiameter: tool.originalValues.shankDiameter,
                name: tool.originalValues.name || tool.name,
                notes: tool.originalValues.notes || tool.notes,
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
