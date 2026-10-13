import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Edit2,
  Copy,
  Trash2,
  RotateCcw,
  Plus,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  ArrowRightLeft,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { CarvecoTool, ToolType } from '../types/tool';
import {
  DisplayUnitMode,
  isToolMetric,
  getDisplayDiameter,
  getDisplayStepdown,
  getDisplayFeedRate,
  getDisplayPlungeRate,
  inputToNativeDimension,
  inputToNativeFeed,
} from '../utils/unitConverter';

interface ToolTableProps {
  tools: CarvecoTool[];
  groups: string[];
  selectedToolIds: string[];
  activeGroup: string;
  onSelectGroup: (group: string) => void;
  onToggleSelectTool: (toolId: string) => void;
  onSelectAllTools: (toolIds: string[]) => void;
  onClearSelection: () => void;
  onUpdateTool: (toolId: string, updates: Partial<CarvecoTool>) => void;
  onDeleteTool: (toolId: string) => void;
  onDuplicateTool: (toolId: string) => void;
  onRevertTool: (toolId: string) => void;
  onAddNewTool: () => void;
  onOpenToolDetail: (tool: CarvecoTool) => void;
  onConvertToolUnits: (toolIds: string[], targetUnit: 'mm' | 'inch') => void;
  onFixUnitSwap?: (action: 'div254' | 'mul254' | 'setMetric' | 'setImperial') => void;
  unitMode: DisplayUnitMode;
}

type SortField = 'name' | 'toolNo' | 'diameter' | 'stepdown' | 'spindleSpeed' | 'feedRate' | 'plungeRate' | 'group';
type SortOrder = 'asc' | 'desc';

export const ToolTable: React.FC<ToolTableProps> = ({
  tools,
  groups,
  selectedToolIds,
  activeGroup,
  onSelectGroup,
  onToggleSelectTool,
  onSelectAllTools,
  onClearSelection,
  onUpdateTool,
  onDeleteTool,
  onDuplicateTool,
  onRevertTool,
  onAddNewTool,
  onOpenToolDetail,
  onConvertToolUnits,
  onFixUnitSwap,
  unitMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'modified' | 'unmodified'>('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'mm' | 'inch'>('all');
  const [sortField, setSortField] = useState<SortField>('toolNo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Check for suspicious tool diameters (e.g. 80.65mm or 161mm)
  const suspiciousTools = useMemo(() => {
    return tools.filter(t => {
      const diam = getDisplayDiameter(t, unitMode);
      return diam.isSuspicious;
    });
  }, [tools, unitMode]);

  // Editing cells state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Group filter
      if (activeGroup !== 'all' && tool.group !== activeGroup) return false;

      // Type filter
      if (selectedType !== 'all' && tool.toolType !== selectedType) return false;

      // Unit filter
      const isMetric = isToolMetric(tool);
      if (unitFilter === 'mm' && !isMetric) return false;
      if (unitFilter === 'inch' && isMetric) return false;

      // Status filter
      const isModified =
        tool.spindleSpeed !== tool.originalValues.spindleSpeed ||
        tool.feedRate !== tool.originalValues.feedRate ||
        tool.stepdown !== tool.originalValues.stepdown ||
        tool.plungeRate !== tool.originalValues.plungeRate ||
        tool.diameter !== tool.originalValues.diameter;

      if (statusFilter === 'modified' && !isModified) return false;
      if (statusFilter === 'unmodified' && isModified) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = tool.name.toLowerCase().includes(query);
        const matchGroup = tool.group.toLowerCase().includes(query);
        const matchNotes = tool.notes.toLowerCase().includes(query);
        const matchSize = tool.diameter.toString().includes(query);
        return matchName || matchGroup || matchNotes || matchSize;
      }

      return true;
    });
  }, [tools, activeGroup, selectedType, unitFilter, statusFilter, searchQuery]);

  // Sort tools
  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // If sorting by diameter, normalize to mm first so mm and inch sort in real geometric order
      if (sortField === 'diameter') {
        valA = isToolMetric(a) ? a.diameter : a.diameter * 25.4;
        valB = isToolMetric(b) ? b.diameter : b.diameter * 25.4;
      } else if (sortField === 'stepdown') {
        valA = isToolMetric(a) ? a.stepdown : a.stepdown * 25.4;
        valB = isToolMetric(b) ? b.stepdown : b.stepdown * 25.4;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [filteredTools, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTools.length / pageSize));
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTools.slice(start, start + pageSize);
  }, [sortedTools, currentPage, pageSize]);

  // Selection helpers
  const allFilteredSelected =
    filteredTools.length > 0 &&
    filteredTools.every(t => selectedToolIds.includes(t.id));

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      onSelectAllTools(filteredTools.map(t => t.id));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Inline cell editing
  const startEditing = (tool: CarvecoTool, field: string) => {
    setEditingCell({ id: tool.id, field });
    if (field === 'diameter') {
      const diam = getDisplayDiameter(tool, unitMode);
      setEditValue(diam.value.toFixed(diam.value < 0.1 ? 4 : diam.value % 1 === 0 ? 1 : 2));
    } else if (field === 'stepdown') {
      const sdown = getDisplayStepdown(tool, unitMode);
      setEditValue(sdown.value.toFixed(sdown.value < 0.1 ? 4 : 2));
    } else if (field === 'feedRate') {
      const fr = getDisplayFeedRate(tool, unitMode);
      setEditValue(Math.round(fr.value).toString());
    } else if (field === 'plungeRate') {
      const pr = getDisplayPlungeRate(tool, unitMode);
      setEditValue(Math.round(pr.value).toString());
    } else {
      let val: any = tool[field as keyof CarvecoTool];
      setEditValue(val !== undefined ? String(val) : '');
    }
  };

  const saveEditing = (toolId: string, field: string) => {
    if (!editingCell) return;
    const tool = tools.find(t => t.id === toolId);
    if (!tool) {
      setEditingCell(null);
      return;
    }

    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      if (field === 'diameter') {
        const nativeDiam = inputToNativeDimension(num, tool, unitMode);
        onUpdateTool(toolId, { diameter: Math.round(nativeDiam * 10000) / 10000 });
      } else if (field === 'stepdown') {
        const nativeStep = inputToNativeDimension(num, tool, unitMode);
        onUpdateTool(toolId, { stepdown: Math.round(nativeStep * 10000) / 10000 });
      } else if (field === 'feedRate') {
        const nativeFeed = inputToNativeFeed(num, tool, unitMode);
        onUpdateTool(toolId, { feedRate: Math.round(nativeFeed * 10) / 10 });
      } else if (field === 'plungeRate') {
        const nativePlunge = inputToNativeFeed(num, tool, unitMode);
        onUpdateTool(toolId, { plungeRate: Math.round(nativePlunge * 10) / 10 });
      } else if (field === 'spindleSpeed') {
        onUpdateTool(toolId, { spindleSpeed: Math.round(num) });
      } else {
        onUpdateTool(toolId, { [field]: num });
      }
    } else {
      onUpdateTool(toolId, { [field]: editValue });
    }
    setEditingCell(null);
  };

  // Calculate chip load
  const getChipLoadInfo = (tool: CarvecoTool) => {
    const isMetric = isToolMetric(tool);
    const rpm = tool.spindleSpeed || 18000;
    const flutes = tool.fluteCount || 2;

    // Feed in mm/min
    const feedMmMin = isMetric ? tool.feedRate : tool.feedRate * 25.4;
    const chipLoadMm = feedMmMin / (rpm * flutes);

    // Feed in IPM
    const feedIpm = isMetric ? tool.feedRate / 25.4 : tool.feedRate;
    const chipLoadIn = feedIpm / (rpm * flutes);

    let status: 'good' | 'light' | 'heavy' = 'good';
    if (chipLoadMm < 0.02) status = 'light';
    else if (chipLoadMm > 0.18) status = 'heavy';

    return {
      valueMm: chipLoadMm,
      valueIn: chipLoadIn,
      formatted: unitMode === 'metric'
        ? `${chipLoadMm.toFixed(3)} mm`
        : `${chipLoadIn.toFixed(4)}"`,
      status,
    };
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 overflow-hidden">
      {/* Controls Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search bits by name, part #, size, or notes..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter dropdowns and Add Bit */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Group Filter */}
            <select
              value={activeGroup}
              onChange={e => {
                onSelectGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Groups ({tools.length})</option>
              {groups.map(g => (
                <option key={g} value={g}>
                  {g} ({tools.filter(t => t.group === g).length})
                </option>
              ))}
            </select>

            {/* Geometry Filter */}
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Geometries</option>
              <option value="endmill">End Mills / Spirals</option>
              <option value="ballnose">Ball Nose</option>
              <option value="vbit">V-Bits (60°/90°)</option>
              <option value="surfacing">Surfacing / Fly Cutters</option>
              <option value="engraving">Engraving / Veining</option>
              <option value="roundover">Roundover / Form</option>
            </select>

            {/* Native Unit Filter */}
            <select
              value={unitFilter}
              onChange={e => {
                setUnitFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Units</option>
              <option value="mm">Metric Only (mm)</option>
              <option value="inch">Imperial Only (inch)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Edit States</option>
              <option value="modified">Modified Only</option>
              <option value="unmodified">Unmodified Only</option>
            </select>

            {/* Add Bit Button */}
            <button
              onClick={onAddNewTool}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Bit</span>
            </button>
          </div>
        </div>

        {/* Selected Batch Actions Bar (visible if any selected) */}
        {selectedToolIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-amber-300">
                {selectedToolIds.length} of {tools.length} bits selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-zinc-400 hover:text-zinc-200 underline text-[11px]"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Unit Conversion buttons for selected */}
              <button
                onClick={() => onConvertToolUnits(selectedToolIds, 'mm')}
                className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                title="Convert selected bits internally to Millimeters (mm)"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>To Metric (mm)</span>
              </button>
              <button
                onClick={() => onConvertToolUnits(selectedToolIds, 'inch')}
                className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                title="Convert selected bits internally to Inches"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>To Inches</span>
              </button>

              <button
                onClick={() => {
                  selectedToolIds.forEach(id => {
                    const t = tools.find(x => x.id === id);
                    if (t) {
                      onUpdateTool(id, {
                        feedRate: Math.round(t.feedRate * 1.8 * 10) / 10,
                        stepdown: Math.round(t.stepdown * 1.75 * 1000) / 1000,
                        spindleSpeed: Math.max(12000, Math.min(24000, Math.round(t.spindleSpeed * 1.5))),
                      });
                    }
                  });
                }}
                className="rounded bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-500/25 transition-colors font-semibold flex items-center gap-1 shadow-xs"
                title="Boost feeds (+80%) and stepdown (+75%) for 710W trim router power"
              >
                <Zap className="h-3 w-3 text-amber-400" />
                <span>710W Boost (+80% Feed, +75% Depth)</span>
              </button>

              <button
                onClick={() => {
                  selectedToolIds.forEach(id => {
                    const t = tools.find(x => x.id === id);
                    if (t) {
                      onUpdateTool(id, {
                        feedRate: Math.round(t.feedRate * 0.8 * 10) / 10,
                        stepdown: Math.round(t.stepdown * 0.65 * 1000) / 1000,
                      });
                    }
                  });
                }}
                className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                title="Dampen feeds (-20%) and pass depths (-35%) from commercial 2.2kW machines"
              >
                Industrial Tame (-20%)
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedToolIds.length} selected bits?`)) {
                    selectedToolIds.forEach(id => onDeleteTool(id));
                    onClearSelection();
                  }
                }}
                className="rounded bg-red-950/60 border border-red-800 px-2.5 py-1 text-xs text-red-300 hover:bg-red-900/80 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suspicious Bit Diameters Alert Banner */}
      {suspiciousTools.length > 0 && onFixUnitSwap && (
        <div className="bg-amber-950/80 border-b border-amber-700/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Suspicious Bit Diameters:</strong> {suspiciousTools.length} bits have unusual sizes (e.g.{' '}
              <span className="font-mono font-bold text-amber-300">
                {getDisplayDiameter(suspiciousTools[0], unitMode).formatted}
              </span>{' '}
              for "{suspiciousTools[0].name}"). This occurs when 3.175 mm (1/8") bits were scaled by 25.4.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onFixUnitSwap('div254')}
              className="rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 px-2.5 py-1 font-semibold transition-colors shadow-xs"
              title="Divide diameters & depths by 25.4 to restore 3.175mm bits"
            >
              Fix: Divide by 25.4 (80mm → 3.18mm)
            </button>
            <button
              onClick={() => onFixUnitSwap('setMetric')}
              className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 font-medium transition-colors border border-zinc-700"
            >
              Set All to Metric (mm)
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900/95 border-b border-zinc-800 text-zinc-400 font-medium backdrop-blur-xs">
            <tr>
              {/* Checkbox */}
              <th className="py-2.5 px-3 w-10">
                <button
                  onClick={handleSelectAllFiltered}
                  className="text-zinc-400 hover:text-zinc-200"
                  title={allFilteredSelected ? 'Deselect all' : 'Select all filtered'}
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>

              {/* Bit Name & Group */}
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none min-w-[240px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bit Name & Notes</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Diameter */}
              <th
                onClick={() => handleSort('diameter')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none w-32"
              >
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <span>Diameter ({unitMode === 'metric' ? 'mm' : unitMode === 'imperial' ? 'in' : 'file unit'})</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Stepdown */}
              <th
                onClick={() => handleSort('stepdown')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none w-28"
              >
                <div className="flex items-center gap-1.5">
                  <span>Stepdown</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Spindle Speed */}
              <th
                onClick={() => handleSort('spindleSpeed')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none w-32"
              >
                <div className="flex items-center gap-1.5 text-amber-300">
                  <span>Spindle (RPM)</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Feed Rate */}
              <th
                onClick={() => handleSort('feedRate')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none w-32"
              >
                <div className="flex items-center gap-1.5">
                  <span>Feed ({unitMode === 'metric' ? 'mm/min' : unitMode === 'imperial' ? 'IPM' : 'rate'})</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Plunge Rate */}
              <th
                onClick={() => handleSort('plungeRate')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 select-none w-28"
              >
                <div className="flex items-center gap-1.5">
                  <span>Plunge Rate</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </th>

              {/* Chip Load */}
              <th className="py-2.5 px-3 w-28">
                <span>Chip Load</span>
              </th>

              {/* Actions */}
              <th className="py-2.5 px-3 text-right w-28">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {paginatedTools.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-500 font-sans">
                  No bits match your search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTools.map(tool => {
                const isSelected = selectedToolIds.includes(tool.id);
                const isModified =
                  tool.spindleSpeed !== tool.originalValues.spindleSpeed ||
                  tool.feedRate !== tool.originalValues.feedRate ||
                  tool.stepdown !== tool.originalValues.stepdown ||
                  tool.plungeRate !== tool.originalValues.plungeRate ||
                  tool.diameter !== tool.originalValues.diameter;

                const isMetric = isToolMetric(tool);
                const diam = getDisplayDiameter(tool, unitMode);
                const sdown = getDisplayStepdown(tool, unitMode);
                const feed = getDisplayFeedRate(tool, unitMode);
                const plunge = getDisplayPlungeRate(tool, unitMode);
                const chipLoad = getChipLoadInfo(tool);

                // 710W dial estimate
                let dialBadge = '';
                if (tool.spindleSpeed <= 10500) dialBadge = 'Dial 1';
                else if (tool.spindleSpeed <= 13000) dialBadge = 'Dial 2';
                else if (tool.spindleSpeed <= 18000) dialBadge = 'Dial 3';
                else if (tool.spindleSpeed <= 23000) dialBadge = 'Dial 4';
                else if (tool.spindleSpeed <= 28000) dialBadge = 'Dial 5';
                else dialBadge = 'Dial 6';

                return (
                  <tr
                    key={tool.id}
                    className={`hover:bg-zinc-900/60 transition-colors ${
                      isSelected ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onToggleSelectTool(tool.id)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Tool Name & Group & Notes */}
                    <td className="py-2 px-3 font-sans">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenToolDetail(tool)}
                            className="font-medium text-zinc-100 hover:text-amber-400 text-left transition-colors flex items-center gap-1 group"
                          >
                            <span>{tool.name}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                          </button>
                          {isModified && (
                            <span
                              className="text-[10px] text-amber-400 font-mono"
                              title="Modified from initial database value"
                            >
                              [mod]
                            </span>
                          )}
                        </div>

                        {/* Quiet unboxed metadata with Carveco Geometry callouts */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>{tool.group}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{tool.toolType}</span>
                          {tool.tipSize !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-400 font-mono font-medium" title="Carveco Tip Size / Flat Width / Radius">
                                Tip: {tool.tipSize}{isMetric ? 'mm' : '"'}
                              </span>
                            </>
                          )}
                          {tool.angle !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-400 font-mono font-medium" title="Included or Taper Angle">
                                {tool.angle}°
                              </span>
                            </>
                          )}
                          {tool.stepoverPercent !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-zinc-400 font-mono" title="Stepover (% of Tool Diameter)">
                                Stepover: {tool.stepoverPercent}%
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{tool.fluteCount} flute</span>
                          <span aria-hidden="true">·</span>
                          <span className={isMetric ? 'text-cyan-400 font-mono' : 'text-zinc-400 font-mono'}>
                            {isMetric ? 'mm' : 'inch'} file format
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Diameter */}
                    <td className="py-2 px-3">
                      {editingCell?.id === tool.id && editingCell.field === 'diameter' ? (
                        <input
                          type="number"
                          step="any"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing(tool.id, 'diameter')}
                          onKeyDown={e => e.key === 'Enter' && saveEditing(tool.id, 'diameter')}
                          className="w-20 rounded border border-amber-500 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => startEditing(tool, 'diameter')}
                              className="cursor-pointer hover:text-amber-400 text-zinc-100 font-semibold"
                              title={`Click to edit. File raw: ${tool.diameter} ${isMetric ? 'mm' : 'inch'}`}
                            >
                              {diam.formatted}
                            </span>
                            {diam.fraction && (
                              <span className="text-[10px] text-amber-400 font-mono font-medium">
                                ({diam.fraction})
                              </span>
                            )}
                          </div>
                          {diam.isSuspicious ? (
                            <span className="text-[10px] text-red-400 font-medium flex items-center gap-0.5 mt-0.5">
                              ⚠️ Check size (raw: {tool.diameter})
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              (file: {tool.diameter}{isMetric ? 'mm' : '"'})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Stepdown */}
                    <td className="py-2 px-3">
                      {editingCell?.id === tool.id && editingCell.field === 'stepdown' ? (
                        <input
                          type="number"
                          step="any"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing(tool.id, 'stepdown')}
                          onKeyDown={e => e.key === 'Enter' && saveEditing(tool.id, 'stepdown')}
                          className="w-20 rounded border border-amber-500 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => startEditing(tool, 'stepdown')}
                            className={`cursor-pointer hover:text-amber-400 ${
                              tool.stepdown !== tool.originalValues.stepdown
                                ? 'text-amber-300 font-semibold'
                                : 'text-zinc-300'
                            }`}
                            title={`Original in file: ${tool.originalValues.stepdown} ${isMetric ? 'mm' : 'inch'}`}
                          >
                            {sdown.formatted}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Spindle Speed */}
                    <td className="py-2 px-3">
                      {editingCell?.id === tool.id && editingCell.field === 'spindleSpeed' ? (
                        <input
                          type="number"
                          step="100"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing(tool.id, 'spindleSpeed')}
                          onKeyDown={e => e.key === 'Enter' && saveEditing(tool.id, 'spindleSpeed')}
                          className="w-24 rounded border border-amber-500 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span
                            onClick={() => startEditing(tool, 'spindleSpeed')}
                            className={`cursor-pointer hover:text-amber-400 font-medium ${
                              tool.spindleSpeed !== tool.originalValues.spindleSpeed
                                ? 'text-amber-400 font-bold'
                                : 'text-zinc-200'
                            }`}
                            title={`Click to edit. Original: ${tool.originalValues.spindleSpeed} RPM`}
                          >
                            {tool.spindleSpeed.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-500">{dialBadge}</span>
                        </div>
                      )}
                    </td>

                    {/* Feed Rate */}
                    <td className="py-2 px-3">
                      {editingCell?.id === tool.id && editingCell.field === 'feedRate' ? (
                        <input
                          type="number"
                          step="any"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing(tool.id, 'feedRate')}
                          onKeyDown={e => e.key === 'Enter' && saveEditing(tool.id, 'feedRate')}
                          className="w-20 rounded border border-amber-500 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100"
                        />
                      ) : (
                        <span
                          onClick={() => startEditing(tool, 'feedRate')}
                          className={`cursor-pointer hover:text-amber-400 ${
                            tool.feedRate !== tool.originalValues.feedRate
                              ? 'text-amber-300 font-semibold'
                              : 'text-zinc-300'
                          }`}
                          title={`Original in file: ${tool.originalValues.feedRate} (Raw)`}
                        >
                          {feed.formatted}
                        </span>
                      )}
                    </td>

                    {/* Plunge Rate */}
                    <td className="py-2 px-3">
                      {editingCell?.id === tool.id && editingCell.field === 'plungeRate' ? (
                        <input
                          type="number"
                          step="any"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing(tool.id, 'plungeRate')}
                          onKeyDown={e => e.key === 'Enter' && saveEditing(tool.id, 'plungeRate')}
                          className="w-20 rounded border border-amber-500 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100"
                        />
                      ) : (
                        <span
                          onClick={() => startEditing(tool, 'plungeRate')}
                          className="cursor-pointer hover:text-amber-400 text-zinc-400"
                          title={`Original: ${tool.originalValues.plungeRate}`}
                        >
                          {plunge.formatted}
                        </span>
                      )}
                    </td>

                    {/* Chip Load */}
                    <td className="py-2 px-3">
                      <span
                        className={`text-[11px] ${
                          chipLoad.status === 'good'
                            ? 'text-emerald-400'
                            : chipLoad.status === 'light'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                        title={`Feed / (RPM * ${tool.fluteCount} flutes) = ${chipLoad.formatted}. ${
                          chipLoad.status === 'light' ? 'Light pass / low chip load' : 'Normal chip load'
                        }`}
                      >
                        {chipLoad.formatted}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        {isModified && (
                          <button
                            onClick={() => onRevertTool(tool.id)}
                            className="p-1 text-zinc-500 hover:text-amber-400 transition-colors"
                            title="Revert to original file settings"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenToolDetail(tool)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Open Bit Profile Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateTool(tool.id)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Duplicate bit"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTool(tool.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete bit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedTools.length)} of {sortedTools.length} bits
          </span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>All</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
