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
  inputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
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
  inputRef,
  disabled,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-zinc-200'} rounded-xl px-4 py-3 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60`}
      />
      {error && <span id={errorId} role="alert" className="text-[10px] text-red-500 font-bold ml-1 uppercase">{error}</span>}
    </div>
  );
}
