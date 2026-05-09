import React from 'react';

type CardVariant = 'default' | 'hard' | 'float';

interface CardProps {
    children: React.ReactNode;
    variant?: CardVariant;
    className?: string;
}

const variantClasses: Record<CardVariant, string> = {
    default: 'shadow-float',
    hard:    'shadow-hard',
    float:   'shadow-float-lg',
};

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    className = '',
}) => (
    <div className={`bg-white rounded-2xl ${variantClasses[variant]} ${className}`}>
        {children}
    </div>
);
