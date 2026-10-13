import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Search,
  Zap,
  Gauge,
  Calculator,
  RefreshCw,
  Layers,
  SlidersHorizontal,
  Wrench,
  Keyboard,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Package,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Globe,
  Terminal,
  Compass,
} from 'lucide-react';

export type HelpTabId =
  | 'quickstart'
  | 'genmitsu_guide'
  | 'website_embed'
  | 'spindle_physics'
  | 'calculator'
  | 'unit_discrepancy'
  | 'cam_software'
  | 'brand_libraries'
  | 'bulk_math'
  | 'troubleshooting'
  | 'shortcuts';

interface HelpAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: HelpTabId;
}

export const HelpAssistanceModal: React.FC<HelpAssistanceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'quickstart',
}) => {
  const [activeTab, setActiveTab] = useState<HelpTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Live Chip Load Calculator State
  const [calcDiameter, setCalcDiameter] = useState<number>(3.175); // mm (1/8")
  const [calcFlutes, setCalcFlutes] = useState<number>(2);
  const [calcRpm, setCalcRpm] = useState<number>(18000);
  const [calcFeed, setCalcFeed] = useState<number>(1800); // mm/min
  const [calcMaterial, setCalcMaterial] = useState<'softwood' | 'hardwood' | 'acrylic' | 'aluminum'>('hardwood');

  // Sync initial tab when reopened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Chip Load Calculation: fz = Feed (mm/min) / (RPM * Flutes)
  const chipLoadMm = useMemo(() => {
    if (calcRpm <= 0 || calcFlutes <= 0) return 0;
    return calcFeed / (calcRpm * calcFlutes);
  }, [calcFeed, calcRpm, calcFlutes]);

  const chipLoadInch = useMemo(() => chipLoadMm / 25.4, [chipLoadMm]);

  // Chip Load Health Assessment
  const chipLoadStatus = useMemo(() => {
    // Typical guidelines based on diameter
    const isSmallBit = calcDiameter <= 3.5;
    const targetMinInch = isSmallBit ? 0.001 : 0.003;
    const targetMaxInch = isSmallBit ? 0.0035 : 0.007;

    if (chipLoadInch < targetMinInch * 0.7) {
      return {
        label: 'Too Low (Rubbing & Heat Hazard)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        detail: 'The bit is rubbing instead of cutting clean chips. Tool will overheat, dull prematurely, and burn material. Increase feed rate or reduce RPM.',
      };
    } else if (chipLoadInch > targetMaxInch * 1.3) {
      return {
        label: 'High (Deflection / Breakage Risk)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        detail: 'High cutting resistance. Risk of bit snap or spindle stall on lightweight desktop CNCs. Reduce feed rate or increase RPM.',
      };
    } else {
      return {
        label: 'Optimal Sweet Spot',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        detail: 'Produces crisp chips that pull heat away from the cutter. Excellent tool longevity and surface finish.',
      };
    }
  }, [chipLoadInch, calcDiameter]);

  const navigationItems = [
    { id: 'quickstart', label: 'Quick Start & Workflow', icon: Zap, category: 'Fundamentals' },
    { id: 'genmitsu_guide', label: 'Genmitsu CNC & SainSmart Hub', icon: Cpu, category: 'Sponsor & Machines' },
    { id: 'website_embed', label: 'Website & Vercel Integration', icon: Globe, category: 'Integration & Deployment' },
    { id: 'spindle_physics', label: '710W & Spindle Physics', icon: Gauge, category: 'Fundamentals' },
    { id: 'calculator', label: 'Live Chip Load Calculator', icon: Calculator, category: 'Tools' },
    { id: 'unit_discrepancy', label: 'Units & The 25.4 Fix', icon: RefreshCw, category: 'Troubleshooting' },
    { id: 'cam_software', label: 'CAM Software Export / Import', icon: Layers, category: 'Integrations' },
    { id: 'brand_libraries', label: 'Bit Brand Catalogs', icon: Package, category: 'Libraries' },
    { id: 'bulk_math', label: 'Bulk Math & Calibration', icon: SlidersHorizontal, category: 'Tools' },
    { id: 'troubleshooting', label: 'CNC Problem Solver', icon: Wrench, category: 'Troubleshooting' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts & Tips', icon: Keyboard, category: 'Reference' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Carveco Bit Studio Help & Assistance Center"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] max-h-[850px] rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-zinc-100">
                  Carveco Bit Studio Help & Assistance Center
                </h2>
                <span className="text-[11px] font-mono text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.5">
                  v3.4 Multi-CAM
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Complete operational guide, spindle wattage physics, software compatibility, and cutting diagnostic tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              ESC to close
            </kbd>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              title="Close Guide"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Quick Chips Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-850 bg-zinc-900/30 px-6 py-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., '710W', 'Easel', '25.4 bug', 'chatter', 'RPM dial')..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-zinc-500 font-medium">Quick Jumps:</span>
            <button
              onClick={() => setActiveTab('spindle_physics')}
              className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-amber-300 font-mono transition-colors"
            >
              710W Wattage Physics
            </button>
            <button
              onClick={() => setActiveTab('unit_discrepancy')}
              className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              ÷25.4 Discrepancy Fix
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-emerald-300 transition-colors"
            >
              Live Calculator
            </button>
            <button
              onClick={() => setActiveTab('cam_software')}
              className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-sky-300 transition-colors"
            >
              Easel / Fusion / Vectric
            </button>
          </div>
        </div>

        {/* Main Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/70 p-3 overflow-y-auto space-y-1 shrink-0">
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Topics & Guides
            </div>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as HelpTabId)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-amber-400" />}
                </button>
              );
            })}

            {/* Pro Tip Card */}
            <div className="mt-6 rounded-xl border border-zinc-850 bg-zinc-900/50 p-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 text-[11px]">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Shop Floor Rule #1</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Always ensure your chip load stays between <span className="font-mono text-zinc-200">0.001"–0.003"</span> (0.025–0.075mm) for 1/8" bits to avoid bit overheating and wood burning.
              </p>
            </div>
          </aside>

          {/* Content Pane */}
          <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-zinc-950 space-y-8">
            
            {/* 1. QUICK START */}
            {activeTab === 'quickstart' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-400" />
                    Complete Workflow: From Raw Database to Perfect Cuts
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Carveco Bit Studio provides end-to-end tooling management for desktop and professional CNC routers. Follow these 4 standard steps:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-amber-400">STEP 01</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Import / Load</span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200">Load Your Tools or Brand Catalog</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Upload your Carveco binary file (<span className="font-mono text-zinc-300">.tdb / .tbd</span>), Easel JSON, Fusion 360 library, or click <strong className="text-zinc-200">Bit Brands</strong> in the header to load genuine 160-bit Whiteside, Genmitsu 3018, Amana Spektra, or Freud catalogs.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-amber-400">STEP 02</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">Power Tuning</span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200">Calibrate for Your Spindle (710W Makita, etc.)</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      If your bits have conservative Genmitsu stock feeds (calculated for tiny 60W 775 motors), open the <strong className="text-amber-400">Spindle Tuner Bar</strong>. Select your spindle (e.g. Makita RT0700 710W) and click <strong className="text-amber-400">Apply Spindle Tuning</strong> to scale speeds, feeds, and stepdown safely.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-amber-400">STEP 03</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Precision Edit</span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200">Inspect & Refine Feeds & Units</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Toggle between Metric (mm) and Imperial (in) in the top bar. Edit any cell inline with immediate feedback. Use <strong className="text-zinc-200">Bulk Math</strong> to apply multiplier factors, clamp RPMs to your router dial ranges, or find & replace bit labels.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-amber-400">STEP 04</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Export</span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200">Export Directly to Your CAM Software</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Click <strong className="text-amber-400">Export & Save</strong> to download pristine binary <span className="font-mono text-zinc-300">.tdb / .tbd</span> files for Carveco/ArtCAM, custom bit JSON for Inventables Easel, CSV for Vectric Aspire/VCarve, or .tools for Fusion 360.
                    </p>
                  </div>
                </div>

                {/* Important Highlights */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Key Features At A Glance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                        Lossless Binary Preservation
                      </div>
                      <p className="text-zinc-500">
                        Preserves native Carveco/ArtCAM IEEE 754 float offsets and tool IDs without corrupted file structures.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                        Instant Undo & Redo (Ctrl+Z)
                      </div>
                      <p className="text-zinc-500">
                        Full 30-step state history so you can test aggressive power scalings and revert safely with 1 click.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                        Printable Bit Cheatsheet
                      </div>
                      <p className="text-zinc-500">
                        Generate clean, printer-ready shop floor charts of your tool diameters, RPM dials, and feed speeds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GENMITSU CNC & SAINSMART ECOSYSTEM HUB */}
            {activeTab === 'genmitsu_guide' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-emerald-300 flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-emerald-400" />
                      Genmitsu & SainSmart CNC Ecosystem Hub
                    </h3>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-mono font-semibold">
                      Official Partner Sponsor
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1">
                    Complete tuning, safety parameters, and tool libraries specifically calibrated for Genmitsu CNC desktop and production machines.
                  </p>
                </div>

                {/* Genmitsu Machine Matrix */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    Genmitsu Machine Specifications & Safe Axis Limits
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* 3018 Series */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">Genmitsu 3018-PRO & PROVer</span>
                        <span className="font-mono text-emerald-400 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          Stock 775 Motor
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Work Area: <strong className="text-zinc-200">300 × 180 × 45 mm</strong>. Stock 775 DC motor runs at 10,000 RPM with ~60–100W electrical input.
                      </p>
                      <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1 text-[11px]">
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Safe Feed:</span>
                          <span className="font-mono text-amber-400">1,000 mm/min (39 IPM)</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (Wood):</span>
                          <span className="font-mono text-amber-400">0.5 – 0.8 mm</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (PCB/Acrylic):</span>
                          <span className="font-mono text-amber-400">0.2 – 0.4 mm</span>
                        </div>
                      </div>
                    </div>

                    {/* 3020-PRO MAX */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">Genmitsu 3020-PRO MAX</span>
                        <span className="font-mono text-emerald-400 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          300W / 500W Spindle
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Work Area: <strong className="text-zinc-200">300 × 200 × 73 mm</strong>. Heavy-duty all-aluminum frame and ER11 quiet air-cooled spindle.
                      </p>
                      <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1 text-[11px]">
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Safe Feed:</span>
                          <span className="font-mono text-amber-400">1,800 mm/min (71 IPM)</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (Wood):</span>
                          <span className="font-mono text-amber-400">1.2 – 1.8 mm</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (Aluminum):</span>
                          <span className="font-mono text-amber-400">0.2 – 0.4 mm (with lube)</span>
                        </div>
                      </div>
                    </div>

                    {/* 4040-PRO */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">Genmitsu 4040-PRO / Renaissance</span>
                        <span className="font-mono text-emerald-400 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          500W / 710W Makita
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Work Area: <strong className="text-zinc-200">400 × 400 × 78 mm</strong>. Dual Y-axis lead screws, high rigidity for hardwoods & soft metals.
                      </p>
                      <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1 text-[11px]">
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Safe Feed:</span>
                          <span className="font-mono text-amber-400">2,500 mm/min (98 IPM)</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (Wood):</span>
                          <span className="font-mono text-amber-400">2.0 – 3.0 mm</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Spindle Mounting:</span>
                          <span className="font-mono text-zinc-300">52mm or 65mm router bracket</span>
                        </div>
                      </div>
                    </div>

                    {/* PROVerXL Series */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">Genmitsu PROVerXL 4030 & 6060</span>
                        <span className="font-mono text-emerald-400 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          710W Trim Router / VFD
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Work Area: <strong className="text-zinc-200">400 × 300 mm (expandable to 6060 or 1010)</strong>. C-beam extrusion and rigid closed-loop control.
                      </p>
                      <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1 text-[11px]">
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Safe Feed:</span>
                          <span className="font-mono text-amber-400">3,000+ mm/min (118 IPM)</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Max Pass Depth (Wood):</span>
                          <span className="font-mono text-amber-400">3.5 – 5.0 mm</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Recommended Spindle:</span>
                          <span className="font-mono text-zinc-300">Makita RT0700 / DeWalt 611</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SainSmart / Genmitsu Tool Database Files */}
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                    <Lightbulb className="h-4 w-4 text-emerald-400" />
                    <span>How to use Official Genmitsu .tdb Files from the SainSmart Website</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    SainSmart distributes official Carveco tool libraries: <strong className="text-zinc-100">"SainSmart Bits (Carveco_Metric).tdb"</strong> and <strong className="text-zinc-100">"SainSmart Bits (Carveco_Inches).tdb"</strong>.
                  </p>
                  <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>Direct Upload:</strong> You can upload either file directly into this applet. The parser reads all tool groups, names, cutting depths, and speeds with zero data loss.
                    </li>
                    <li>
                      <strong>Instant One-Click Load:</strong> You don't even need to download the file! Simply click <strong className="text-emerald-300">"Genmitsu Bits (28)"</strong> in the header or in the Upload modal to load the complete authentic library instantly.
                    </li>
                    <li>
                      <strong>Auto-Tuning for Upgrades:</strong> When running these bits on a Makita 710W router or 4040-PRO, open the Spindle Tuner and select <strong className="text-amber-300">"4040-PRO"</strong> or <strong className="text-amber-300">"Wood (1.8× Feed)"</strong> to prevent bit burning and chatter.
                    </li>
                  </ul>
                </div>

                {/* Candle (GRBL) Workflow */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    Running on Candle & Universal Gcode Sender (UGS)
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Genmitsu machines run on open-source GRBL firmware. When exporting, click <strong className="text-zinc-200">Export &amp; Download</strong> and choose the <strong className="text-emerald-300">Candle GRBL (.nc)</strong> or <strong className="text-emerald-300">UGS Tool Table</strong> tabs to copy safe spindle start codes and tool offset headers directly into your G-code programs.
                  </p>
                </div>
              </div>
            )}

            {/* WEBSITE & VERCEL INTEGRATION GUIDE */}
            {activeTab === 'website_embed' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-sky-400" />
                    How to Integrate Carveco Bit Studio into Your Website / Vercel
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Step-by-step methods to host or embed this application as a standalone page or interactive widget on your website.
                  </p>
                </div>

                {/* Method 1: Responsive iframe */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20 text-sky-400 text-xs font-bold">1</span>
                      Embed via Responsive &lt;iframe&gt; (Works on Any Website / Vercel)
                    </h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`<div style="width: 100%; height: 100vh; min-height: 700px; border: none; border-radius: 12px; overflow: hidden;">
  <iframe
    src="${window.location.origin}"
    title="Carveco Bit Studio"
    width="100%"
    height="100%"
    style="border: 0; width: 100%; height: 100%; display: block;"
    allow="clipboard-read; clipboard-write"
    loading="lazy"
  ></iframe>
</div>`, 'iframe-snippet')}
                      className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-mono"
                    >
                      {copiedSnippet === 'iframe-snippet' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSnippet === 'iframe-snippet' ? 'Copied!' : 'Copy Embed Code'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Paste this HTML code directly into any webpage, Next.js page, WordPress block, Webflow custom embed, or Shopify page:
                  </p>
                  <pre className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`<div style="width: 100%; height: 100vh; min-height: 700px; border: none; border-radius: 12px; overflow: hidden;">
  <iframe
    src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-applet-url.run.app'}"
    title="Carveco Bit Studio"
    width="100%"
    height="100%"
    style="border: 0; width: 100%; height: 100%; display: block;"
    allow="clipboard-read; clipboard-write"
    loading="lazy"
  ></iframe>
</div>`}
                  </pre>
                </div>

                {/* Method 2: Next.js / React Route on Vercel */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 text-xs font-bold">2</span>
                      Next.js App Router Page (e.g. your-website.vercel.app/tools)
                    </h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`// app/tools/page.tsx
export const metadata = {
  title: 'Carveco Bit Studio - Tool Database Bulk Editor',
  description: 'Calibrate speeds, feeds, and 710W router settings',
};

export default function ToolsPage() {
  return (
    <main className="w-full h-screen bg-zinc-950">
      <iframe
        src="${window.location.origin}"
        className="w-full h-full border-0"
        title="Carveco Bit Studio"
        allow="clipboard-read; clipboard-write"
      />
    </main>
  );
}`, 'nextjs-snippet')}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-mono"
                    >
                      {copiedSnippet === 'nextjs-snippet' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSnippet === 'nextjs-snippet' ? 'Copied!' : 'Copy Next.js Code'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    In your Next.js Vercel project, create a file at <code className="text-amber-300 font-mono">app/tools/page.tsx</code>:
                  </p>
                  <pre className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`// app/tools/page.tsx
export default function ToolsPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] min-h-[750px]">
      <iframe
        src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-applet-url.run.app'}"
        className="w-full h-full border-0 rounded-lg shadow-xl"
        title="Carveco Bit Studio"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}`}
                  </pre>
                </div>

                {/* Method 3: Direct Standalone Deployment to Vercel */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">3</span>
                    Deploy Directly as its Own Vercel Subdomain
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Because this app is a standard Vite + React SPA, you can also deploy it directly to Vercel with zero config:
                  </p>
                  <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                    <li>Push the project to your GitHub repository.</li>
                    <li>Go to <strong className="text-zinc-100">Vercel.com &gt; Add New Project</strong>.</li>
                    <li>Select your repository. Vercel automatically detects <strong className="text-zinc-100">Vite</strong> and configures <code className="text-amber-300 font-mono">npm run build</code> and the <code className="text-amber-300 font-mono">dist</code> directory.</li>
                    <li>Click <strong className="text-emerald-400 font-semibold">Deploy</strong>. Your applet is live instantly on your custom Vercel domain!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* 2. SPINDLE PHYSICS & WATTAGE */}
            {activeTab === 'spindle_physics' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-amber-400" />
                    Spindle Wattage Calibration & Cutting Physics
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Why feeds and stepdowns change dramatically when upgrading from a 60W stock motor to a 710W trim router.
                  </p>
                </div>

                {/* The Core Question Answered */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Lightbulb className="h-4 w-4" />
                    <span>The User Question: "Why did my stepdown and feed change when I uploaded the Genmitsu file?"</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Stock Genmitsu databases are authored for factory <strong className="text-amber-400">775 DC motors (60W to 100W)</strong>. These small motors have very little torque: they stall easily if stepdown exceeds 0.5mm or feeds exceed 600 mm/min.
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    When upgrading to a <strong className="text-amber-400">710W trim router (Makita RT0700 / DeWalt DWP611)</strong>, you have <strong className="text-white font-mono">~7x to 11x more mechanical power</strong> and much higher rotational inertia. Running a 710W router at 60W feeds causes <strong className="text-rose-300">bit rubbing, friction heat, and charred wood</strong> because the chip load is far too thin!
                  </p>
                </div>

                {/* Mathematical Scaling Model */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    The Physical Scaling Formula
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Material Removal Rate (<span className="font-mono text-zinc-300">MRR = Feed × Depth × Stepover</span>) is directly proportional to spindle cutting power. To avoid exceeding machine frame rigidity, the app utilizes sub-linear power scaling:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3 space-y-1">
                      <div className="font-mono text-amber-400 text-[11px]">FEED MULTIPLIER</div>
                      <div className="font-mono text-xs text-zinc-200">Scale = (Target_Watts / Source_Watts)^0.38</div>
                      <p className="text-zinc-500 text-[11px]">
                        Prevents tool deflection while ensuring chip thickness prevents rubbing.
                      </p>
                    </div>

                    <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3 space-y-1">
                      <div className="font-mono text-amber-400 text-[11px]">STEPDOWN MULTIPLIER</div>
                      <div className="font-mono text-xs text-zinc-200">Scale = (Target_Watts / Source_Watts)^0.42</div>
                      <p className="text-zinc-500 text-[11px]">
                        Takes advantage of 710W high torque to take deeper passes with less vibration.
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                    Example: Scaling from 60W (Genmitsu stock) to 710W (Makita RT0700) results in ~2.55x feed rate and ~2.81x stepdown capacity, moving an 0.5mm pass to a clean, fast 1.4mm pass.
                  </div>
                </div>

                {/* Makita RT0700 Dial Table */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
                    <span>Makita RT0700 (710W) Speed Dial Reference</span>
                    <span className="text-xs font-mono text-amber-400">10,000 to 30,000 RPM</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                          <th className="py-2 px-3">Dial #</th>
                          <th className="py-2 px-3">Spindle RPM</th>
                          <th className="py-2 px-3">Recommended Materials</th>
                          <th className="py-2 px-3">Primary Bits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 text-zinc-300">
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 1</td>
                          <td className="py-2 px-3 font-mono">10,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Aluminum 6061, Brass, Soft Plastics</td>
                          <td className="py-2 px-3">Single-flute O-flute cutters</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 2</td>
                          <td className="py-2 px-3 font-mono">12,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Acrylic (Cast), Delrin, Large Surfacing</td>
                          <td className="py-2 px-3">Fly cutters, 1" surfacing bits</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 3</td>
                          <td className="py-2 px-3 font-mono">17,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Dense Hardwoods (Oak, Maple, Walnut)</td>
                          <td className="py-2 px-3">1/4" 2-flute upcut & compression</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 4</td>
                          <td className="py-2 px-3 font-mono">22,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Softwoods (Pine, Cedar), Plywood, MDF</td>
                          <td className="py-2 px-3">1/8" 2-flute spirals, downcuts</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 5</td>
                          <td className="py-2 px-3 font-mono">27,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Fine 3D Carving, PCB engraving</td>
                          <td className="py-2 px-3">Tapered ball nose, V-bits</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-400">Dial 6</td>
                          <td className="py-2 px-3 font-mono">30,000 RPM</td>
                          <td className="py-2 px-3 text-zinc-400">Micro-engraving (Use with caution: high heat)</td>
                          <td className="py-2 px-3">0.1mm micro-tips</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. LIVE CALCULATOR */}
            {activeTab === 'calculator' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-amber-400" />
                    Interactive CNC Chip Load & Speed Calculator
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Calculate true tooth chip load in real time to verify whether your feeds and speeds are cutting crisp chips or burning your workpiece.
                  </p>
                </div>

                {/* Calculator Interactive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inputs */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Tool & Cut Parameters
                    </h4>

                    {/* Bit Diameter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-zinc-300 font-medium">Cutter Diameter</label>
                        <span className="font-mono text-amber-400">{calcDiameter} mm ({((calcDiameter)/25.4).toFixed(3)}")</span>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { label: '1/8" (3.175mm)', val: 3.175 },
                          { label: '4.0 mm', val: 4.0 },
                          { label: '1/4" (6.35mm)', val: 6.35 },
                          { label: '1/2" (12.7mm)', val: 12.7 },
                        ].map(d => (
                          <button
                            key={d.val}
                            onClick={() => setCalcDiameter(d.val)}
                            className={`flex-1 text-[11px] py-1 rounded border transition-colors ${
                              calcDiameter === d.val
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flute Count */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-zinc-300 font-medium">Flute Count</label>
                        <span className="font-mono text-amber-400">{calcFlutes} flutes</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(f => (
                          <button
                            key={f}
                            onClick={() => setCalcFlutes(f)}
                            className={`flex-1 text-xs py-1 rounded border transition-colors ${
                              calcFlutes === f
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {f} {f === 1 ? 'Flute (O-flute)' : 'Flutes'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spindle RPM */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-zinc-300 font-medium">Spindle RPM</label>
                        <span className="font-mono text-amber-400">{calcRpm.toLocaleString()} RPM</span>
                      </div>
                      <input
                        type="range"
                        min="8000"
                        max="30000"
                        step="500"
                        value={calcRpm}
                        onChange={e => setCalcRpm(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>8,000 (Min VFD)</span>
                        <span>18,000 (Makita Dial 3)</span>
                        <span>30,000 (Dial 6)</span>
                      </div>
                    </div>

                    {/* Feed Rate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-zinc-300 font-medium">Feed Rate</label>
                        <span className="font-mono text-amber-400">{calcFeed} mm/min ({(calcFeed / 25.4).toFixed(1)} IPM)</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="5000"
                        step="50"
                        value={calcFeed}
                        onChange={e => setCalcFeed(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>200 (Creep)</span>
                        <span>1,800 (Standard Wood)</span>
                        <span>5,000 (High Speed)</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Calculation Result */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                        Real-time Diagnostic Output
                      </h4>

                      <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 space-y-2">
                        <div className="text-[11px] text-zinc-500 font-mono">CHIP LOAD PER TOOTH (fz)</div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-bold font-mono text-zinc-100">
                            {chipLoadMm.toFixed(4)}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">mm / tooth</span>
                        </div>
                        <div className="text-sm font-mono text-amber-400">
                          = {chipLoadInch.toFixed(5)}" inches / tooth
                        </div>
                      </div>

                      {/* Diagnostic Status Box */}
                      <div className={`mt-4 rounded-xl border p-4 space-y-1.5 ${chipLoadStatus.color}`}>
                        <div className="text-xs font-bold uppercase tracking-wider">
                          Rating: {chipLoadStatus.label}
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          {chipLoadStatus.detail}
                        </p>
                      </div>
                    </div>

                    {/* Physics Formula Explanation */}
                    <div className="border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400 space-y-1">
                      <div className="font-semibold text-zinc-300">Exact Engineering Formula:</div>
                      <div className="font-mono bg-zinc-950 p-2 rounded text-zinc-300 text-[10px]">
                        Chip Load = Feed Rate ÷ (Spindle RPM × Number of Flutes)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. UNIT DISCREPANCY & THE 25.4 FIX */}
            {activeTab === 'unit_discrepancy' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-amber-400" />
                    Unit Discrepancy Guide & The "Fix ÷25.4" Solution
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Understanding the common unit conversion bug in CNC tool databases and how to resolve it instantly.
                  </p>
                </div>

                {/* Problem Explanation */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    The Infamous "80.65mm" Bit Bug Explained
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Have you ever uploaded a database and noticed that standard <span className="font-mono text-amber-300">3.175mm</span> (1/8") endmills suddenly show up with an enormous diameter of <strong className="font-mono text-rose-400">80.645mm</strong>?
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    This happens due to a classic double-conversion mismatch:
                  </p>
                  <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-300 border border-zinc-850 space-y-1">
                    <div>1/8 inch = 0.125 inches (stored as float)</div>
                    <div>Target in metric = 3.175 mm (0.125 × 25.4)</div>
                    <div className="text-rose-400">Faulty software interpretation: 3.175 mm multiplied by 25.4 AGAIN = 80.645 mm!</div>
                  </div>
                </div>

                {/* 1-Click Fixer */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    How to Fix with 1 Click
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    In the top navigation header, you will see the quick fix control:
                  </p>
                  <div className="flex items-center gap-3 py-2">
                    <span className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-amber-300">
                      Fix ÷25.4
                    </span>
                    <span className="text-xs text-zinc-400">
                      Divides bloated diameter and stepdown values by 25.4 back to their exact millimeters.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-1">
                    <span className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-amber-300">
                      Set All mm
                    </span>
                    <span className="text-xs text-zinc-400">
                      Standardizes every bit in the database to metric units without altering numeric measurements.
                    </span>
                  </div>
                </div>

                {/* 3 Display Unit Modes */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    Understanding the 3 Display Unit Modes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">Metric (mm)</div>
                      <p className="text-zinc-400 text-[11px]">
                        Converts all bit diameters, stepovers, and stepdowns to millimeters (e.g. 0.125" displays as 3.18mm). Feeds are in mm/min.
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">Imperial (in)</div>
                      <p className="text-zinc-400 text-[11px]">
                        Converts all tools into inches and inches-per-minute (IPM). Perfect for US woodworkers using Imperial collets.
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">Native Units</div>
                      <p className="text-zinc-400 text-[11px]">
                        Displays each bit in the exact raw format stored in the binary file (UnitFlag 0 = inches, UnitFlag 1 = mm).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CAM SOFTWARE EXPORT / IMPORT */}
            {activeTab === 'cam_software' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-amber-400" />
                    CAM Software Export & Import Protocols
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Step-by-step instructions for importing calibrated bits into every popular CNC software package.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Carveco / ArtCAM */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Carveco Maker / Pro & ArtCAM (.TBD / .TDB)
                      </h4>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                        Native Binary
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Export format: <strong className="text-zinc-200">Carveco Binary (.tdb / .tbd)</strong>.
                    </p>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <li>In Carveco, navigate to <strong className="text-amber-300">Toolpaths &gt; Tool Database</strong>.</li>
                      <li>Click the <strong className="text-amber-300">Import...</strong> button in the bottom left corner.</li>
                      <li>Select your downloaded <span className="font-mono text-zinc-200">.tdb</span> file and click Open.</li>
                      <li>All groups, cutting depths, and speeds will immediately appear in your tool tree.</li>
                    </ol>

                    {/* Carveco Tool Settings Demystified */}
                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
                      <h5 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Compass className="h-4 w-4" />
                        Carveco Tool Settings & Geometry Breakdown
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-zinc-300">
                        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 space-y-1">
                          <span className="font-semibold text-amber-400 block">1. Tip Size & Tip Radius (w / r)</span>
                          <p className="text-zinc-400 leading-relaxed">
                            • <strong>Engraving & Flat V-Bits:</strong> Tip Size (<code className="text-zinc-200">w</code>) is the flat flat-spot width at the point (e.g. 0.1mm, 0.2mm, 0.005"). Carveco calculates V-carve plunge depths and tool offsets from this dimension.<br />
                            • <strong>Conical / Tapered Ball Nose:</strong> Tip Radius (<code className="text-zinc-200">r</code>) is the ball radius at the apex (e.g. R0.5mm, R0.25mm) used for smooth 3D relief contours.<br />
                            • <strong>Ball Nose:</strong> Exactly equals half cutter diameter (<code className="text-zinc-200">D/2</code>).<br />
                            • <strong>Bull Nose:</strong> Corner radius (<code className="text-zinc-200">r</code>) for smooth bottom fillet edges.
                          </p>
                        </div>

                        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 space-y-1">
                          <span className="font-semibold text-amber-400 block">2. Stepover (Distance & % of D)</span>
                          <p className="text-zinc-400 leading-relaxed">
                            • <strong>8% - 10%:</strong> High-resolution 3D relief finishing (virtually eliminates scallop ridge lines).<br />
                            • <strong>40%:</strong> Carveco default clearing & pocketing pass stepover.<br />
                            • <strong>50% - 75%:</strong> Rapid roughing passes in softer woods.<br />
                            In Bit Studio, editing either distance or % automatically updates the other.
                          </p>
                        </div>

                        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 space-y-1">
                          <span className="font-semibold text-amber-400 block">3. Included Angle & Taper Angle</span>
                          <p className="text-zinc-400 leading-relaxed">
                            • <strong>V-Bits:</strong> 60° (standard fine text), 90° (bold bevels), 15°/30° (ultra-fine PCB and metal engraving).<br />
                            • <strong>Conical bits:</strong> 3.82° or 5.4° side half-angle for deep 3D carving clearance without cutter deflection.
                          </p>
                        </div>

                        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 space-y-1">
                          <span className="font-semibold text-amber-400 block">4. Material Strategies & Units</span>
                          <p className="text-zinc-400 leading-relaxed">
                            Carveco associates speeds and feeds with Material Profiles (Hardwood, Softwood, Acrylic, Aluminum). Each bit can have distinct feed units (mm/min, mm/sec, in/min) and plunge units configured.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventables Easel */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        Inventables Easel (.JSON / .CSV)
                      </h4>
                      <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20">
                        Custom Bits
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Export format: <strong className="text-zinc-200">Easel Custom Bits (.json)</strong> or CSV.
                    </p>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <li>Log in to <strong className="text-sky-300">Inventables Easel</strong> and open any project.</li>
                      <li>Click the <strong className="text-sky-300">Bit Selector</strong> menu in the upper right.</li>
                      <li>Click <strong className="text-sky-300">Manage Bit Database</strong> &gt; <strong className="text-sky-300">Import Bits</strong>.</li>
                      <li>Select the exported <span className="font-mono text-zinc-200">.json</span> file. Easel will instantly populate all your endmills, V-bits, and ball noses.</li>
                    </ol>
                  </div>

                  {/* Vectric Aspire / VCarve */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Vectric VCarve Pro & Aspire (.CSV)
                      </h4>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                        Tool Database CSV
                      </span>
                    </div>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <li>In Vectric, open <strong className="text-emerald-300">Toolpaths &gt; Tool Database</strong>.</li>
                      <li>Click <strong className="text-emerald-300">Import a tool database</strong> (or right-click a group &gt; Import).</li>
                      <li>Select the exported Vectric CSV file and click Open.</li>
                    </ol>
                  </div>

                  {/* Autodesk Fusion 360 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        Autodesk Fusion 360 Manufacture (.tools)
                      </h4>
                      <span className="text-[10px] font-mono bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded border border-orange-500/20">
                        CAM Tool Library
                      </span>
                    </div>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <li>Switch to the <strong className="text-orange-300">Manufacture</strong> workspace in Fusion 360.</li>
                      <li>Open <strong className="text-orange-300">Manage &gt; Tool Library</strong>.</li>
                      <li>Right-click on <strong className="text-orange-300">Local</strong> and select <strong className="text-orange-300">Import Tool Library</strong>.</li>
                      <li>Select the downloaded <span className="font-mono text-zinc-200">.tools</span> JSON file.</li>
                    </ol>
                  </div>

                  {/* Carbide Create */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-400" />
                        Carbide Create (.CSV)
                      </h4>
                      <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                        Custom Tools CSV
                      </span>
                    </div>
                    <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <li>In Carbide Create, go to <strong className="text-purple-300">Help &gt; Open Data Directory</strong>.</li>
                      <li>Place the exported CSV into the <span className="font-mono text-zinc-200">/Carbide Create/tools/</span> folder.</li>
                      <li>Restart Carbide Create to access your new library.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BIT BRAND LIBRARIES */}
            {activeTab === 'brand_libraries' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-400" />
                    Built-in Manufacturer Bit Catalogs
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Carveco Bit Studio includes authentic presets with calibrated geometry, flute counts, stepovers, and speeds:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-100">Whiteside Machine Co.</span>
                      <span className="text-xs font-mono text-amber-400">160 Bits</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Complete catalog including RU2075, RU1600 downcuts, SC64 ball noses, 60°/90° V-grooves, surfacing fly cutters, and compression spirals.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-emerald-300">Genmitsu (SainSmart)</span>
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          Partner Sponsor
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">28 Bits</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Comprehensive official catalog: Nano Blue 2F/4F flat end mills (0.8–6mm), TiN cutters, 3D relief ball nose (R0.5–R3.0), 20°/30°/60°/90° V-bits, single-flute O-flutes (plastics & aluminum), compression bits, surfacing fly cutters, and PCB corn teeth!
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-100">Amana Tool (Spektra)</span>
                      <span className="text-xs font-mono text-amber-400">Spektra nACo</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      High-end nano-composite coated bits (46202-K downcut, 51411-K single flute aluminum, RC-2248 insert face mill).
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-100">Freud / Diablo Precision</span>
                      <span className="text-xs font-mono text-amber-400">TiCo Carbide</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      High-density carbide straight bits, mortising cutters, and heavy-duty signmaking bits for professional joinery.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-100">Bits & Bits (Astra HP)</span>
                      <span className="text-xs font-mono text-amber-400">Astra Coated</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Proprietary heat-dissipation coating designed specifically for high-speed desktop CNCs and tight 3D relief carvings.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-100">710W Essential Starter Pack</span>
                      <span className="text-xs font-mono text-amber-400">8 Calibrated Bits</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Hand-picked beginner/intermediate collection pre-calibrated to Makita RT0700 speed dials 1 through 4 with safe chip loads.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. BULK MATH & CALIBRATION */}
            {activeTab === 'bulk_math' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-amber-400" />
                    Bulk Math & Batch Calibration Operations
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    How to adjust dozens of bits simultaneously with mathematical precision.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    The 4 Bulk Operation Modes
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">1. Multiply by Factor</div>
                      <p className="text-zinc-400">
                        Multiply feed rate or stepdown across all selected bits (e.g. <span className="font-mono text-zinc-200">× 1.25</span> for a 25% speed increase after machine stiffening).
                      </p>
                    </div>

                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">2. Set Fixed Value</div>
                      <p className="text-zinc-400">
                        Force an exact value across selected bits (e.g. set all roughing stepdowns to exactly <span className="font-mono text-zinc-200">2.0 mm</span>).
                      </p>
                    </div>

                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">3. Clamp (Min / Max Limits)</div>
                      <p className="text-zinc-400">
                        Enforce router hardware boundaries. For example, clamp max spindle speed to <span className="font-mono text-zinc-200">30,000 RPM</span> so no bit demands unreachable speeds.
                      </p>
                    </div>

                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-850 space-y-1">
                      <div className="font-semibold text-amber-300">4. Find & Replace Strings</div>
                      <p className="text-zinc-400">
                        Batch rename bit descriptions or notes across hundreds of tools (e.g. replace <span className="font-mono text-zinc-200">"Genmitsu"</span> with <span className="font-mono text-zinc-200">"Makita 710W"</span>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. TROUBLESHOOTING & PROBLEM SOLVER */}
            {activeTab === 'troubleshooting' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-amber-400" />
                    CNC Problem Solver & Cutting Diagnostics
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Quick diagnosis for the most common issues encountered on desktop and hobbyist CNC routers:
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Issue 1: Burning wood */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                      <ShieldAlert className="h-4 w-4" />
                      Workpiece Burning, Smoke, or Discolored Cut Edge
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100">Root Cause:</strong> Spindle RPM is too high relative to your feed rate. The cutter teeth are rubbing against the wood grain rather than slicing out distinct chips, generating immense friction heat.
                    </p>
                    <div className="bg-zinc-950 p-3 rounded text-xs text-amber-300 border border-zinc-850">
                      <strong className="text-zinc-200">Action:</strong> Increase feed rate by 20–40% OR lower your router speed dial by 1–2 positions (e.g. from Dial 5 down to Dial 3).
                    </div>
                  </div>

                  {/* Issue 2: Chatter and vibration */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                      Loud Chattering, Rattle, or Wavy Edge Finish
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100">Root Cause:</strong> Tool deflection or mechanical resonance. Stepdown is too deep for your CNC frame rigidity or bit stick-out from the collet is too long.
                    </p>
                    <div className="bg-zinc-950 p-3 rounded text-xs text-amber-300 border border-zinc-850">
                      <strong className="text-zinc-200">Action:</strong> Reduce stepdown per pass by 30%. Seat the bit shank deeper inside the collet (leave only cutting flutes exposed).
                    </div>
                  </div>

                  {/* Issue 3: Spindle stalling */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                      <AlertTriangle className="h-4 w-4" />
                      Router Motor Bogs Down or Stalls Mid-Cut
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100">Root Cause:</strong> Cutting power demanded exceeds motor torque capability (very common when trying 1/4" bits on 60W spindles).
                    </p>
                    <div className="bg-zinc-950 p-3 rounded text-xs text-amber-300 border border-zinc-850">
                      <strong className="text-zinc-200">Action:</strong> Decrease depth of cut per pass or upgrade to a 710W trim router.
                    </div>
                  </div>

                  {/* Issue 4: Melted plastics */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                      <AlertTriangle className="h-4 w-4" />
                      Melted Plastic / Acrylic Welding Back to the Cut
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100">Root Cause:</strong> Too many flutes packing chips. 2-flute or 4-flute endmills trap hot chips inside the acrylic groove.
                    </p>
                    <div className="bg-zinc-950 p-3 rounded text-xs text-amber-300 border border-zinc-850">
                      <strong className="text-zinc-200">Action:</strong> Switch to a single-flute <strong className="text-sky-300">O-Flute upcut bit</strong>, set router to Dial 1 or 2 (10,000–12,000 RPM), and maintain a brisk feed rate.
                    </div>
                  </div>

                  {/* Issue 5: Upload File Failure */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <AlertTriangle className="h-4 w-4" />
                      File Upload Error ("No valid CNC tool entries found")
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100">Root Cause:</strong> European Excel CSVs often use semicolons (<code className="text-amber-300 font-mono">;</code>) rather than commas, or numbers use comma decimals (<code className="text-amber-300 font-mono">3,175</code>). Or a file contains non-standard headers.
                    </p>
                    <div className="bg-zinc-950 p-3 rounded text-xs text-emerald-300 border border-zinc-850 space-y-1">
                      <p><strong className="text-zinc-200">How to solve:</strong></p>
                      <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                        <li>Carveco Bit Studio now automatically detects semicolon delimiters and comma decimals!</li>
                        <li>If your file still gives an error, open it in Notepad or Excel, copy the text, and use the <strong>Paste CSV / Text</strong> tab in the Upload dialog.</li>
                        <li>Ensure at least Tool Name and Diameter are present on each row.</li>
                        <li>You can also click <strong>Genmitsu Bits (28)</strong> in the top header to load the complete pre-calibrated official library immediately.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. KEYBOARD SHORTCUTS & PRO TIPS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-amber-400" />
                    Keyboard Shortcuts & Shop Floor Efficiency
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Master these keyboard hotkeys to manage and tune tools at lightning speed:
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="divide-y divide-zinc-850 text-xs">
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Undo Last Change</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-amber-300">
                        Ctrl + Z
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Redo Reverted Change</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-amber-300">
                        Ctrl + Y / Ctrl + Shift + Z
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Open Help & Assistance Center</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-amber-300">
                        ? or F1
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Close Any Modal / Dialog</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-amber-300">
                        Escape
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Inline Cell Editing</span>
                      <span className="text-zinc-400">Click any diameter, feed, or RPM cell directly</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Commit Cell Edit</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                        Enter
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-zinc-300">Cancel Cell Edit</span>
                      <kbd className="font-mono bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                        Escape
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Bottom Footer Bar */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/60 px-6 py-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>Ready for Carveco, Easel, Vectric, Fusion 360, & Carbide Create</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 font-medium text-zinc-200 transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
