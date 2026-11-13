import React from 'react';
import { Link } from 'react-router-dom';

export interface LandingBlogGuide {
  /** Caminho interno do post, com barra final (ex.: `/blog/slug/`). */
  href: string;
  /** Título do post, usado como âncora descritiva. */
  title: string;
}

interface LandingBlogGuidesProps {
  guides: readonly LandingBlogGuide[];
  title?: string;
  /** Id do heading, referenciado por aria-labelledby. Único por página. */
  headingId?: string;
  /** Classes do <section> (fundo e espaçamento vertical) para casar com a landing. */
  className?: string;
}

export const DEFAULT_GUIDES_TITLE = 'Guias para planejar';

/*
  Bloco de links internos para os posts do cluster de cada landing. São <a href>
  comuns (Link do react-router renderiza <a href> no prerender), então chegam no
  HTML estático sem depender de hidratação. Sempre um <h2>: as landings têm o <h1>
  no hero e este bloco é irmão das demais seções de nível 2.
*/
export function LandingBlogGuides({
  guides,
  title = DEFAULT_GUIDES_TITLE,
  headingId = 'guias-para-planejar',
  className = 'py-16 bg-white border-t border-zinc-100',
}: LandingBlogGuidesProps): React.ReactElement | null {
  if (guides.length === 0) return null;

  return (
    <section className={className} aria-labelledby={headingId} data-testid="landing-blog-guides">
      <div className="container mx-auto px-6 max-w-5xl">
        <h2 id={headingId} className="text-2xl md:text-3xl font-black text-anhanga-dark mb-6">
          {title}
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {guides.map(({ href, title: guideTitle }) => (
            <li key={href}>
              <Link
                to={href}
                className="flex h-full items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-anhanga-light p-5 font-semibold leading-snug text-anhanga-dark transition-colors hover:border-anhanga-action hover:text-anhanga-actionInk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
              >
                <span>{guideTitle}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
