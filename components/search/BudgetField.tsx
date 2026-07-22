import { memo } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { BUDGET_TIERS } from '../../data/destinations';
import type { BudgetTier } from './types';

interface BudgetFieldProps {
  budgetRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  budget: string;
  selectedBudgetObj?: BudgetTier;
  onToggle: () => void;
  onSelect: (label: string) => void;
}

const BudgetField = memo(({
  budgetRef,
  isOpen,
  budget,
  selectedBudgetObj,
  onToggle,
  onSelect,
}: BudgetFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={budgetRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={isOpen}
      aria-haspopup="true"
      data-testid="budget-filter-btn"
    >
      <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Wallet className="size-3" /> Orçamento Aprox.
      </span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedBudgetObj && (
            <div className="flex text-green-600 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded-md">
              <span>{'$'.repeat(selectedBudgetObj.level)}</span>
            </div>
          )}
          <span className={`text-lg md:text-lg font-bold truncate transition-colors ${budget ? "text-zinc-800" : "text-zinc-500"}`}>
            {budget || "Definir padrão"}
          </span>
        </div>
        <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {isOpen && (
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation" className="absolute top-full left-0 w-full md:w-[320px] bg-white rounded-3xl shadow-2xl border-2 border-zinc-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-3">
        {BUDGET_TIERS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelect(option.label)}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition duration-200 mb-2 last:mb-0
              ${budget === option.label ? 'bg-brand-light border-brand-cyan shadow-sm' : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
          >
            <div className={`p-2 rounded-xl bg-zinc-100 text-zinc-600 ${budget === option.label ? 'bg-brand-vibrant text-white' : ''}`}>
              <option.icon className="size-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base ${budget === option.label ? 'text-brand-dark' : 'text-zinc-800'}`}>
                  {option.label}
                </span>
                <div className="flex text-[10px] font-black text-green-600 bg-green-50 px-1.5 rounded">
                  <span>{'$'.repeat(option.level)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-zinc-400 font-medium">{option.desc}</span>
                <span className="text-xs text-zinc-500 font-semibold">•</span>
                <span className="text-sm text-zinc-600 font-semibold">{option.range}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
));
BudgetField.displayName = 'BudgetField';

export default BudgetField;
