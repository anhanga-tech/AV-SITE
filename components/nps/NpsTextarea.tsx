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
        className="w-full rounded-xl px-4 py-3 text-sm resize-none"
        style={{
          fontFamily: 'Poppins, sans-serif',
          background: '#1e293b',
          color: '#f1f5f9',
          border: focused ? '2px solid #0ea5e9' : '2px solid #334155',
          boxShadow: focused ? '0 0 0 4px rgba(14,165,233,0.15)' : 'none',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          lineHeight: '1.65',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showCounter && (
        <p
          aria-live="polite"
          style={{
            textAlign: 'right',
            fontSize: '0.7rem',
            color: counterColor,
            marginTop: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          {charsLeft} {charsLeft === 1 ? 'caractere restante' : 'caracteres restantes'}
        </p>
      )}
    </div>
  );
}
