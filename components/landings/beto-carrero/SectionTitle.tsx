import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  color?: 'dark' | 'white';
}

const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  subtitle, 
  align = 'center',
  color = 'dark'
}) => {
  const textColor = color === 'white' ? 'text-white' : 'text-fun-dark';
  const subtitleColor = color === 'white' ? 'text-blue-100' : 'text-slate-600';

  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <h2 className={`text-3xl md:text-5xl font-bold mb-4 leading-tight ${textColor}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-xl md:text-2xl font-sans max-w-2xl mx-auto ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;