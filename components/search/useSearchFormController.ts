import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BUDGET_TIERS,
  getDaysInMonth,
  normalizeStr,
  PRE_NORMALIZED_DB,
  TRIP_OPTIONS,
} from '../../data/destinations';
import { getGuestSummary, isDateInPast } from './helpers';
import type { DestinationOption, OpenPanel } from './types';
import { useSearchFormDismiss, type PanelRegistryEntry } from './useSearchFormDismiss';
import { useSearchSubmission } from './useSearchSubmission';

type ActivePanel = Exclude<OpenPanel, null>;

export function useSearchFormController(onDestinationMatch: (city: string | null) => void) {
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
  const [showTripType, setShowTripType] = useState(false);

  const {
    isSearchLoading,
    validationError,
    markStarted,
    handleSearch,
  } = useSearchSubmission({
    inputValue,
    startDate,
    endDate,
    adults,
    children,
    childAges,
    tripType,
    budget,
  });

  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tripTypeRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTripType) {
      tripTypeRef.current?.querySelector<HTMLButtonElement>('[data-testid="trip-type-filter-btn"]')?.focus();
    }
  }, [showTripType]);

  const closePanel = useCallback((panel: ActivePanel) => {
    setOpenPanel((prev) => (prev === panel ? null : prev));
  }, []);

  const closeAllPanels = useCallback(() => setOpenPanel(null), []);

  const togglePanel = useCallback((panel: ActivePanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
    void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
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
      void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredDestinations.length - 1));
      void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
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
    void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
  }, [onDestinationMatch, closePanel]);

  const handleAdultsChange = useCallback((nextValue: number) => {
    setAdults(nextValue);
    void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
  }, []);

  const handleChildCountChange = useCallback((operation: 'add' | 'remove') => {
    void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
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
    void import('../../utils/haptics').then(m => m.triggerHaptic('light'));
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

  const revealTripType = useCallback(() => {
    setShowTripType(true);
  }, []);

  const handleBudgetSelect = useCallback((label: string) => {
    setBudget(label);
    markStarted('budget');
    closePanel('budget');
  }, [closePanel, markStarted]);

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

  return {
    inputValue,
    activeSuggestionIndex,
    openPanel,
    startDate,
    endDate,
    currentMonth,
    adults,
    children,
    childAges,
    tripType,
    budget,
    showTripType,
    filteredDestinations,
    calendarDays,
    guestSummary,
    selectedTripObj,
    selectedBudgetObj,
    canGoToPreviousMonth,
    isSearchLoading,
    validationError,
    guestDropdownRef,
    destRef,
    destinationInputRef,
    calendarRef,
    tripTypeRef,
    budgetRef,
    handleSubmit,
    handleDestinationChange,
    handleDestinationSelect,
    handleDestinationKeyDown,
    handleClearDestination,
    handleAdultsChange,
    handleChildCountChange,
    handleChildAgeChange,
    handleDateClick,
    isDateSelected,
    isDateInRange,
    handleMonthChange,
    handleTripTypeSelect,
    revealTripType,
    handleBudgetSelect,
    toggleCalendar,
    toggleGuestDropdown,
    closeGuestDropdown,
    toggleTripTypeDropdown,
    toggleBudgetDropdown,
    onDestinationFocus,
  };
}
