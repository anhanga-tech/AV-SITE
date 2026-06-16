import React from 'react';
import type { MDXComponents } from 'mdx/types';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';
import ChatCTA from './ChatCTA';

export const mdxComponents: MDXComponents = {
  // Componentes customizados da Anhangá disponíveis nos posts MDX
  ChatCTA,

  // Imagem: otimização remota + lazy loading e arredondamento do design system.
  // width/height default (16:9) reservam o espaço antes do load para evitar CLS;
  // posts podem sobrescrever passando width/height próprios no MDX.
  // optimizeRemoteImageUrl recebe só a largura para preservar o aspect ratio original.
  img: ({ src, alt, width, height, ...props }) => {
    const numericWidth = Number(width);
    const optimizeWidth = Number.isFinite(numericWidth) && numericWidth > 0 ? numericWidth : 1200;
    return (
      <img
        src={src ? optimizeRemoteImageUrl(src, optimizeWidth) : undefined}
        alt={alt ?? ''}
        width={width ?? 1200}
        height={height ?? 675}
        loading="lazy"
        decoding="async"
        className="rounded-3xl shadow-lg my-10 w-full h-auto"
        {...props}
      />
    );
  },
};
