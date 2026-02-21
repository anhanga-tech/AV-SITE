import React from 'react';

interface ChatChipsProps {
    chips: string[];
    disabled?: boolean;
    onSelect: (value: string) => void;
    mode: 'hero' | 'widget';
}

const ChatChips: React.FC<ChatChipsProps> = ({ chips, disabled = false, onSelect, mode }) => {
    if (chips.length === 0) return null;

    const baseClass = mode === 'hero'
        ? 'bg-white/90 text-brand-dark border border-white hover:bg-white'
        : 'bg-white text-brand-dark border border-brand-vibrant/20 hover:bg-brand-light';

    return (
        <div className="flex flex-wrap gap-2" aria-label="Sugestões rápidas">
            {chips.map((chip) => (
                <button
                    key={chip}
                    type="button"
                    onClick={() => onSelect(chip)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${baseClass}`}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
};

export default ChatChips;
