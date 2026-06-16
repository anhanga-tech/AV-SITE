import React from 'react';
import type { MDXComponents } from 'mdx/types';
import ChatCTA from './ChatCTA';

export const mdxComponents: MDXComponents = {
  // Componentes customizados da Anhangá disponíveis nos posts MDX
  ChatCTA,

  // Imagem: lazy loading e arredondamento padrão do design system.
  // width/height default (16:9) reservam o espaço antes do load para evitar CLS;
  // posts podem sobrescrever passando width/height próprios no MDX.
  img: ({ src, alt, width, height, ...props }) => (
    <img
      src={src}
      alt={alt ?? ''}
      width={width ?? 1200}
      height={height ?? 675}
      loading="lazy"
      decoding="async"
      className="rounded-3xl shadow-lg my-10 w-full h-auto"
      {...props}
    />
  ),
};
