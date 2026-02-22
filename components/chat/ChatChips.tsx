import React from 'react';

interface ChatChipsProps {
    chips: string[];
    disabled?: boolean;
    onSelect: (value: string) => void;
    mode: 'hero' | 'widget';
}

const ChatChips: React.FC<ChatChipsProps> = ({ chips, disabled = false, onSelect, mode }) => {
    if (chips.length === 0) return null;

    const isHero = mode === 'hero';

    const wrapperClassName = isHero
        ? 'flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-1'
        : 'flex flex-wrap gap-2';

    const baseClass = isHero
        ? 'bg-transparent text-anhanga-yellow border-2 border-anhanga-yellow/80 hover:border-anhanga-yellow hover:bg-anhanga-yellow hover:text-anhanga-darkBlue hover:shadow-hard'
        : 'bg-white text-brand-dark border border-brand-vibrant/20 hover:bg-brand-light';

    return (
        <div className={wrapperClassName} aria-label="Sugestões rápidas">
            {chips.map((chip) => (
                <button
                    key={chip}
                    type="button"
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(chip)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelect(chip);
                        }
                    }}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${baseClass}`}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
};

export default ChatChips;
