import { ReactNode } from 'react';

export interface Feature {
    icon: ReactNode;
    title: string;
    description: string;
    color: string;
    tooltipText?: string;
}

export interface FAQItem {
    question: string;
    answer: string;
}

export interface Testimonial {
    id: number | string;
    name: string;
    quote: string;
    avatar: string;
}
