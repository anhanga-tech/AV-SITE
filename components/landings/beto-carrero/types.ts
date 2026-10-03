import React from 'react';

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  tooltipText?: string;
}