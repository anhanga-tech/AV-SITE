import React from 'react';

export type BadgeColor = 'default' | 'blue' | 'yellow';

interface BadgeProps {
    children: React.ReactNode;
    color?: BadgeColor;
    icon?: React.ReactNode;
    className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
    default: 'bg-white border-zinc-200 text-anhanga-dark shadow-sm',
    blue:    'bg-blue-50 border-blue-200 text-anhanga-blue',
    yellow:  'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    color = 'default',
    icon,
    className = '',
}) => (
    <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-black text-xs uppercase tracking-widest ${colorClasses[color]} ${className}`}
    >
        {icon}
        {children}
    </span>
);
