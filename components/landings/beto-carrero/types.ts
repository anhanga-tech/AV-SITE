import React from 'react';

export interface Testimonial {
  id: number;
  name: string;
  quote: string;
  avatar: string;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  tooltipText?: string;
}