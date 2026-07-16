import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';

type ButtonVariant = 'primary' | 'action' | 'cta' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
    // texto Ardósia, não branco: branco sobre bg-anhanga-action mede 2.8:1
    // (abaixo do piso de 4.5:1 do WCAG AA) — mesma lógica de par acessível já
    // usada no variant `cta` (bg saturado + texto escuro). Ver critique de
    // /consultoria-de-viagem. hover:bg-anhanga-actionDark foi removido: esse
    // par media 4.36:1 com o texto Ardósia, abaixo do piso — brightness-105
    // dá feedback de hover sem escurecer o fundo (só melhora o contraste).
    action:  'bg-anhanga-action text-anhanga-dark rounded-full hover:brightness-105',
    cta:     'bg-anhanga-yellow text-anhanga-dark rounded-2xl shadow-hard hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    ghost:   'bg-transparent text-zinc-500 rounded-lg hover:text-anhanga-action',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
};

// Sem `focus:outline-none`: no Tailwind v4, essa classe zera a custom property
// --tw-outline-style para "none", e como todo elemento com foco de teclado
// casa com :focus E :focus-visible ao mesmo tempo, esse valor "vaza" para a
// regra focus-visible (que lê a mesma variável) e o anel nunca pinta —
// mesmo com outline-width/color corretos. Só as classes focus-visible:*
// já evitam o anel em foco de mouse nos navegadores modernos.
const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

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
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
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
            type="button"
            className={classes}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            {...rest}
        >
            {isLoading ? (
                <>
                    <CircleNotch className="size-4 animate-spin" weight="bold" aria-hidden="true" />
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
