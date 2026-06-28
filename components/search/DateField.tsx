import { memo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MONTH_NAMES, WEEK_DAYS } from '../../data/destinations';
import { formatDateDisplay, isDateInPast } from './helpers';

interface DateFieldProps {
  calendarRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
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
  isOpen,
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
      className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
      aria-expanded={isOpen}
      aria-haspopup="grid"
      data-testid="dates-filter-btn"
    >
      <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1 group-hover:text-brand-cyan group-focus-within:text-brand-cyan transition-colors">
        <Calendar className="size-3" /> Quando?
      </span>
      <div className="flex items-center justify-between">
        <span className={`text-lg md:text-xl font-bold truncate transition-colors ${startDate ? "text-zinc-800" : "text-zinc-300"}`}>
          {startDate ? `${formatDateDisplay(startDate)} - ${endDate ? formatDateDisplay(endDate) : '...'}` : "Definir datas"}
        </span>
        <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {isOpen && (
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation" className="absolute top-full left-0 md:left-auto md:right-0 bg-white rounded-3xl shadow-2xl border-2 border-zinc-100 mt-4 p-6 z-[60] w-full md:w-80 cursor-default animate-pop-in origin-top">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            disabled={!canGoToPreviousMonth}
            className={`p-1 rounded-full transition-colors ${canGoToPreviousMonth ? 'hover:bg-zinc-100 text-zinc-600' : 'text-zinc-300 cursor-not-allowed'}`}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="font-bold text-zinc-800">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button type="button" onClick={() => onChangeMonth(1)} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors" aria-label="Próximo mês">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-zinc-400">
          {WEEK_DAYS.map((day, index) => <div key={`weekday-${index}`}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((date, slot) => {
            if (!date) return <div key={`empty-${slot}`} />;

            const selected = isDateSelected(date);
            const inRange = isDateInRange(date);
            const past = isDateInPast(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onDateClick(date)}
                disabled={past}
                aria-disabled={past}
                className={`size-9 mx-auto flex items-center justify-center text-sm rounded-full transition duration-200 border-2
                  ${past ? 'border-transparent text-zinc-300 cursor-not-allowed' : selected ? 'bg-brand-cyan border-brand-cyan text-white font-bold scale-110' : inRange ? 'bg-brand-light border-transparent text-brand-cyan font-bold' : 'border-transparent text-zinc-600 hover:bg-zinc-100'}`}
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

export default DateField;
