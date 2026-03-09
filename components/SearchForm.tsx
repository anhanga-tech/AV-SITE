import React, { useState, useRef, useMemo, useEffect } from 'react';
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

const SearchForm: React.FC<SearchFormProps> = ({ onDestinationMatch }) => {
  // State for Destination
  const [inputValue, setInputValue] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // State for Dates (Custom Calendar)
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for Guests
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);

  // State for Advanced Filters
  const [tripType, setTripType] = useState('');
  const [showTripTypeDropdown, setShowTripTypeDropdown] = useState(false);

  const [budget, setBudget] = useState('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);

  // Search Loading State
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Refs for click outside handling
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tripTypeRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  // Single effect to handle all dropdown close-on-outside-click/escape logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
      if (tripTypeRef.current && !tripTypeRef.current.contains(event.target as Node)) {
        setShowTripTypeDropdown(false);
      }
      if (budgetRef.current && !budgetRef.current.contains(event.target as Node)) {
        setShowBudgetDropdown(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDestSuggestions(false);
        setShowCalendar(false);
        setShowGuestDropdown(false);
        setShowTripTypeDropdown(false);
        setShowBudgetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Memoize calendar days
  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  // Filter Destinations Logic
  const filteredDestinations = useMemo(() => {
    if (!inputValue) return [];
    const search = normalizeStr(inputValue);
    return PRE_NORMALIZED_DB.filter(d =>
      d.nLabel.includes(search)
    ).slice(0, 8);
  }, [inputValue]);

  // Handle Input Change with strict validation for H1
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowDestSuggestions(true);

    const search = normalizeStr(val);
    const exactMatch = PRE_NORMALIZED_DB.find(d =>
      d.nLabel === search ||
      d.nCity === search
    );

    onDestinationMatch(exactMatch ? exactMatch.city : null);
  };

  // Handle Selection from Dropdown
  const selectDestination = (dest: { label: string, city: string }) => {
    setInputValue(dest.label);
    onDestinationMatch(dest.city);
    setShowDestSuggestions(false);
  };

  // Handlers for Guest Logic
  const handleChildChange = (operation: 'add' | 'remove') => {
    if (operation === 'add') {
      setChildren(prev => prev + 1);
      setChildAges(prev => [...prev, '']);
    } else {
      setChildren(prev => (prev > 0 ? prev - 1 : 0));
      setChildAges(prev => (prev.length > 0 ? prev.slice(0, -1) : []));
    }
  };

  const handleChildAgeChange = (index: number, value: string) => {
    const newAges = [...childAges];
    newAges[index] = value;
    setChildAges(newAges);
  };

  const guestSummary = `${adults} Adulto${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Chd` : ''}`;

  // Helper to check if a date is in the past
  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isDateInPast(date)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
        setShowCalendar(false);
      }
    }
  };

  const isDateSelected = (date: Date) => {
    if (!startDate) return false;
    if (startDate.toDateString() === date.toDateString()) return true;
    if (endDate && endDate.toDateString() === date.toDateString()) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    const today = new Date();
    if (newDate.getFullYear() < today.getFullYear() ||
        (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() < today.getMonth())) {
      return;
    }
    setCurrentMonth(newDate);
  };

  const canGoToPreviousMonth = () => {
    const today = new Date();
    return currentMonth.getFullYear() > today.getFullYear() ||
           (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());
  };

  const selectedTripObj = TRIP_OPTIONS.find(t => t.label === tripType);
  const selectedBudgetObj = BUDGET_TIERS.find(b => b.label === budget);

  const handleSearch = () => {
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

    const startStr = startDate.toLocaleDateString('pt-BR');
    const endStr = endDate ? endDate.toLocaleDateString('pt-BR') : 'A definir';
    const childAgesStr = children > 0
      ? ` (${childAges.map(a => a ? `${a} anos` : 'Idade N/I').join(', ')})`
      : '';

    let message = `Olá! Gostaria de um orçamento para minha próxima viagem:\n\n`;
    message += `📍 *Destino:* ${inputValue}\n`;
    message += `📅 *Ida:* ${startStr}\n`;
    message += `📅 *Volta:* ${endStr}\n`;
    message += `👥 *Viajantes:* ${adults} Adt, ${children} Chd${childAgesStr}\n`;

    if (tripType) message += `🎭 *Tipo de Viagem:* ${tripType}\n`;
    if (budget) {
      const selectedBudgetObj = BUDGET_TIERS.find(b => b.label === budget);
      const budgetValue = selectedBudgetObj?.range || budget;
      message += `💰 *Orçamento:* ${budgetValue}\n`;
    }

    openAiChat({ message });

    setTimeout(() => {
      setIsSearchLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-2 relative z-50 border-[6px] border-white/20 backdrop-blur-sm flex flex-col"
    >
      {/* --- ROW 1: BASIC INFO --- */}
      <div className="flex flex-col md:flex-row items-center w-full divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* 1. Destination */}
        <div className="w-full md:flex-[1.5] p-3 md:p-6 relative group text-left cursor-text hover:bg-gray-50/80 transition-all duration-300 rounded-t-[2rem] md:rounded-tl-[2rem] md:rounded-tr-none" ref={destRef}>
          <label htmlFor="destination-input" className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-focus-within:text-brand-cyan transition-colors">
            <MapPin className="w-3 h-3" /> Para onde?
          </label>
          <input
            id="destination-input"
            type="text"
            data-testid="destination-input"
            value={inputValue}
            onChange={handleDestinationChange}
            onFocus={() => setShowDestSuggestions(true)}
            placeholder="Ex: Orlando, Paris, Brasil..."
            className="w-full outline-none text-gray-800 font-bold placeholder-gray-300 bg-transparent text-lg md:text-xl truncate transition-colors"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDestSuggestions && filteredDestinations.length > 0}
            aria-haspopup="listbox"
            aria-controls="destination-results"
          />
          {showDestSuggestions && filteredDestinations.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-gray-100 mt-4 overflow-hidden z-[60] animate-pop-in origin-top">
              <ul id="destination-results" role="listbox" className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredDestinations.map((dest, idx) => (
                  <li
                    key={idx}
                    role="option"
                    aria-selected={false}
                    onClick={() => selectDestination(dest)}
                    className="px-6 py-3 hover:bg-brand-light cursor-pointer text-left text-sm text-gray-700 font-medium border-b border-gray-50 last:border-0 flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-brand-cyan/50 shrink-0" />
                    <span className="truncate">{dest.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showDestSuggestions && inputValue.length > 1 && filteredDestinations.length === 0 && (
            <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-xl border-2 border-gray-100 mt-4 p-4 z-[60] animate-pop-in origin-top">
              <p className="text-gray-400 text-sm font-medium text-center">Nenhum destino encontrado. Tente outra cidade ou país.</p>
            </div>
          )}
        </div>

        {/* 2. Dates */}
        <div className="w-full md:flex-1 relative group" ref={calendarRef}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
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
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-4 p-6 z-[60] w-full md:w-80 cursor-default animate-pop-in origin-top">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  disabled={!canGoToPreviousMonth()}
                  className={`p-1 rounded-full transition-colors ${canGoToPreviousMonth() ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-gray-800">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Próximo mês"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-400">
                {WEEK_DAYS.map((day, i) => <div key={i}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const isSelected = isDateSelected(date);
                  const inRange = isDateInRange(date);
                  const isPast = isDateInPast(date);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleDateClick(date)}
                      disabled={isPast}
                      aria-disabled={isPast}
                      className={`h-9 w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-all duration-200 border-2
                                    ${isPast ? 'border-transparent text-gray-300 cursor-not-allowed' : isSelected ? 'bg-brand-cyan border-brand-cyan text-white font-bold scale-110' : inRange ? 'bg-brand-light border-transparent text-brand-cyan font-bold' : 'border-transparent text-gray-600 hover:bg-gray-100'}
                                  `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Guests */}
        <div className="w-full md:flex-1 relative group" ref={guestDropdownRef}>
          <button
            type="button"
            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
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
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-4 p-6 z-[60] w-full md:w-72 cursor-default animate-pop-in origin-top">
              <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-gray-800">Adultos</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAdults(prev => Math.max(1, prev - 1)); }}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                    aria-label="Remover um adulto"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center text-gray-900" aria-live="polite">{adults}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAdults(prev => prev + 1); }}
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
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChildChange('remove'); }}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                    aria-label="Remover uma criança"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center text-gray-900" aria-live="polite">{children}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChildChange('add'); }}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                    aria-label="Adicionar uma criança"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {children > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar animate-fade-in-up">
                  {childAges.map((age, idx) => (
                    <div key={idx} className="flex flex-col">
                      <label className="text-[10px] text-gray-400 font-bold mb-1">Idade Criança {idx + 1}</label>
                      <input
                        type="number"
                        min="0"
                        max="17"
                        value={age}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-lg px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:border-brand-cyan transition-colors"
                        placeholder="Ex: 5"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setShowGuestDropdown(false)} className="w-full mt-2 bg-brand-cyan text-white rounded-xl py-3 font-bold hover:bg-brand-cyanDark transition-all active:scale-95 shadow-[0_4px_0px_#0284c7] hover:shadow-[0_2px_0px_#0284c7] hover:translate-y-[2px]">Pronto</button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-[2px] border-t-2 border-dashed border-gray-200 relative my-1">
        <div className="absolute left-[-16px] top-[-8px] w-4 h-4 bg-brand-light rounded-full"></div>
        <div className="absolute right-[-16px] top-[-8px] w-4 h-4 bg-brand-light rounded-full"></div>
      </div>

      {/* --- ROW 2: ADVANCED FILTERS + SEARCH --- */}
      <div className="flex flex-col md:flex-row items-stretch w-full divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* 4. Trip Type */}
        <div className="w-full md:flex-1 relative group" ref={tripTypeRef}>
          <button
            type="button"
            onClick={() => setShowTripTypeDropdown(!showTripTypeDropdown)}
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
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 w-full md:w-[400px] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-4">
              <div className="grid grid-cols-2 gap-3">
                {TRIP_OPTIONS.map((type, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setTripType(type.label); setShowTripTypeDropdown(false); }}
                    className={`
                                          flex flex-col items-start gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-left
                                          ${tripType === type.label
                        ? 'bg-brand-light border-brand-cyan shadow-sm'
                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }
                                      `}
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

        {/* 5. Budget */}
        <div className="w-full md:flex-1 relative group" ref={budgetRef}>
          <button
            type="button"
            onClick={() => setShowBudgetDropdown(!showBudgetDropdown)}
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
                    {[...Array(selectedBudgetObj.level)].map((_, i) => <span key={i}>$</span>)}
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
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 w-full md:w-[320px] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 mt-2 z-[60] animate-pop-in origin-top overflow-hidden p-3">
              {BUDGET_TIERS.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setBudget(opt.label); setShowBudgetDropdown(false); }}
                  className={`
                                      w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-200 mb-2 last:mb-0
                                      ${budget === opt.label
                      ? 'bg-brand-light border-brand-cyan shadow-sm'
                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                    }
                                  `}
                >
                  <div className={`p-2 rounded-xl bg-gray-100 text-gray-600 ${budget === opt.label ? 'bg-brand-vibrant text-white' : ''}`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base ${budget === opt.label ? 'text-brand-dark' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                      <div className="flex text-[10px] font-black text-green-600 bg-green-50 px-1.5 rounded">
                        {[...Array(opt.level)].map((_, i) => <span key={i}>$</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400 font-medium">{opt.desc}</span>
                      <span className="text-xs text-gray-500 font-semibold">•</span>
                      <span className="text-sm text-gray-600 font-semibold">{opt.range}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Search Button */}
        <div className="p-2 w-full md:w-auto flex-shrink-0">
          <button
            type="submit"
            disabled={isSearchLoading}
            data-testid="submit-search-btn"
            className={`btn-specialist w-full md:w-auto h-full min-h-[70px] bg-brand-yellow hover:bg-yellow-400 text-brand-dark rounded-2xl md:rounded-[1.5rem] shadow-lg flex items-center justify-center gap-2 px-6 transition-all duration-300 ease-spring hover:scale-105 hover:shadow-xl active:scale-90 group border-2 border-transparent whitespace-nowrap`}
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
      </div>
    </form>
  );
};

export default SearchForm;
