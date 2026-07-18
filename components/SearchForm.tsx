import { memo } from 'react';
import BudgetField from './search/BudgetField';
import DateField from './search/DateField';
import DestinationField from './search/DestinationField';
import GuestsField from './search/GuestsField';
import SearchButton from './search/SearchButton';
import TripTypeField from './search/TripTypeField';
import { useSearchFormController } from './search/useSearchFormController';

interface SearchFormProps {
  onDestinationMatch: (city: string | null) => void;
}

const SearchForm = memo(({ onDestinationMatch }: SearchFormProps) => {
  const controller = useSearchFormController(onDestinationMatch);
  const {
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
  } = controller;

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
        <div id="hero-trip-type-panel" className="w-full md:flex-1 flex">
          {showTripType ? (
            <TripTypeField
              tripTypeRef={tripTypeRef}
              isOpen={openPanel === 'trip'}
              tripType={tripType}
              selectedTripObj={selectedTripObj}
              onToggle={toggleTripTypeDropdown}
              onSelect={handleTripTypeSelect}
            />
          ) : (
            <button
              type="button"
              onClick={revealTripType}
              aria-expanded={showTripType}
              aria-controls="hero-trip-type-panel"
              data-testid="trip-type-reveal-btn"
              className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan flex items-center"
            >
              <span className="text-zinc-400 font-bold text-sm">+ Tipo de viagem</span>
            </button>
          )}
        </div>
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
