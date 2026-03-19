import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Minus from 'lucide-react/dist/esm/icons/minus';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import {
  MONTH_NAMES,
  WEEK_DAYS,
  normalizeStr,
  PRE_NORMALIZED_DB,
  TRIP_OPTIONS,
  BUDGET_TIERS,
  getDaysInMonth
} from '../data/destinations';
import { openAiChat } from '../utils/aiChat';

interface SearchFormProps {
  onDestinationMatch: (city: string | null) => void;
}

type DestinationOption = typeof PRE_NORMALIZED_DB[number];
type TripOption = typeof TRIP_OPTIONS[number];
type BudgetTier = typeof BUDGET_TIERS[number];
type SearchPanelRefs = {
  destRef: React.RefObject<HTMLDivElement | null>;
  calendarRef: React.RefObject<HTMLDivElement | null>;
  guestDropdownRef: React.RefObject<HTMLDivElement | null>;
  tripTypeRef: React.RefObject<HTMLDivElement | null>;
  budgetRef: React.RefObject<HTMLDivElement | null>;
};

type CloseHandlers = {
  closeDestSuggestions: () => void;
  closeCalendar: () => void;
  closeGuestDropdown: () => void;
  closeTripTypeDropdown: () => void;
  closeBudgetDropdown: () => void;
};

const closeAllPanels = (handlers: CloseHandlers): void => {
  handlers.closeDestSuggestions();
  handlers.closeCalendar();
  handlers.closeGuestDropdown();
  handlers.closeTripTypeDropdown();
  handlers.closeBudgetDropdown();
};

const isDateInPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const formatDateDisplay = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getGuestSummary = (adults: number, children: number): string => {
  return `${adults} Adulto${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Chd` : ''}`;
};

const buildSearchMessage = (params: {
  inputValue: string;
  startDate: Date;
  endDate: Date | null;
  adults: number;
  children: number;
  childAges: string[];
  tripType: string;
  budget: string;
}): string => {
  const startStr = params.startDate.toLocaleDateString('pt-BR');
  const endStr = params.endDate ? params.endDate.toLocaleDateString('pt-BR') : 'A definir';
  const childAgesStr = params.children > 0
    ? ` (${params.childAges.map((age) => age ? `${age} anos` : 'Idade N/I').join(', ')})`
    : '';

  let message = 'Olá! Gostaria de um orçamento para minha próxima viagem:\n\n';
  message += `📍 *Destino:* ${params.inputValue}\n`;
  message += `📅 *Ida:* ${startStr}\n`;
  message += `📅 *Volta:* ${endStr}\n`;
  message += `👥 *Viajantes:* ${params.adults} Adt, ${params.children} Chd${childAgesStr}\n`;

  if (params.tripType) {
    message += `🎭 *Tipo de Viagem:* ${params.tripType}\n`;
  }

  if (params.budget) {
    const selectedBudget = BUDGET_TIERS.find((tier) => tier.label === params.budget);
    message += `💰 *Orçamento:* ${selectedBudget?.range || params.budget}\n`;
  }

  return message;
};

function useSearchFormDismiss(refs: SearchPanelRefs, handlers: CloseHandlers): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (refs.destRef.current && !refs.destRef.current.contains(target)) {
        handlers.closeDestSuggestions();
      }
      if (refs.calendarRef.current && !refs.calendarRef.current.contains(target)) {
        handlers.closeCalendar();
      }
      if (refs.guestDropdownRef.current && !refs.guestDropdownRef.current.contains(target)) {
        handlers.closeGuestDropdown();
      }
      if (refs.tripTypeRef.current && !refs.tripTypeRef.current.contains(target)) {
        handlers.closeTripTypeDropdown();
      }
      if (refs.budgetRef.current && !refs.budgetRef.current.contains(target)) {
        handlers.closeBudgetDropdown();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAllPanels(handlers);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [handlers, refs]);
}

interface DestinationFieldProps {
  destRef: React.RefObject<HTMLDivElement | null>;
  inputValue: string;
  showDestSuggestions: boolean;
  filteredDestinations: DestinationOption[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onSelect: (destination: DestinationOption) => void;
}

const DestinationField = memo(({
  destRef,
  inputValue,
  showDestSuggestions,
  filteredDestinations,
  onChange,
  onFocus,
  onSelect,
}: DestinationFieldProps) => {
  const hasSuggestions = filteredDestinations.length > 0;
  const shouldShowEmptyState = showDestSuggestions && inputValue.length > 1 && !hasSuggestions;

  return (
    <div
      className="w-full md:flex-[1.5] p-3 md:p-6 relative group text-left cursor-text hover:bg-gray-50/80 transition-all duration-300 rounded-t-[2rem] md:rounded-tl-[2rem] md:rounded-tr-none"
      ref={destRef}
    >
      <label htmlFor="destination-input" className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-focus-within:text-brand-cyan transition-colors">
        <MapPin className="w-3 h-3" /> Para onde?
      </label>
      <input
        id="destination-input"
        type="text"
        data-testid="destination-input"
        value={inputValue}
        onChange={onChange}
        onFocus={onFocus}
        placeholder="Ex: Orlando, Paris, Brasil..."
        className="w-full outline-none text-gray-800 font-bold placeholder-gray-300 bg-transparent text-lg md:text-xl truncate transition-colors"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDestSuggestions && hasSuggestions}
        aria-haspopup="listbox"
        aria-controls="destination-results"
      />
      {showDestSuggestions && hasSuggestions && (
        <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-gray-100 mt-4 overflow-hidden z-[60] animate-pop-in origin-top">
          <ul id="destination-results" role="listbox" className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredDestinations.map((dest) => (
              <li
                key={dest.label}
                role="option"
                aria-selected={false}
                onClick={() => onSelect(dest)}
                className="px-6 py-3 hover:bg-brand-light cursor-pointer text-left text-sm text-gray-700 font-medium border-b border-gray-50 last:border-0 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4 text-brand-cyan/50 shrink-0" />
                <span className="truncate">{dest.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {shouldShowEmptyState && (
        <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-gray-100 mt-4 p-4 z-[60] animate-pop-in origin-top">
          <p className="text-gray-400 text-sm font-medium text-center">Nenhum destino encontrado. Tente outra cidade ou país.</p>
        </div>
      )}
    </div>
  );
});
DestinationField.displayName = 'DestinationField';

interface DateFieldProps {
  calendarRef: React.RefObject<HTMLDivElement | null>;
  showCalendar: boolean;
  startDate: Date | null;
  endDate: Date | null;
  currentMonth: Date;
  calendarDays: Array<Date | null>;
  canGoToPreviousMonth: boolean;
  onToggle: () => void;
  onChangeMonth: (offset: number) => void;
  onDateClick: (date: Date) => void;
  isDateSelected: (date: Date) => boolean;
  isDateInRange: (date: Date) => boolean;
}

const DateField = memo(({
  calendarRef,
  showCalendar,
  startDate,
  endDate,
  currentMonth,
  calendarDays,
  canGoToPreviousMonth,
  onToggle,
  onChangeMonth,
  onDateClick,
  isDateSelected,
  isDateInRange,
}: DateFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={calendarRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-gray-50/80 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={showCalendar}
      aria-haspopup="grid"
      data-testid="dates-filter-btn"
    >
      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Calendar className="w-3 h-3" /> Quando?
      </span>
      <div className="flex items-center justify-between">
        <span className={`text-lg md:text-xl font-bold truncate transition-colors ${startDate ? "text-gray-800" : "text-gray-300"}`}>
          {startDate ? `${formatDateDisplay(startDate)} - ${endDate ? formatDateDisplay(endDate) : '...'}` : "Definir datas"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {showCalendar && (
      <div onClick={(event) => event.stopPropagation()} className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-4 p-6 z-[60] w-full md:w-80 cursor-default animate-pop-in origin-top">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            disabled={!canGoToPreviousMonth}
            className={`p-1 rounded-full transition-colors ${canGoToPreviousMonth ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-800">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button type="button" onClick={() => onChangeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Próximo mês">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-400">
          {WEEK_DAYS.map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;

            const selected = isDateSelected(date);
            const inRange = isDateInRange(date);
            const past = isDateInPast(date);

            return (
              <button
                key={`${date.toISOString()}-${index}`}
                type="button"
                onClick={() => onDateClick(date)}
                disabled={past}
                aria-disabled={past}
                className={`h-9 w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-all duration-200 border-2
                  ${past ? 'border-transparent text-gray-300 cursor-not-allowed' : selected ? 'bg-brand-cyan border-brand-cyan text-white font-bold scale-110' : inRange ? 'bg-brand-light border-transparent text-brand-cyan font-bold' : 'border-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
));
DateField.displayName = 'DateField';

interface GuestsFieldProps {
  guestDropdownRef: React.RefObject<HTMLDivElement | null>;
  showGuestDropdown: boolean;
  guestSummary: string;
  adults: number;
  children: number;
  childAges: string[];
  onToggle: () => void;
  onAdultsChange: (nextValue: number) => void;
  onChildCountChange: (operation: 'add' | 'remove') => void;
  onChildAgeChange: (index: number, value: string) => void;
  onClose: () => void;
}

const GuestsField = memo(({
  guestDropdownRef,
  showGuestDropdown,
  guestSummary,
  adults,
  children,
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
      className="w-full p-3 md:p-6 text-left hover:bg-gray-50/80 transition-all duration-300 md:rounded-tr-[2rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={showGuestDropdown}
      aria-haspopup="true"
      data-testid="guests-filter-btn"
    >
      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <User className="w-3 h-3" /> Quem vai?
      </span>
      <div className="flex items-center justify-between">
        <span className="text-lg md:text-xl font-bold text-gray-800 truncate transition-colors">{guestSummary}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showGuestDropdown ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {showGuestDropdown && (
      <div onClick={(event) => event.stopPropagation()} className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-4 p-6 z-[60] w-full md:w-72 cursor-default animate-pop-in origin-top">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-gray-800">Adultos</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAdultsChange(Math.max(1, adults - 1)); }}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
              aria-label="Remover um adulto"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold w-8 text-center text-gray-900" aria-live="polite">{adults}</span>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAdultsChange(adults + 1); }}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
              aria-label="Adicionar um adulto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-gray-800">Crianças</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChildCountChange('remove'); }}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
              aria-label="Remover uma criança"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold w-8 text-center text-gray-900" aria-live="polite">{children}</span>
            <button
              type="button"
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChildCountChange('add'); }}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
              aria-label="Adicionar uma criança"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {children > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar animate-fade-in-up">
            {childAges.map((age, index) => (
              <div key={`child-age-${index}`} className="flex flex-col">
                <label htmlFor={`child-age-input-${index}`} className="text-[10px] text-gray-400 font-bold mb-1">Idade Criança {index + 1}</label>
                <input
                  id={`child-age-input-${index}`}
                  type="number"
                  min="0"
                  max="17"
                  value={age}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChildAgeChange(index, event.target.value)}
                  className="w-full border-2 border-gray-100 rounded-lg px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:border-brand-cyan transition-colors"
                  placeholder="Ex: 5"
                />
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} className="w-full mt-2 bg-brand-cyan text-white rounded-xl py-3 font-bold hover:bg-brand-cyanDark transition-all active:scale-95 shadow-[0_4px_0px_#0284c7] hover:shadow-[0_2px_0px_#0284c7] hover:translate-y-[2px]">Pronto</button>
      </div>
    )}
  </div>
));
GuestsField.displayName = 'GuestsField';

interface TripTypeFieldProps {
  tripTypeRef: React.RefObject<HTMLDivElement | null>;
  showTripTypeDropdown: boolean;
  tripType: string;
  selectedTripObj?: TripOption;
  onToggle: () => void;
  onSelect: (label: string) => void;
}

const TripTypeField = memo(({
  tripTypeRef,
  showTripTypeDropdown,
  tripType,
  selectedTripObj,
  onToggle,
  onSelect,
}: TripTypeFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={tripTypeRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-gray-50/80 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={showTripTypeDropdown}
      aria-haspopup="true"
      data-testid="trip-type-filter-btn"
    >
      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Briefcase className="w-3 h-3" /> Tipo de Viagem
      </span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedTripObj && (
            <selectedTripObj.icon className={`w-5 h-5 ${selectedTripObj.color}`} />
          )}
          <span className={`text-lg md:text-lg font-bold truncate transition-colors ${tripType ? "text-gray-800" : "text-gray-300"}`}>
            {tripType || "Lazer, Lua de Mel..."}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showTripTypeDropdown ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {showTripTypeDropdown && (
      <div onClick={(event) => event.stopPropagation()} className="absolute top-full left-0 w-full md:w-[400px] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-3">
          {TRIP_OPTIONS.map((type) => (
            <button
              key={type.label}
              type="button"
              onClick={() => onSelect(type.label)}
              className={`flex flex-col items-start gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-left
                ${tripType === type.label ? 'bg-brand-light border-brand-cyan shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
            >
              <div className={`p-2 rounded-xl ${type.bg} ${type.color}`}>
                <type.icon className="w-5 h-5" />
              </div>
              <span className={`font-bold text-base ${tripType === type.label ? 'text-brand-dark' : 'text-gray-600'}`}>
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

interface BudgetFieldProps {
  budgetRef: React.RefObject<HTMLDivElement | null>;
  showBudgetDropdown: boolean;
  budget: string;
  selectedBudgetObj?: BudgetTier;
  onToggle: () => void;
  onSelect: (label: string) => void;
}

const BudgetField = memo(({
  budgetRef,
  showBudgetDropdown,
  budget,
  selectedBudgetObj,
  onToggle,
  onSelect,
}: BudgetFieldProps) => (
  <div className="w-full md:flex-1 relative group" ref={budgetRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-3 md:p-6 text-left hover:bg-gray-50/80 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={showBudgetDropdown}
      aria-haspopup="true"
      data-testid="budget-filter-btn"
    >
      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Wallet className="w-3 h-3" /> Orçamento Aprox.
      </span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedBudgetObj && (
            <div className="flex text-green-600 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded-md">
              {Array.from({ length: selectedBudgetObj.level }, (_, index) => <span key={`selected-budget-${index}`}>$</span>)}
            </div>
          )}
          <span className={`text-lg md:text-lg font-bold truncate transition-colors ${budget ? "text-gray-800" : "text-gray-300"}`}>
            {budget || "Definir padrão"}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showBudgetDropdown ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {showBudgetDropdown && (
      <div onClick={(event) => event.stopPropagation()} className="absolute top-full left-0 w-full md:w-[320px] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-3">
        {BUDGET_TIERS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelect(option.label)}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-200 mb-2 last:mb-0
              ${budget === option.label ? 'bg-brand-light border-brand-cyan shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
          >
            <div className={`p-2 rounded-xl bg-gray-100 text-gray-600 ${budget === option.label ? 'bg-brand-vibrant text-white' : ''}`}>
              <option.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base ${budget === option.label ? 'text-brand-dark' : 'text-gray-800'}`}>
                  {option.label}
                </span>
                <div className="flex text-[10px] font-black text-green-600 bg-green-50 px-1.5 rounded">
                  {Array.from({ length: option.level }, (_, index) => <span key={`budget-level-${option.label}-${index}`}>$</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400 font-medium">{option.desc}</span>
                <span className="text-xs text-gray-500 font-semibold">•</span>
                <span className="text-sm text-gray-600 font-semibold">{option.range}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
));
BudgetField.displayName = 'BudgetField';

interface SearchButtonProps {
  isSearchLoading: boolean;
}

const SearchButton = memo(({ isSearchLoading }: SearchButtonProps) => (
  <div className="p-2 w-full md:w-auto flex-shrink-0">
    <button
      type="submit"
      disabled={isSearchLoading}
      data-testid="submit-search-btn"
      className="btn-specialist w-full md:w-auto h-full min-h-[70px] bg-brand-yellow hover:bg-yellow-400 text-brand-dark rounded-2xl md:rounded-[1.5rem] shadow-lg flex items-center justify-center gap-2 px-6 transition-all duration-300 ease-spring hover:scale-105 hover:shadow-xl active:scale-90 group border-2 border-transparent whitespace-nowrap"
      data-tracking="hero-home"
    >
      {isSearchLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <>
          <Search className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 ease-spring" strokeWidth={2.5} />
          <span className="font-black text-lg">Planejar Viagem</span>
        </>
      )}
    </button>
  </div>
));
SearchButton.displayName = 'SearchButton';

const SearchForm = memo(({ onDestinationMatch }: SearchFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [tripType, setTripType] = useState('');
  const [showTripTypeDropdown, setShowTripTypeDropdown] = useState(false);
  const [budget, setBudget] = useState('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tripTypeRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  const panelRefs = useMemo<SearchPanelRefs>(() => ({
    destRef,
    calendarRef,
    guestDropdownRef,
    tripTypeRef,
    budgetRef,
  }), []);

  const closeHandlers = useMemo<CloseHandlers>(() => ({
    closeDestSuggestions: () => setShowDestSuggestions(false),
    closeCalendar: () => setShowCalendar(false),
    closeGuestDropdown: () => setShowGuestDropdown(false),
    closeTripTypeDropdown: () => setShowTripTypeDropdown(false),
    closeBudgetDropdown: () => setShowBudgetDropdown(false),
  }), []);

  useSearchFormDismiss(panelRefs, closeHandlers);

  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const filteredDestinations = useMemo(() => {
    if (!inputValue) return [];
    const search = normalizeStr(inputValue);
    return PRE_NORMALIZED_DB.filter((destination) => destination.nLabel.includes(search)).slice(0, 8);
  }, [inputValue]);

  const guestSummary = useMemo(() => getGuestSummary(adults, children), [adults, children]);
  const selectedTripObj = useMemo(() => TRIP_OPTIONS.find((option) => option.label === tripType), [tripType]);
  const selectedBudgetObj = useMemo(() => BUDGET_TIERS.find((tier) => tier.label === budget), [budget]);

  const handleDestinationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setShowDestSuggestions(true);

    const search = normalizeStr(value);
    const exactMatch = PRE_NORMALIZED_DB.find((destination) => (
      destination.nLabel === search || destination.nCity === search
    ));

    onDestinationMatch(exactMatch ? exactMatch.city : null);
  }, [onDestinationMatch]);

  const handleDestinationSelect = useCallback((destination: DestinationOption) => {
    setInputValue(destination.label);
    onDestinationMatch(destination.city);
    setShowDestSuggestions(false);
  }, [onDestinationMatch]);

  const handleChildCountChange = useCallback((operation: 'add' | 'remove') => {
    if (operation === 'add') {
      setChildren((previous) => previous + 1);
      setChildAges((previous) => [...previous, '']);
      return;
    }

    setChildren((previous) => (previous > 0 ? previous - 1 : 0));
    setChildAges((previous) => (previous.length > 0 ? previous.slice(0, -1) : []));
  }, []);

  const handleChildAgeChange = useCallback((index: number, value: string) => {
    setChildAges((previous) => {
      const nextAges = [...previous];
      nextAges[index] = value;
      return nextAges;
    });
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    if (isDateInPast(date)) return;

    if (!startDate || endDate) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    if (date < startDate) {
      setStartDate(date);
      setEndDate(startDate);
      return;
    }

    setEndDate(date);
    setShowCalendar(false);
  }, [startDate, endDate]);

  const isDateSelected = useCallback((date: Date) => {
    if (!startDate) return false;
    if (startDate.toDateString() === date.toDateString()) return true;
    return !!endDate && endDate.toDateString() === date.toDateString();
  }, [startDate, endDate]);

  const isDateInRange = useCallback((date: Date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  }, [startDate, endDate]);

  const handleMonthChange = useCallback((offset: number) => {
    setCurrentMonth((prevMonth) => {
        const nextMonth = new Date(prevMonth);
        nextMonth.setMonth(nextMonth.getMonth() + offset);

        const today = new Date();
        const nextYear = nextMonth.getFullYear();
        const nextMonthIndex = nextMonth.getMonth();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth();

        if (nextYear < currentYear || (nextYear === currentYear && nextMonthIndex < currentMonthIndex)) {
            return prevMonth;
        }

        return nextMonth;
    });
  }, []);

  const canGoToPreviousMonth = useMemo(() => {
    const today = new Date();
    return currentMonth.getFullYear() > today.getFullYear()
      || (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());
  }, [currentMonth]);

  const handleTripTypeSelect = useCallback((label: string) => {
    setTripType(label);
    setShowTripTypeDropdown(false);
  }, []);

  const handleBudgetSelect = useCallback((label: string) => {
    setBudget(label);
    setShowBudgetDropdown(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) {
      alert("Por favor, informe o destino.");
      return;
    }

    if (!startDate) {
      alert("Por favor, selecione a data de ida.");
      setShowCalendar(true);
      return;
    }

    setIsSearchLoading(true);
    openAiChat({
      message: buildSearchMessage({
        inputValue,
        startDate,
        endDate,
        adults,
        children,
        childAges,
        tripType,
        budget,
      }),
    });

    setTimeout(() => {
      setIsSearchLoading(false);
    }, 1000);
  }, [inputValue, startDate, endDate, adults, children, childAges, tripType, budget]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    handleSearch();
  }, [handleSearch]);

  const toggleCalendar = useCallback(() => setShowCalendar((prev) => !prev), []);
  const toggleGuestDropdown = useCallback(() => setShowGuestDropdown((prev) => !prev), []);
  const closeGuestDropdown = useCallback(() => setShowGuestDropdown(false), []);
  const toggleTripTypeDropdown = useCallback(() => setShowTripTypeDropdown((prev) => !prev), []);
  const toggleBudgetDropdown = useCallback(() => setShowBudgetDropdown((prev) => !prev), []);
  const onDestinationFocus = useCallback(() => setShowDestSuggestions(true), []);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-2 relative z-50 border-[6px] border-white/20 backdrop-blur-sm flex flex-col"
    >
      <div className="flex flex-col md:flex-row items-center w-full divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <DestinationField
          destRef={destRef}
          inputValue={inputValue}
          showDestSuggestions={showDestSuggestions}
          filteredDestinations={filteredDestinations}
          onChange={handleDestinationChange}
          onFocus={onDestinationFocus}
          onSelect={handleDestinationSelect}
        />
        <DateField
          calendarRef={calendarRef}
          showCalendar={showCalendar}
          startDate={startDate}
          endDate={endDate}
          currentMonth={currentMonth}
          calendarDays={calendarDays}
          canGoToPreviousMonth={canGoToPreviousMonth}
          onToggle={toggleCalendar}
          onChangeMonth={handleMonthChange}
          onDateClick={handleDateClick}
          isDateSelected={isDateSelected}
          isDateInRange={isDateInRange}
        />
        <GuestsField
          guestDropdownRef={guestDropdownRef}
          showGuestDropdown={showGuestDropdown}
          guestSummary={guestSummary}
          adults={adults}
          children={children}
          childAges={childAges}
          onToggle={toggleGuestDropdown}
          onAdultsChange={setAdults}
          onChildCountChange={handleChildCountChange}
          onChildAgeChange={handleChildAgeChange}
          onClose={closeGuestDropdown}
        />
      </div>

      <div className="w-full h-[2px] border-t-2 border-dashed border-gray-200 relative my-1">
        <div className="absolute left-[-16px] top-[-8px] w-4 h-4 bg-brand-light rounded-full"></div>
        <div className="absolute right-[-16px] top-[-8px] w-4 h-4 bg-brand-light rounded-full"></div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch w-full divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <TripTypeField
          tripTypeRef={tripTypeRef}
          showTripTypeDropdown={showTripTypeDropdown}
          tripType={tripType}
          selectedTripObj={selectedTripObj}
          onToggle={toggleTripTypeDropdown}
          onSelect={handleTripTypeSelect}
        />
        <BudgetField
          budgetRef={budgetRef}
          showBudgetDropdown={showBudgetDropdown}
          budget={budget}
          selectedBudgetObj={selectedBudgetObj}
          onToggle={toggleBudgetDropdown}
          onSelect={handleBudgetSelect}
        />
        <SearchButton isSearchLoading={isSearchLoading} />
      </div>
    </form>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;
