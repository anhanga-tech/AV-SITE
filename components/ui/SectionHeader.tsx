import React from 'react';
import { Badge, type BadgeColor } from './Badge';

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
}) => {
    const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

    return (
        <div className={`flex flex-col gap-3 ${alignClass} ${className}`}>
            {badge && (
                <Badge color={badgeColor} icon={badgeIcon}>
                    {badge}
                </Badge>
            )}
            <h2 className="text-4xl font-black text-anhanga-dark leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-gray-500 text-base font-medium">{subtitle}</p>
            )}
        </div>
    );
};
