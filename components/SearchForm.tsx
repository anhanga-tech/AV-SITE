import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import {
  normalizeStr,
  PRE_NORMALIZED_DB,
  TRIP_OPTIONS,
  BUDGET_TIERS,
  getDaysInMonth
} from '../data/destinations';
import { openAiChat } from '../utils/aiChat';
import DestinationField from './search/DestinationField';
import DateField from './search/DateField';
import GuestsField from './search/GuestsField';
import TripTypeField from './search/TripTypeField';
import BudgetField from './search/BudgetField';
import SearchButton from './search/SearchButton';
import { buildSearchMessage, getGuestSummary, isDateInPast } from './search/helpers';
import { useSearchFormDismiss, type PanelRegistryEntry } from './search/useSearchFormDismiss';
import type { DestinationOption, OpenPanel } from './search/types';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';

type ActivePanel = Exclude<OpenPanel, null>;

interface SearchFormProps {
  onDestinationMatch: (city: string | null) => void;
}

const SearchForm = memo(({ onDestinationMatch }: SearchFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [tripType, setTripType] = useState('');
  const [budget, setBudget] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);
  const completedFields = useRef<Set<'destination' | 'date' | 'budget'> | null>(null);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'home_search',
      formId: 'hero-search',
    });
  }, []);

  const markStarted = useCallback((fieldName: 'destination' | 'date' | 'budget') => {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'home_search',
        formId: 'hero-search',
      });
    }
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (!trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'home_search',
        formId: 'hero-search',
        fieldName,
      });
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    const timerRef = errorTimeoutRef;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tripTypeRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback((panel: ActivePanel) => {
    setOpenPanel((prev) => (prev === panel ? null : prev));
  }, []);

  const closeAllPanels = useCallback(() => setOpenPanel(null), []);

  const togglePanel = useCallback((panel: ActivePanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
    import('../utils/haptics').then(m => m.triggerHaptic('light'));
  }, []);

  const panelRegistry = useMemo<PanelRegistryEntry[]>(() => ([
    { panel: 'dest', ref: destRef },
    { panel: 'calendar', ref: calendarRef },
    { panel: 'guests', ref: guestDropdownRef },
    { panel: 'trip', ref: tripTypeRef },
    { panel: 'budget', ref: budgetRef },
  ]), []);

  useSearchFormDismiss(panelRegistry, openPanel, closePanel, closeAllPanels);

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
    if (value.trim()) markStarted('destination');
    setOpenPanel('dest');
    setActiveSuggestionIndex(-1);

    const search = normalizeStr(value);
    const exactMatch = PRE_NORMALIZED_DB.find((destination) => (
      destination.nLabel === search || destination.nCity === search
    ));

    onDestinationMatch(exactMatch ? exactMatch.city : null);
  }, [onDestinationMatch, markStarted]);

  const handleDestinationSelect = useCallback((destination: DestinationOption) => {
    setInputValue(destination.label);
    onDestinationMatch(destination.city);
    closePanel('dest');
    setActiveSuggestionIndex(-1);
  }, [onDestinationMatch, closePanel]);

  const handleDestinationKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (openPanel !== 'dest' || filteredDestinations.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < filteredDestinations.length - 1 ? prev + 1 : 0));
      import('../utils/haptics').then(m => m.triggerHaptic('light'));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredDestinations.length - 1));
      import('../utils/haptics').then(m => m.triggerHaptic('light'));
    } else if (event.key === 'Enter') {
      if (activeSuggestionIndex >= 0) {
        event.preventDefault();
        handleDestinationSelect(filteredDestinations[activeSuggestionIndex]);
      }
    } else if (event.key === 'Escape') {
      closePanel('dest');
      setActiveSuggestionIndex(-1);
    }
  }, [openPanel, filteredDestinations, activeSuggestionIndex, handleDestinationSelect, closePanel]);

  const handleClearDestination = useCallback(() => {
    setInputValue('');
    onDestinationMatch(null);
    closePanel('dest');
    setActiveSuggestionIndex(-1);
    if (destinationInputRef.current) {
      destinationInputRef.current.focus();
    }
    import('../utils/haptics').then(m => m.triggerHaptic('light'));
  }, [onDestinationMatch, closePanel]);

  const handleAdultsChange = useCallback((nextValue: number) => {
    setAdults(nextValue);
    import('../utils/haptics').then(m => m.triggerHaptic('light'));
  }, []);

  const handleChildCountChange = useCallback((operation: 'add' | 'remove') => {
    import('../utils/haptics').then(m => m.triggerHaptic('light'));
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
    import('../utils/haptics').then(m => m.triggerHaptic('light'));
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    if (isDateInPast(date)) return;

    if (!startDate || endDate) {
      setStartDate(date);
      setEndDate(null);
      markStarted('date');
      return;
    }

    if (date < startDate) {
      setStartDate(date);
      setEndDate(startDate);
      return;
    }

    setEndDate(date);
    closePanel('calendar');
  }, [startDate, endDate, closePanel, markStarted]);

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
    closePanel('trip');
  }, [closePanel]);

  const handleBudgetSelect = useCallback((label: string) => {
    setBudget(label);
    markStarted('budget');
    closePanel('budget');
  }, [closePanel, markStarted]);

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setValidationError("Por favor, informe o destino.");
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'home_search',
        formId: 'hero-search',
        fieldName: 'destination',
        errorType: 'required',
      });
      import('../utils/haptics').then(m => m.triggerHaptic('medium'));
      errorTimeoutRef.current = setTimeout(() => setValidationError(null), 4000);
      return;
    }

    setIsSearchLoading(true);
    setValidationError(null);
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'home_search',
      formId: 'hero-search',
      destination: inputValue,
    });

    openAiChat({
      haptic: 'medium',
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
    pushFormAnalyticsEvent({
      event: 'submit_success',
      formType: 'home_search',
      formId: 'hero-search',
      destination: inputValue,
    });

    setTimeout(() => {
      setIsSearchLoading(false);
    }, 1000);
  }, [inputValue, startDate, endDate, adults, children, childAges, tripType, budget]);

  // This form is intentionally client-only: it opens the AI chat drawer (SPA action, no server endpoint).
  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    handleSearch();
  }, [handleSearch]);

  const toggleCalendar = useCallback(() => togglePanel('calendar'), [togglePanel]);
  const toggleGuestDropdown = useCallback(() => togglePanel('guests'), [togglePanel]);
  const closeGuestDropdown = useCallback(() => closePanel('guests'), [closePanel]);
  const toggleTripTypeDropdown = useCallback(() => togglePanel('trip'), [togglePanel]);
  const toggleBudgetDropdown = useCallback(() => togglePanel('budget'), [togglePanel]);
  const onDestinationFocus = useCallback(() => {
    setOpenPanel('dest');
    setActiveSuggestionIndex(-1);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-2 relative z-50 border-[6px] border-white/20 backdrop-blur-sm flex flex-col transition duration-300 ${
        validationError ? 'ring-4 ring-red-500/20 border-red-500/20' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row items-center w-full divide-y md:divide-y-0 md:divide-x divide-zinc-100">
        <DestinationField
          destRef={destRef}
          inputRef={destinationInputRef}
          inputValue={inputValue}
          isOpen={openPanel === 'dest'}
          filteredDestinations={filteredDestinations}
          activeSuggestionIndex={activeSuggestionIndex}
          onChange={handleDestinationChange}
          onFocus={onDestinationFocus}
          onKeyDown={handleDestinationKeyDown}
          onSelect={handleDestinationSelect}
          onClear={handleClearDestination}
        />
        <DateField
          calendarRef={calendarRef}
          isOpen={openPanel === 'calendar'}
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
          isOpen={openPanel === 'guests'}
          guestSummary={guestSummary}
          adults={adults}
          childrenCount={children}
          childAges={childAges}
          onToggle={toggleGuestDropdown}
          onAdultsChange={handleAdultsChange}
          onChildCountChange={handleChildCountChange}
          onChildAgeChange={handleChildAgeChange}
          onClose={closeGuestDropdown}
        />
      </div>

      <div className="w-full h-[2px] border-t-2 border-dashed border-zinc-200 relative my-1">
        <div className="absolute left-[-16px] top-[-8px] size-4 bg-brand-light rounded-full"></div>
        <div className="absolute right-[-16px] top-[-8px] size-4 bg-brand-light rounded-full"></div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch w-full divide-y md:divide-y-0 md:divide-x divide-zinc-100">
        <TripTypeField
          tripTypeRef={tripTypeRef}
          isOpen={openPanel === 'trip'}
          tripType={tripType}
          selectedTripObj={selectedTripObj}
          onToggle={toggleTripTypeDropdown}
          onSelect={handleTripTypeSelect}
        />
        <BudgetField
          budgetRef={budgetRef}
          isOpen={openPanel === 'budget'}
          budget={budget}
          selectedBudgetObj={selectedBudgetObj}
          onToggle={toggleBudgetDropdown}
          onSelect={handleBudgetSelect}
        />
        <SearchButton
          isSearchLoading={isSearchLoading}
          validationError={validationError}
        />
      </div>
    </form>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;
