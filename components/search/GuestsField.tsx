import { memo } from 'react';
import { ChevronDown, Plus, Minus, User } from 'lucide-react';

interface GuestsFieldProps {
  guestDropdownRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  guestSummary: string;
  adults: number;
  childrenCount: number;
  childAges: string[];
  onToggle: () => void;
  onAdultsChange: (nextValue: number) => void;
  onChildCountChange: (operation: 'add' | 'remove') => void;
  onChildAgeChange: (index: number, value: string) => void;
  onClose: () => void;
}

const GuestsField = memo(({
  guestDropdownRef,
  isOpen,
  guestSummary,
  adults,
  childrenCount,
  childAges,
  onToggle,
  onAdultsChange,
  onChildCountChange,
  onChildAgeChange,
  onClose,
}: GuestsFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={guestDropdownRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 md:rounded-tr-[2rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={isOpen}
      aria-haspopup="true"
      data-testid="guests-filter-btn"
    >
      <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <User className="size-3" /> Quem vai?
      </span>
      <div className="flex items-center justify-between">
        <span className="text-lg md:text-xl font-bold text-zinc-800 truncate transition-colors">{guestSummary}</span>
        <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {isOpen && (
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation" className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-zinc-100 mt-4 p-6 z-[60] w-full md:w-72 cursor-default animate-pop-in origin-top">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-zinc-800">Adultos</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAdultsChange(Math.max(1, adults - 1)); }}
              disabled={adults <= 1}
              className="size-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-brand-cyan hover:text-brand-cyan transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Remover um adulto"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-bold w-8 text-center text-zinc-900" aria-live="polite">{adults}</span>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAdultsChange(adults + 1); }}
              className="size-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-brand-cyan hover:text-brand-cyan transition"
              aria-label="Adicionar um adulto"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-zinc-800">Crianças</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChildCountChange('remove'); }}
              disabled={childrenCount <= 0}
              className="size-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-brand-cyan hover:text-brand-cyan transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Remover uma criança"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-bold w-8 text-center text-zinc-900" aria-live="polite">{childrenCount}</span>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChildCountChange('add'); }}
              className="size-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-brand-cyan hover:text-brand-cyan transition"
              aria-label="Adicionar uma criança"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {childrenCount > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar animate-fade-in-up">
            {childAges.map((age, i) => (
              <div key={`child-age-${i + 1}`} className="flex flex-col">
                <label htmlFor={`child-age-input-${i + 1}`} className="text-[10px] text-zinc-400 font-bold mb-1">Idade Criança {i + 1}</label>
                <input
                  id={`child-age-input-${i + 1}`}
                  type="number"
                  min="0"
                  max="17"
                  value={age}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChildAgeChange(i, event.target.value)}
                  className="w-full border-2 border-zinc-100 rounded-lg px-2 py-1 text-sm font-bold text-zinc-700 outline-none focus:border-brand-cyan transition-colors"
                  placeholder="Ex: 5"
                />
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} className="w-full mt-2 bg-brand-cyan text-white rounded-xl py-3 font-bold hover:bg-brand-cyanDark transition active:scale-95 shadow-[0_4px_0px_#0284c7] hover:shadow-[0_2px_0px_#0284c7] hover:translate-y-[2px]">Pronto</button>
      </div>
    )}
  </div>
));
GuestsField.displayName = 'GuestsField';

export default GuestsField;
