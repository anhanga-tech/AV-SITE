import type { Ref } from 'react';

const LABEL_CLASSNAME = 'mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500';
const ERROR_CLASSNAME = 'mt-1 text-xs font-semibold text-red-500';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'tel' | 'email';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  inputClassName: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  required,
  inputClassName,
  inputRef,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSNAME}>
        {label}
        {required ? (
          <span className="text-red-500" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={inputClassName}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} className={ERROR_CLASSNAME} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
