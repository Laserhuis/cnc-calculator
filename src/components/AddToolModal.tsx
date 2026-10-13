import React, { useState } from 'react';
import {
  X,
  Plus,
  Compass,
  Gauge,
  Layers,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { CarvecoTool, ToolType } from '../types/tool';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (newTool: CarvecoTool) => void;
  groups: string[];
  activeGroup: string;
  unitMode: 'metric' | 'imperial' | 'native';
}

interface BitTemplate {
  id: string;
  name: string;
  toolType: ToolType;
  description: string;
  diameterMetric: number;
  diameterImperial: number;
  tipSizeMetric?: number;
  tipSizeImperial?: number;
  angle?: number;
  shankMetric: number;
  shankImperial: number;
  fluteLengthMetric: number;
  fluteLengthImperial: number;
  stepoverPercent: number;
  stepdownMetric: number;
  stepdownImperial: number;
  rpm: number;
  feedMetric: number;
  feedImperial: number;
  plungeMetric: number;
  plungeImperial: number;
  flutes: number;
  materialGroup: string;
  notes: string;
}

export const BIT_TEMPLATES: BitTemplate[] = [
  {
    id: 'tapered-ballnose',
    name: 'Tapered Ball Nose R0.5mm (3.82°)',
    toolType: 'conical',
    description: 'Conical tapered bit with spherical tip for fine 3D relief carving and sculptures.',
    diameterMetric: 3.175,
    diameterImperial: 0.125,
    tipSizeMetric: 0.5,
    tipSizeImperial: 0.0197,
    angle: 3.82,
    shankMetric: 3.175,
    shankImperial: 0.125,
    fluteLengthMetric: 15.0,
    fluteLengthImperial: 0.6,
    stepoverPercent: 10,
    stepdownMetric: 1.5,
    stepdownImperial: 0.06,
    rpm: 18000,
    feedMetric: 1800,
    feedImperial: 70,
    plungeMetric: 450,
    plungeImperial: 18,
    flutes: 2,
    materialGroup: 'General / All Materials',
    notes: 'Ideal for 3D wood relief carving with 8-10% stepover to eliminate sanding.',
  },
  {
    id: 'round-ballnose',
    name: 'Round Ball Nose 1/8" (3.175mm)',
    toolType: 'ballnose',
    description: 'Straight cylindrical shaft with hemispherical ball end (r = D/2) for 3D contours.',
    diameterMetric: 3.175,
    diameterImperial: 0.125,
    tipSizeMetric: 1.5875,
    tipSizeImperial: 0.0625,
    shankMetric: 3.175,
    shankImperial: 0.125,
    fluteLengthMetric: 17.0,
    fluteLengthImperial: 0.67,
    stepoverPercent: 10,
    stepdownMetric: 2.0,
    stepdownImperial: 0.08,
    rpm: 18000,
    feedMetric: 2000,
    feedImperial: 80,
    plungeMetric: 500,
    plungeImperial: 20,
    flutes: 2,
    materialGroup: 'General / All Materials',
    notes: 'Standard 2-flute round ball nose for curved 3D surfaces and flute grooves.',
  },
  {
    id: 'vbit-60',
    name: '60° V-Bit Carving Tool (1/4" Shank)',
    toolType: 'vbit',
    description: 'V-carving & lettering bit with 60° included angle and sharp pointed apex.',
    diameterMetric: 12.7,
    diameterImperial: 0.5,
    tipSizeMetric: 0,
    tipSizeImperial: 0,
    angle: 60,
    shankMetric: 6.35,
    shankImperial: 0.25,
    fluteLengthMetric: 12.0,
    fluteLengthImperial: 0.47,
    stepoverPercent: 30,
    stepdownMetric: 3.0,
    stepdownImperial: 0.12,
    rpm: 17000,
    feedMetric: 1600,
    feedImperial: 65,
    plungeMetric: 400,
    plungeImperial: 16,
    flutes: 2,
    materialGroup: 'Hardwood (Oak, Walnut, Maple, Cherry)',
    notes: 'Standard 60 deg V-carve bit for decorative lettering, sign making, and chamfering.',
  },
  {
    id: 'bowl-tray',
    name: 'Round Bowl & Tray Bit 3/4" (R1/4")',
    toolType: 'bowl_tray',
    description: 'Specialty flat-bottom dish cutter with rounded bottom corners for bowls, trays, and boxes.',
    diameterMetric: 19.05,
    diameterImperial: 0.75,
    tipSizeMetric: 6.35, // Corner radius
    tipSizeImperial: 0.25,
    shankMetric: 6.35,
    shankImperial: 0.25,
    fluteLengthMetric: 15.875,
    fluteLengthImperial: 0.625,
    stepoverPercent: 60,
    stepdownMetric: 2.5,
    stepdownImperial: 0.1,
    rpm: 16000,
    feedMetric: 1500,
    feedImperial: 60,
    plungeMetric: 350,
    plungeImperial: 14,
    flutes: 2,
    materialGroup: 'Hardwood (Oak, Walnut, Maple, Cherry)',
    notes: 'Bowl & Tray cutter: Smoothly rounds bottom corners with 1/4" radius while flattening center floor.',
  },
  {
    id: 'engraving-flat',
    name: 'Flat Bottom Engraving Bit 30° (0.1mm Tip)',
    toolType: 'engraving',
    description: 'Conical cutter with micro flat chisel tip (0.1mm) for ultra-fine lettering and PCB isolation.',
    diameterMetric: 3.175,
    diameterImperial: 0.125,
    tipSizeMetric: 0.1,
    tipSizeImperial: 0.004,
    angle: 30,
    shankMetric: 3.175,
    shankImperial: 0.125,
    fluteLengthMetric: 12.0,
    fluteLengthImperial: 0.47,
    stepoverPercent: 25,
    stepdownMetric: 0.5,
    stepdownImperial: 0.02,
    rpm: 20000,
    feedMetric: 1000,
    feedImperial: 40,
    plungeMetric: 250,
    plungeImperial: 10,
    flutes: 1,
    materialGroup: 'PCB & FR4 / Composites',
    notes: 'Micro flat-bottom tip for sharp, legible text and delicate pocket isolation.',
  },
  {
    id: 'endmill-upcut',
    name: 'Spiral Upcut End Mill 1/8" (3.175mm)',
    toolType: 'endmill',
    description: 'Flat bottom square cylindrical end mill for high-efficiency chip evacuation and pocketing.',
    diameterMetric: 3.175,
    diameterImperial: 0.125,
    shankMetric: 3.175,
    shankImperial: 0.125,
    fluteLengthMetric: 17.0,
    fluteLengthImperial: 0.67,
    stepoverPercent: 40,
    stepdownMetric: 3.175,
    stepdownImperial: 0.125,
    rpm: 18000,
    feedMetric: 2200,
    feedImperial: 85,
    plungeMetric: 600,
    plungeImperial: 24,
    flutes: 2,
    materialGroup: 'General / All Materials',
    notes: 'Standard 2-flute upcut end mill for deep slotting and pocket clearing in wood & plastics.',
  },
  {
    id: 'bullnose-radiused',
    name: 'Bull Nose / Radiused End Mill 1/4" (R1.5mm)',
    toolType: 'radiused',
    description: 'Flat end mill with corner radius fillets to eliminate corner chipping and strengthen pocket bases.',
    diameterMetric: 6.35,
    diameterImperial: 0.25,
    tipSizeMetric: 1.5, // Corner fillet radius
    tipSizeImperial: 0.06,
    shankMetric: 6.35,
    shankImperial: 0.25,
    fluteLengthMetric: 19.0,
    fluteLengthImperial: 0.75,
    stepoverPercent: 40,
    stepdownMetric: 3.0,
    stepdownImperial: 0.12,
    rpm: 17000,
    feedMetric: 2000,
    feedImperial: 80,
    plungeMetric: 500,
    plungeImperial: 20,
    flutes: 2,
    materialGroup: 'Aluminum (6061, 5052 - Non-ferrous)',
    notes: 'Corner radius distributes cutting stress and extends bit life when milling pockets.',
  },
  {
    id: 'surfacing-flycutter',
    name: 'Spoilboard Surfacing Fly Cutter 1" (25.4mm)',
    toolType: 'surfacing',
    description: 'Wide flattening cutter with 3 carbide inserts for slab leveling and spoilboard surfacing.',
    diameterMetric: 25.4,
    diameterImperial: 1.0,
    shankMetric: 6.35,
    shankImperial: 0.25,
    fluteLengthMetric: 6.35,
    fluteLengthImperial: 0.25,
    stepoverPercent: 70,
    stepdownMetric: 0.8,
    stepdownImperial: 0.03,
    rpm: 16000,
    feedMetric: 2500,
    feedImperial: 100,
    plungeMetric: 400,
    plungeImperial: 16,
    flutes: 3,
    materialGroup: 'MDF & Plywood',
    notes: '3-wing spoilboard cutter: Run at 70% stepover and light pass depths for mirror finish.',
  },
];

export const AddToolModal: React.FC<AddToolModalProps> = ({
  isOpen,
  onClose,
  onAddTool,
  groups,
  activeGroup,
  unitMode,
}) => {
  if (!isOpen) return null;

  const isMetricDefault = unitMode !== 'imperial';

  // Selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tapered-ballnose');
  const [unit, setUnit] = useState<'mm' | 'inch'>(isMetricDefault ? 'mm' : 'inch');

  // Selected template
  const currentTemplate = BIT_TEMPLATES.find(t => t.id === selectedTemplateId) || BIT_TEMPLATES[0];

  // Editable Form State pre-populated from selected template
  const [name, setName] = useState(currentTemplate.name);
  const [group, setGroup] = useState(activeGroup !== 'all' ? activeGroup : 'Genmitsu & Custom Bits');
  const [toolType, setToolType] = useState<ToolType>(currentTemplate.toolType);
  const [diameter, setDiameter] = useState<number>(
    unit === 'mm' ? currentTemplate.diameterMetric : currentTemplate.diameterImperial
  );
  const [tipSize, setTipSize] = useState<number | undefined>(
    unit === 'mm' ? currentTemplate.tipSizeMetric : currentTemplate.tipSizeImperial
  );
  const [angle, setAngle] = useState<number | undefined>(currentTemplate.angle);
  const [shankDiameter, setShankDiameter] = useState<number>(
    unit === 'mm' ? currentTemplate.shankMetric : currentTemplate.shankImperial
  );
  const [fluteLength, setFluteLength] = useState<number>(
    unit === 'mm' ? currentTemplate.fluteLengthMetric : currentTemplate.fluteLengthImperial
  );
  const [stepoverPercent, setStepoverPercent] = useState<number>(currentTemplate.stepoverPercent);
  const [stepdown, setStepdown] = useState<number>(
    unit === 'mm' ? currentTemplate.stepdownMetric : currentTemplate.stepdownImperial
  );
  const [spindleSpeed, setSpindleSpeed] = useState<number>(currentTemplate.rpm);
  const [feedRate, setFeedRate] = useState<number>(
    unit === 'mm' ? currentTemplate.feedMetric : currentTemplate.feedImperial
  );
  const [plungeRate, setPlungeRate] = useState<number>(
    unit === 'mm' ? currentTemplate.plungeMetric : currentTemplate.plungeImperial
  );
  const [fluteCount, setFluteCount] = useState<number>(currentTemplate.flutes);
  const [materialGroup, setMaterialGroup] = useState<string>(currentTemplate.materialGroup);
  const [notes, setNotes] = useState<string>(currentTemplate.notes);

  // When template card is clicked, populate all fields
  const applyTemplate = (tmpl: BitTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setName(tmpl.name);
    setToolType(tmpl.toolType);
    setDiameter(unit === 'mm' ? tmpl.diameterMetric : tmpl.diameterImperial);
    setTipSize(unit === 'mm' ? tmpl.tipSizeMetric : tmpl.tipSizeImperial);
    setAngle(tmpl.angle);
    setShankDiameter(unit === 'mm' ? tmpl.shankMetric : tmpl.shankImperial);
    setFluteLength(unit === 'mm' ? tmpl.fluteLengthMetric : tmpl.fluteLengthImperial);
    setStepoverPercent(tmpl.stepoverPercent);
    setStepdown(unit === 'mm' ? tmpl.stepdownMetric : tmpl.stepdownImperial);
    setSpindleSpeed(tmpl.rpm);
    setFeedRate(unit === 'mm' ? tmpl.feedMetric : tmpl.feedImperial);
    setPlungeRate(unit === 'mm' ? tmpl.plungeMetric : tmpl.plungeImperial);
    setFluteCount(tmpl.flutes);
    setMaterialGroup(tmpl.materialGroup);
    setNotes(tmpl.notes);
  };

  // Convert unit
  const handleToggleUnit = (newUnit: 'mm' | 'inch') => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    if (newUnit === 'mm') {
      setDiameter(Math.round(diameter * 25.4 * 100) / 100);
      if (tipSize) setTipSize(Math.round(tipSize * 25.4 * 100) / 100);
      setShankDiameter(Math.round(shankDiameter * 25.4 * 100) / 100);
      setFluteLength(Math.round(fluteLength * 25.4 * 100) / 100);
      setStepdown(Math.round(stepdown * 25.4 * 100) / 100);
      setFeedRate(Math.round(feedRate * 25.4));
      setPlungeRate(Math.round(plungeRate * 25.4));
    } else {
      setDiameter(Math.round((diameter / 25.4) * 10000) / 10000);
      if (tipSize) setTipSize(Math.round((tipSize / 25.4) * 10000) / 10000);
      setShankDiameter(Math.round((shankDiameter / 25.4) * 10000) / 10000);
      setFluteLength(Math.round((fluteLength / 25.4) * 10000) / 10000);
      setStepdown(Math.round((stepdown / 25.4) * 10000) / 10000);
      setFeedRate(Math.round((feedRate / 25.4) * 10) / 10);
      setPlungeRate(Math.round((plungeRate / 25.4) * 10) / 10);
    }
  };

  // Derived Stepover Distance
  const calculatedStepoverDist = Math.round((diameter * (stepoverPercent / 100)) * 10000) / 10000;

  // Render SVG profile
  const renderSvg = () => {
    const isVBit = toolType === 'vbit';
    const isBall = toolType === 'ballnose';
    const isConical = toolType === 'conical';
    const isBowlTray = toolType === 'bowl_tray';
    const isEngraving = toolType === 'engraving';
    const isRadiused = toolType === 'radiused';
    const isSurfacing = toolType === 'surfacing';
    const isDrill = toolType === 'drill';

    return (
      <svg viewBox="0 0 160 210" className="w-36 h-48 mx-auto select-none">
        {/* Background grid markings */}
        <line x1="80" y1="10" x2="80" y2="195" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

        {/* Shank */}
        <rect x="56" y="15" width="48" height="60" rx="2" strokeWidth="2" fill="#27272a" stroke="#71717a" />
        <line x1="56" y1="42" x2="104" y2="42" stroke="#52525b" strokeWidth="1" strokeDasharray="2 2" />
        <text x="80" y="32" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontFamily="sans-serif">
          SHANK {shankDiameter}{unit === 'mm' ? 'mm' : '"'}
        </text>

        {/* Neck transition */}
        <polygon points="56,75 104,75 96,88 64,88" fill="#3f3f46" stroke="#71717a" strokeWidth="1.5" />

        {/* Cutter geometry */}
        {isBowlTray ? (
          // Bowl & Tray Bit
          <g>
            <path
              d="M 48,88 L 48,150 Q 48,175 68,175 L 92,175 Q 112,175 112,150 L 112,88 Z"
              strokeWidth="2.5"
              stroke="#14b8a6"
              fill="#0f766e"
            />
            {/* Corner fillet curve accents */}
            <path d="M 50,150 Q 50,173 68,173" stroke="#5eead4" strokeWidth="2" fill="none" />
            <path d="M 110,150 Q 110,173 92,173" stroke="#5eead4" strokeWidth="2" fill="none" />
            <line x1="68" y1="175" x2="92" y2="175" stroke="#f0fdfa" strokeWidth="2.5" />
            <text x="80" y="165" textAnchor="middle" fill="#ccfbf1" fontSize="7" fontWeight="bold">
              BOWL FLAT
            </text>
          </g>
        ) : isConical ? (
          // Tapered Ball Nose
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
        ) : isBall ? (
          // Round Ball Nose
          <g>
            <path
              d="M 64,88 L 64,152 Q 64,180 80,180 Q 96,180 96,152 L 96,88 Z"
              strokeWidth="2.5"
              stroke="#10b981"
              fill="#065f46"
            />
            <line x1="66" y1="105" x2="94" y2="120" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
            <line x1="66" y1="130" x2="94" y2="145" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
          </g>
        ) : isVBit ? (
          // V-Bit
          <g>
            {tipSize && tipSize > 0 ? (
              <polygon
                points="62,88 98,88 84,175 76,175"
                strokeWidth="2.5"
                stroke="#f59e0b"
                fill="#78350f"
              />
            ) : (
              <polygon
                points="62,88 98,88 80,180"
                strokeWidth="2.5"
                stroke="#f59e0b"
                fill="#78350f"
              />
            )}
            <path d="M 72,110 Q 80,118 88,110" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            {angle && (
              <text x="80" y="125" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                {angle}°
              </text>
            )}
          </g>
        ) : isEngraving ? (
          // Engraving
          <g>
            <polygon
              points="66,88 94,88 83,174 77,174"
              strokeWidth="2.5"
              stroke="#a855f7"
              fill="#6b21a8"
            />
            <line x1="77" y1="174" x2="83" y2="174" stroke="#e9d5ff" strokeWidth="3" />
          </g>
        ) : isSurfacing ? (
          // Surfacing
          <g>
            <rect x="72" y="88" width="16" height="45" strokeWidth="2" stroke="#71717a" fill="#27272a" />
            <polygon
              points="24,133 136,133 136,168 24,168"
              strokeWidth="2.5"
              stroke="#f59e0b"
              fill="#78350f"
            />
            <rect x="26" y="145" width="12" height="20" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <rect x="122" y="145" width="12" height="20" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          </g>
        ) : isRadiused ? (
          // Radiused
          <g>
            <path
              d="M 64,88 L 64,168 Q 64,178 72,178 L 88,178 Q 96,178 96,168 L 96,88 Z"
              strokeWidth="2.5"
              stroke="#ec4899"
              fill="#831843"
            />
          </g>
        ) : isDrill ? (
          // Drill
          <polygon
            points="66,88 94,88 94,165 80,180 66,165"
            strokeWidth="2.5"
            stroke="#64748b"
            fill="#334155"
          />
        ) : (
          // End Mill
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
            <line x1="66" y1="105" x2="94" y2="120" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
            <line x1="66" y1="130" x2="94" y2="145" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
            <line x1="66" y1="155" x2="94" y2="170" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
          </g>
        )}

        {/* Dimension labels */}
        <text x="80" y="196" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
          Ø {diameter}{unit === 'mm' ? 'mm' : '"'}
        </text>
        {tipSize !== undefined && (
          <text x="80" y="206" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="sans-serif">
            {isBowlTray ? `Corner R: ${tipSize}${unit === 'mm' ? 'mm' : '"'}` : `Tip: ${tipSize}${unit === 'mm' ? 'mm' : '"'}`}
          </text>
        )}
      </svg>
    );
  };

  // Submit
  const handleCreate = () => {
    const isMetric = unit === 'mm';
    const newTool: CarvecoTool = {
      id: `tool-${Date.now()}`,
      name: name.trim() || 'Custom Carveco Bit',
      group: group.trim() || 'Custom Bits',
      notes: notes.trim(),
      toolNo: 1, // Will be incremented or matched in App.tsx
      unitFlag: isMetric ? 1 : 0,
      unit: isMetric ? 'mm' : 'inch',
      diameter,
      param2: tipSize ?? angle ?? calculatedStepoverDist,
      tipSize,
      angle,
      stepover: calculatedStepoverDist,
      stepoverPercent,
      shankDiameter,
      fluteLength,
      materialGroup,
      stepdown,
      spindleSpeed,
      feedRate,
      plungeRate,
      feedUnit: isMetric ? 2 : 4,
      plungeUnit: isMetric ? 2 : 3,
      toolType,
      fluteCount,
      originalValues: {
        diameter,
        param2: tipSize ?? angle ?? calculatedStepoverDist,
        stepover: calculatedStepoverDist,
        stepoverPercent,
        tipSize,
        angle,
        shankDiameter,
        fluteLength,
        stepdown,
        spindleSpeed,
        feedRate,
        plungeRate,
        name: name.trim(),
        notes: notes.trim(),
      },
    };

    onAddTool(newTool);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-500" />
                Add New Carveco CNC Bit
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                Geometry Wizard
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select any bit form (Round Bowl bit, Tapered Ball Nose, Round Ball Nose, V-Bit, Engraving, End Mill) to pre-load calibrated Carveco geometry and 710W router feeds.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Measurement Unit Toggle */}
        <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
          <div>
            <span className="text-xs font-semibold text-zinc-200">Measurement System for this Bit</span>
            <span className="text-[11px] text-zinc-400 block">Switching recalculates all dimensions and feed rates</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleUnit('mm')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                unit === 'mm'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Metric (mm & mm/min)
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnit('inch')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                unit === 'inch'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Imperial (inches & IPM)
            </button>
          </div>
        </div>

        {/* Step 1: Bit Geometry Form Selector Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              1. Choose Bit Geometry Form (Template)
            </label>
            <span className="text-[11px] text-zinc-500">Click a card to auto-configure bit shape and parameters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BIT_TEMPLATES.map(tmpl => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-100 capitalize">
                        {tmpl.toolType === 'bowl_tray'
                          ? 'Bowl & Tray'
                          : tmpl.toolType === 'conical'
                          ? 'Tapered Ball'
                          : tmpl.toolType === 'ballnose'
                          ? 'Round Ball'
                          : tmpl.toolType}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">
                      {tmpl.description}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>
                      Ø {unit === 'mm' ? `${tmpl.diameterMetric}mm` : `${tmpl.diameterImperial}"`}
                    </span>
                    <span>{tmpl.rpm / 1000}k RPM</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Live Cutter Preview + Customizable Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
          {/* Visual SVG Diagram */}
          <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-800 pb-4 sm:pb-0 sm:pr-4">
            {renderSvg()}
            <span className="text-[11px] text-zinc-400 font-medium mt-2 capitalize text-center">
              {toolType === 'bowl_tray' ? 'Round Bowl & Tray Bit' : toolType}
            </span>
          </div>

          {/* Form Fields */}
          <div className="sm:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tool Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Library Group / Folder</label>
                <input
                  type="text"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  placeholder="e.g. Whiteside Bits, Genmitsu 3018, Bowl Cutters"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Geometry specific to tool type */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              {/* Diameter */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Diameter (D) [{unit}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={diameter}
                  onChange={e => setDiameter(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Tip Size / Corner Radius depending on type */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  {toolType === 'bowl_tray'
                    ? `Corner Radius (r) [${unit}]`
                    : toolType === 'conical'
                    ? `Tip Radius (r) [${unit}]`
                    : toolType === 'ballnose'
                    ? `Ball Radius (D/2) [${unit}]`
                    : toolType === 'vbit' || toolType === 'engraving'
                    ? `Flat Tip Width (w) [${unit}]`
                    : toolType === 'radiused'
                    ? `Corner Fillet [${unit}]`
                    : `Tip Size [${unit}]`}
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={toolType === 'ballnose'}
                  value={
                    toolType === 'ballnose'
                      ? Math.round((diameter / 2) * 1000) / 1000
                      : tipSize ?? ''
                  }
                  onChange={e => setTipSize(parseFloat(e.target.value) || 0)}
                  placeholder={toolType === 'ballnose' ? 'D/2' : '0'}
                  className={`w-full rounded border px-2.5 py-1 text-xs font-mono focus:outline-none ${
                    toolType === 'ballnose'
                      ? 'border-zinc-800 bg-zinc-800/50 text-zinc-400 cursor-not-allowed'
                      : 'border-zinc-700 bg-zinc-900 text-amber-300 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Angle */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  {toolType === 'conical' ? 'Half-Angle [°]' : 'Included Angle [°]'}
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={toolType !== 'vbit' && toolType !== 'engraving' && toolType !== 'conical'}
                  value={angle ?? ''}
                  onChange={e => setAngle(parseFloat(e.target.value) || 0)}
                  placeholder={toolType === 'vbit' ? '60°' : toolType === 'conical' ? '3.82°' : 'N/A'}
                  className={`w-full rounded border px-2.5 py-1 text-xs font-mono focus:outline-none ${
                    toolType !== 'vbit' && toolType !== 'engraving' && toolType !== 'conical'
                      ? 'border-zinc-800 bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                      : 'border-zinc-700 bg-zinc-900 text-amber-300 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Shank */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Shank Collet [{unit}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={shankDiameter}
                  onChange={e => setShankDiameter(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Flute Length */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Flute Length (CEL) [{unit}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={fluteLength}
                  onChange={e => setFluteLength(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Stepover % */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Stepover % of Tool
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={stepoverPercent}
                    onChange={e => setStepoverPercent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400 font-mono">%</span>
                </div>
              </div>
            </div>

            {/* Speeds & Feeds */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Spindle (RPM)</label>
                <input
                  type="number"
                  step="500"
                  value={spindleSpeed}
                  onChange={e => setSpindleSpeed(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Stepdown [{unit}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={stepdown}
                  onChange={e => setStepdown(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Feed Rate [{unit === 'mm' ? 'mm/min' : 'IPM'}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={feedRate}
                  onChange={e => setFeedRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Plunge Rate [{unit === 'mm' ? 'mm/min' : 'IPM'}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={plungeRate}
                  onChange={e => setPlungeRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Material & Flutes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Material Strategy</label>
                <select
                  value={materialGroup}
                  onChange={e => setMaterialGroup(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="General / All Materials">General / All Materials</option>
                  <option value="Hardwood (Oak, Walnut, Maple, Cherry)">Hardwood (Oak, Walnut, Maple, Cherry)</option>
                  <option value="Softwood (Pine, Cedar, Basswood)">Softwood (Pine, Cedar, Basswood)</option>
                  <option value="MDF & Plywood">MDF & Plywood</option>
                  <option value="Plastics & Acrylic (Plexiglas, Delrin)">Plastics & Acrylic (Plexiglas, Delrin)</option>
                  <option value="Aluminum (6061, 5052 - Non-ferrous)">Aluminum (6061, 5052 - Non-ferrous)</option>
                  <option value="PCB & FR4 / Composites">PCB & FR4 / Composites</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Flutes</label>
                <select
                  value={fluteCount}
                  onChange={e => setFluteCount(parseInt(e.target.value, 10))}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value={1}>1 Flute (O-Flute / Single Wing)</option>
                  <option value={2}>2 Flutes (Standard Router Bit)</option>
                  <option value={3}>3 Flutes (Finishing / Spoilboard)</option>
                  <option value={4}>4 Flutes (Surfacing)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div className="text-xs text-zinc-500">
            Bit will be saved to <strong className="text-zinc-300 font-mono">[{group}]</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded bg-amber-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Bit & Add to Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
