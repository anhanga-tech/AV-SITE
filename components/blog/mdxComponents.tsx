import React from 'react';
import type { MDXComponents } from 'mdx/types';
import ChatCTA from './ChatCTA';

export const mdxComponents: MDXComponents = {
  // Componentes customizados da Anhangá disponíveis nos posts MDX
  ChatCTA,

  // Imagem: lazy loading e arredondamento padrão do design system
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className="rounded-3xl shadow-lg my-10 w-full"
      {...props}
    />
  ),
};
