import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    className?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id: externalId,
    ...rest
}) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-bold text-anhanga-dark"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`
                    w-full px-4 py-2.5 rounded-xl border-2 font-medium text-sm text-anhanga-dark
                    placeholder-gray-300 bg-white outline-none transition-colors
                    focus:border-anhanga-action focus:outline-none focus-visible:outline-2 focus-visible:outline-anhanga-action/50
                    ${error ? 'border-red-400' : 'border-gray-200'}
                `}
                aria-describedby={error ? `${id}-error` : undefined}
                aria-invalid={error ? 'true' : undefined}
                {...rest}
            />
            {error && (
                <p id={`${id}-error`} role="alert" className="text-xs text-red-500 font-semibold">
                    {error}
                </p>
            )}
        </div>
    );
};
