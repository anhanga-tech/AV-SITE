import { memo } from 'react';
import { MapPin, X } from 'lucide-react';
import type { DestinationOption } from './types';

interface DestinationFieldProps {
  destRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  isOpen: boolean;
  filteredDestinations: DestinationOption[];
  activeSuggestionIndex: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelect: (destination: DestinationOption) => void;
  onClear: () => void;
}

const DestinationField = memo(({
  destRef,
  inputRef,
  inputValue,
  isOpen,
  filteredDestinations,
  activeSuggestionIndex,
  onChange,
  onFocus,
  onKeyDown,
  onSelect,
  onClear,
}: DestinationFieldProps) => {
  const hasSuggestions = filteredDestinations.length > 0;
  const shouldShowEmptyState = isOpen && inputValue.length > 1 && !hasSuggestions;

  return (
    <div
      className="w-full md:flex-[1.5] p-3 md:p-6 relative group text-left cursor-text hover:bg-zinc-50/80 transition duration-300 rounded-t-[2rem] md:rounded-tl-[2rem] md:rounded-tr-none"
      ref={destRef}
    >
      <label htmlFor="destination-input" className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-focus-within:text-brand-cyan transition-colors">
        <MapPin className="size-3" /> Para onde?
      </label>
      <div className="relative flex items-center">
        <input
          id="destination-input"
          ref={inputRef}
          type="text"
          data-testid="destination-input"
          value={inputValue}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder="Ex: Orlando, Paris, Brasil..."
          className="w-full outline-none text-zinc-800 font-bold placeholder-zinc-300 bg-transparent text-lg md:text-xl truncate transition-colors pr-8"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && hasSuggestions}
          aria-haspopup="listbox"
          aria-controls="destination-results"
          aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
        />
        {inputValue && (
          <button
            type="button"
            // Prevent the input from blurring on press so the mobile keyboard
            // stays open when clearing the destination.
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-0 p-1 text-zinc-400 hover:text-brand-vibrant transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-vibrant"
            aria-label="Limpar destino"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {isOpen && hasSuggestions && (
        <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-zinc-100 mt-4 overflow-hidden z-[60] animate-pop-in origin-top">
          <div id="destination-results" role="listbox" className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredDestinations.map((dest, index) => (
              <div
                key={dest.label}
                id={`suggestion-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={index === activeSuggestionIndex}
                onClick={() => onSelect(dest)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(dest); }}
                className={`px-6 py-3 cursor-pointer text-left text-sm font-medium border-b border-zinc-50 last:border-0 flex items-center gap-2 transition-colors ${
                  index === activeSuggestionIndex ? 'bg-brand-light text-brand-cyan' : 'hover:bg-brand-light text-zinc-700'
                }`}
              >
                <MapPin className={`size-4 shrink-0 ${index === activeSuggestionIndex ? 'text-brand-cyan' : 'text-brand-cyan/50'}`} />
                <span className="truncate">{dest.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {shouldShowEmptyState && (
        <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-zinc-100 mt-4 p-4 z-[60] animate-pop-in origin-top">
          <p className="text-zinc-400 text-sm font-medium text-center">Nenhum destino encontrado. Tente outra cidade ou país.</p>
        </div>
      )}
    </div>
  );
});
DestinationField.displayName = 'DestinationField';

export default DestinationField;
