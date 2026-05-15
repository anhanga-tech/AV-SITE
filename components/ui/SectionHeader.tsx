import React from 'react';
import { Badge, type BadgeColor } from './Badge';

const alignClasses: Record<'center' | 'left', string> = {
    center: 'text-center items-center',
    left:   'text-left items-start',
};

interface SectionHeaderProps {
    title: string;
    badge?: string;
    badgeIcon?: React.ReactNode;
    badgeColor?: BadgeColor;
    subtitle?: string;
    align?: 'center' | 'left';
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    badge,
    badgeIcon,
    badgeColor = 'default',
    subtitle,
    align = 'center',
    className = '',
}) => (
    <div className={`flex flex-col gap-3 ${alignClasses[align]} ${className}`}>
            {badge && (
                <Badge color={badgeColor} icon={badgeIcon}>
                    {badge}
                </Badge>
            )}
            <h2 className="text-4xl font-black text-anhanga-dark leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-zinc-500 text-base font-medium">{subtitle}</p>
            )}
        </div>
);
