import { memo } from 'react';
import { ChevronDown, Briefcase } from 'lucide-react';
import { TRIP_OPTIONS } from '../../data/destinations';
import type { TripOption } from './types';

interface TripTypeFieldProps {
  tripTypeRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  tripType: string;
  selectedTripObj?: TripOption;
  onToggle: () => void;
  onSelect: (label: string) => void;
}

const TripTypeField = memo(({
  tripTypeRef,
  isOpen,
  tripType,
  selectedTripObj,
  onToggle,
  onSelect,
}: TripTypeFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={tripTypeRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={isOpen}
      aria-haspopup="true"
      data-testid="trip-type-filter-btn"
    >
      <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Briefcase className="size-3" /> Tipo de Viagem
      </span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedTripObj && (
            <selectedTripObj.icon className={`size-5 ${selectedTripObj.color}`} />
          )}
          <span className={`text-lg md:text-lg font-bold truncate transition-colors ${tripType ? "text-zinc-800" : "text-zinc-500"}`}>
            {tripType || "Lazer, Lua de Mel..."}
          </span>
        </div>
        <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {isOpen && (
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation" className="absolute top-full left-0 w-full md:w-[400px] bg-white rounded-3xl shadow-2xl border-2 border-zinc-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-3">
          {TRIP_OPTIONS.map((type) => (
            <button
              key={type.label}
              type="button"
              onClick={() => onSelect(type.label)}
              className={`flex flex-col items-start gap-2 p-3 rounded-2xl border-2 transition duration-200 text-left
                ${tripType === type.label ? 'bg-brand-light border-brand-cyan shadow-sm' : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
            >
              <div className={`p-2 rounded-xl ${type.bg} ${type.color}`}>
                <type.icon className="size-5" />
              </div>
              <span className={`font-bold text-base ${tripType === type.label ? 'text-brand-dark' : 'text-zinc-600'}`}>
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
));
TripTypeField.displayName = 'TripTypeField';

export default TripTypeField;
