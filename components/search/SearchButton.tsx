import { memo } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchButtonProps {
  isSearchLoading: boolean;
  validationError?: string | null;
}

const SearchButton = memo(({ isSearchLoading, validationError }: SearchButtonProps) => (
  <div className="p-2 w-full md:w-auto flex-shrink-0 relative">
    {validationError && (
      <div
        role="alert"
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-full text-center text-red-600 text-xs font-black animate-fade-in-down whitespace-nowrap bg-white/90 backdrop-blur-sm py-1 px-2 rounded-full shadow-sm border border-red-100 z-10"
      >
        {validationError}
      </div>
    )}
    <button
      type="submit"
      disabled={isSearchLoading}
      data-testid="submit-search-btn"
      className="btn-specialist w-full md:w-auto h-full min-h-[70px] bg-brand-yellow hover:bg-anhanga-yellowHover text-brand-dark rounded-2xl md:rounded-[1.5rem] shadow-lg flex items-center justify-center gap-2 px-6 transition duration-300 ease-spring hover:scale-105 hover:shadow-xl active:scale-90 group border-2 border-transparent whitespace-nowrap"
      data-tracking="hero-home"
    >
      {isSearchLoading ? (
        <>
          <Loader2 className="size-6 animate-spin" />
          <span className="font-black text-lg">Planejando…</span>
        </>
      ) : (
        <>
          <Search className="size-6 group-hover:rotate-12 transition-transform duration-300 ease-spring" strokeWidth={2.5} />
          <span className="font-black text-lg">Planejar Viagem</span>
        </>
      )}
    </button>
  </div>
));
SearchButton.displayName = 'SearchButton';

export default SearchButton;
