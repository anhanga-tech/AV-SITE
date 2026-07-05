import React from 'react';

type TextFieldProps = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

export function TextField({
  id,
  label,
  type,
  value,
  placeholder,
  error,
  onChange,
  inputMode,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-zinc-200'} rounded-xl px-4 py-3 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition shadow-sm`}
      />
      {error && <span id={errorId} role="alert" className="text-[10px] text-red-500 font-bold ml-1 uppercase">{error}</span>}
    </div>
  );
}
