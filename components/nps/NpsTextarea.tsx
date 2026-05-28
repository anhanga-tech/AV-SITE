import { useState } from 'react';

export interface NpsTextareaProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
  'aria-label'?: string;
}

export function NpsTextarea({ id, value, onChange, placeholder, rows, required, maxLength, 'aria-label': ariaLabel }: NpsTextareaProps) {
  const [focused, setFocused] = useState(false);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : null;
  const showCounter = charsLeft !== null && (focused || value.length > (maxLength ?? 0) * 0.6);
  const counterUrgent = charsLeft !== null && charsLeft < 100;

  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
        aria-label={ariaLabel}
        className={[
          'w-full rounded-xl px-4 py-3 text-sm font-sans resize-none leading-relaxed',
          'bg-slate-800/60 text-slate-100 placeholder:text-slate-500',
          'border-2 outline-none',
          'transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          focused
            ? 'border-anhanga-action shadow-[0_0_0_4px_rgba(14,165,233,0.15)]'
            : 'border-slate-600/40 shadow-none hover:border-slate-500',
        ].join(' ')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showCounter && (
        <p
          aria-live="polite"
          className={[
            'text-right text-xs mt-1.5 transition-colors duration-200',
            counterUrgent ? 'text-red-400' : 'text-slate-500',
          ].join(' ')}
        >
          {charsLeft} {charsLeft === 1 ? 'caractere restante' : 'caracteres restantes'}
        </p>
      )}
    </div>
  );
}
