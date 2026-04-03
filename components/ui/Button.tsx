import React from 'react';

export type ButtonVariant = 'primary' | 'action' | 'cta' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
    asChild?: boolean;
    className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-anhanga-dark text-white rounded-xl shadow-hard-yellow hover:shadow-[2px_2px_0px_0px_#FFD600] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    action:  'bg-anhanga-action text-white rounded-full hover:bg-anhanga-actionDark',
    cta:     'bg-anhanga-yellow text-anhanga-dark rounded-2xl shadow-hard hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    ghost:   'bg-transparent text-gray-500 rounded-lg hover:text-anhanga-action',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
};

const Spinner: React.FC = () => (
    <svg
        className="w-4 h-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    asChild = false,
    className = '',
    disabled,
    ...rest
}) => {
    const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-anhanga-action disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
    const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    const isDisabled = disabled || isLoading;

    // When asChild=true, only style classes are merged onto the child element.
    // isLoading, disabled, leftIcon, and rightIcon are not forwarded.
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            className: `${classes} ${(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.className ?? ''}`.trim(),
        });
    }

    return (
        <button
            className={classes}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            {...rest}
        >
            {isLoading ? (
                <>
                    <Spinner />
                    {children}
                </>
            ) : (
                <>
                    {leftIcon}
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
};
