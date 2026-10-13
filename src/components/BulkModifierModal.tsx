import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Calculator,
  Search,
  Check,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { BulkAction, BulkField, BulkOperationConfig, CarvecoTool } from '../types/tool';
import { isToolMetric } from '../utils/unitConverter';

interface BulkModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: CarvecoTool[];
  selectedToolIds: string[];
  activeGroup: string;
  onApplyBulkOperation: (config: BulkOperationConfig) => void;
  onApplyFindReplace: (findText: string, replaceText: string, target: 'name' | 'notes' | 'both') => void;
  onConvertUnits: (scope: 'all' | 'selected' | 'filtered', targetUnit: 'mm' | 'inch', scaleValues: boolean) => void;
}

export const BulkModifierModal: React.FC<BulkModifierModalProps> = ({
  isOpen,
  onClose,
  tools,
  selectedToolIds,
  activeGroup,
  onApplyBulkOperation,
  onApplyFindReplace,
  onConvertUnits,
}) => {
  const [activeTab, setActiveTab] = useState<'math' | 'replace' | 'units'>('math');

  // Math config state
  const [field, setField] = useState<BulkField>('spindleSpeed');
  const [action, setAction] = useState<BulkAction>('multiply');
  const [value, setValue] = useState<number>(1.1);
  const [minValue, setMinValue] = useState<number>(10000);
  const [maxValue, setMaxValue] = useState<number>(30000);
  const [roundIncrement, setRoundIncrement] = useState<number>(500);
  const [scope, setScope] = useState<'all' | 'selected' | 'filtered'>(
    selectedToolIds.length > 0 ? 'selected' : 'all'
  );

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceTarget, setReplaceTarget] = useState<'name' | 'notes' | 'both'>('both');

  // Unit conversion state
  const [targetUnit, setTargetUnit] = useState<'mm' | 'inch'>('mm');
  const [scaleValues, setScaleValues] = useState<boolean>(true);

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  const targetCount =
    scope === 'selected'
      ? selectedToolIds.length || tools.length
      : scope === 'filtered' && activeGroup !== 'all'
      ? tools.filter(t => t.group === activeGroup).length
      : tools.length;

  const handleApplyMath = () => {
    onApplyBulkOperation({
      field,
      action,
      value,
      minValue,
      maxValue,
      roundIncrement,
      scope,
    });
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleApplyReplace = () => {
    if (!findText) return;
    onApplyFindReplace(findText, replaceText, replaceTarget);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleApplyUnitConvert = () => {
    onConvertUnits(scope, targetUnit, scaleValues);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  // Preview sample calculation
  const sample = tools[0];
  let sampleBefore = sample ? (sample[field] as number) : 0;
  let sampleAfter = sampleBefore;
  if (action === 'multiply') sampleAfter = Math.round(sampleBefore * value * 100) / 100;
  else if (action === 'divide' && value !== 0) sampleAfter = Math.round((sampleBefore / value) * 100) / 100;
  else if (action === 'add') sampleAfter = sampleBefore + value;
  else if (action === 'subtract') sampleAfter = Math.max(0, sampleBefore - value);
  else if (action === 'set') sampleAfter = value;
  else if (action === 'clamp') sampleAfter = Math.max(minValue, Math.min(maxValue, sampleBefore));
  else if (action === 'round' && roundIncrement > 0) sampleAfter = Math.round(sampleBefore / roundIncrement) * roundIncrement;
  else if (action === 'percent') sampleAfter = Math.round((sampleBefore * (1 + value / 100)) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Bulk Database Math & Tools</h2>
              <p className="text-xs text-zinc-400">Modify properties across the entire bit catalog simultaneously</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs">
          <button
            onClick={() => setActiveTab('math')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'math'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Math Operations</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'units'
                ? 'bg-zinc-800 text-amber-300 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Convert Units (mm / in)</span>
          </button>
          <button
            onClick={() => setActiveTab('replace')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'replace'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Find & Replace</span>
          </button>
        </div>

        {activeTab === 'math' ? (
          <div className="space-y-4">
            {/* Field & Action Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Target Field
                </label>
                <select
                  value={field}
                  onChange={e => setField(e.target.value as BulkField)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="spindleSpeed">Spindle Speed (RPM)</option>
                  <option value="feedRate">Feed Rate (Cutting Speed)</option>
                  <option value="plungeRate">Plunge Rate (Z-Axis Feed)</option>
                  <option value="stepdown">Stepdown (Pass Depth)</option>
                  <option value="stepoverPercent">Stepover % of Tool Diameter</option>
                  <option value="stepover">Stepover Distance</option>
                  <option value="tipSize">Tip Size / Flat Width / Radius</option>
                  <option value="angle">Included / Taper Angle (°)</option>
                  <option value="param2">Param 2 (Binary Fallback)</option>
                  <option value="diameter">Tool Diameter</option>
                  <option value="toolNo">Tool Number</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Operation
                </label>
                <select
                  value={action}
                  onChange={e => setAction(e.target.value as BulkAction)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="multiply">Multiply (× Factor)</option>
                  <option value="divide">Divide (÷ Factor)</option>
                  <option value="percent">Percent Adjust (+/- %)</option>
                  <option value="add">Add (+ Offset)</option>
                  <option value="subtract">Subtract (- Offset)</option>
                  <option value="set">Set Fixed Value (=)</option>
                  <option value="clamp">Clamp to Range [Min, Max]</option>
                  <option value="round">Round to Increment</option>
                </select>
              </div>
            </div>

            {/* Value Inputs based on Action */}
            {action === 'clamp' ? (
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Minimum Limit</label>
                  <input
                    type="number"
                    value={minValue}
                    onChange={e => setMinValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Maximum Limit</label>
                  <input
                    type="number"
                    value={maxValue}
                    onChange={e => setMaxValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : action === 'round' ? (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <label className="block text-xs text-zinc-400 mb-1">Round to nearest increment (e.g. 500 RPM or 5 IPM)</label>
                <input
                  type="number"
                  value={roundIncrement}
                  onChange={e => setRoundIncrement(parseFloat(e.target.value) || 1)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <label className="block text-xs text-zinc-400 mb-1">
                  {action === 'multiply' ? 'Multiplier (e.g., 0.8 for 20% reduction, 1.2 for 20% boost)' :
                   action === 'divide' ? 'Divisor' :
                   action === 'percent' ? 'Percentage Change (+15% or -20%)' :
                   action === 'add' || action === 'subtract' ? 'Amount to add/subtract' : 'Fixed target value'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={e => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Scope */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Apply To:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'all'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Bits ({tools.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  disabled={selectedToolIds.length === 0}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'selected'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30'
                  }`}
                >
                  Selected ({selectedToolIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'filtered'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Current Filter
                </button>
              </div>
            </div>

            {/* Live Sample Preview */}
            {sample && (
              <div className="flex items-center justify-between text-xs p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-zinc-400">
                <span>Sample ({sample.name.slice(0, 20)}...):</span>
                <span>
                  {sampleBefore} → <strong className="text-amber-400">{sampleAfter}</strong>
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyMath}
                className="flex items-center gap-1.5 rounded bg-amber-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                {appliedSuccess ? <Check className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                <span>{appliedSuccess ? 'Updated!' : `Calculate & Update ${targetCount} Bits`}</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'units' ? (
          /* Unit Converter Tab */
          <div className="space-y-4">
            <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-zinc-200 block">Target Measurement Unit:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetUnit('mm')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    targetUnit === 'mm'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-xs font-bold text-zinc-100">Metric (mm & mm/min)</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">Standard European / ISO units</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetUnit('inch')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    targetUnit === 'inch'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-xs font-bold text-zinc-100">Imperial (inches & IPM)</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">Standard US units</span>
                </button>
              </div>

              {/* Scale option */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={scaleValues}
                    onChange={e => setScaleValues(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold block text-zinc-200">
                      Convert and scale dimensions (multiply / divide by 25.4)
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Leave checked if converting from inches to mm (e.g. 0.25" becomes 6.35mm). Uncheck if your database numbers are already in {targetUnit} and just need the file tag fixed!
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Apply To:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'all'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Bits ({tools.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  disabled={selectedToolIds.length === 0}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'selected'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30'
                  }`}
                >
                  Selected ({selectedToolIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`py-2 px-3 text-xs rounded border transition-colors ${
                    scope === 'filtered'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Current Filter
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUnitConvert}
                className="flex items-center gap-1.5 rounded bg-amber-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                {appliedSuccess ? <Check className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                <span>{appliedSuccess ? 'Converted!' : `Convert ${targetCount} Bits to ${targetUnit === 'mm' ? 'Metric' : 'Imperial'}`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Find & Replace Tab */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Find text:</label>
              <input
                type="text"
                placeholder="e.g. Whiteside or 20000 RPM or Starting Points"
                value={findText}
                onChange={e => setFindText(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Replace with:</label>
              <input
                type="text"
                placeholder="e.g. 710W Makita Tuned"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target Fields:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceTarget('both')}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    replaceTarget === 'both'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Names & Notes
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceTarget('name')}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    replaceTarget === 'name'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Tool Names Only
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceTarget('notes')}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    replaceTarget === 'notes'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Notes Only
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyReplace}
                disabled={!findText}
                className="flex items-center gap-1.5 rounded bg-amber-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-40 transition-colors shadow-sm"
              >
                {appliedSuccess ? <Check className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                <span>{appliedSuccess ? 'Replaced!' : 'Find & Replace Across File'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
