import { useState } from 'react';

export interface NpsTextareaProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
}

export function NpsTextarea({ id, value, onChange, placeholder, rows, required, maxLength }: NpsTextareaProps) {
  const [focused, setFocused] = useState(false);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : null;
  const showCounter = charsLeft !== null && (focused || value.length > (maxLength ?? 0) * 0.6);
  const counterColor = charsLeft !== null && charsLeft < 100 ? '#f87171' : '#475569';

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
        className="w-full rounded-xl px-4 py-3 text-sm resize-none font-sans bg-slate-800 text-slate-100 outline-none leading-[1.65] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease]"
        style={{
          border: focused ? '2px solid #0ea5e9' : '2px solid #334155',
          boxShadow: focused ? '0 0 0 4px rgba(14,165,233,0.15)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showCounter && (
        <p
          aria-live="polite"
          className="text-right text-[0.75rem] mt-1 [transition:color_0.2s_ease]"
          style={{ color: counterColor }}
        >
          {charsLeft} {charsLeft === 1 ? 'caractere restante' : 'caracteres restantes'}
        </p>
      )}
    </div>
  );
}
