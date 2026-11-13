import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';
import { Seo } from '../components/Seo';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { ORGANIZATION_ID } from '../components/schemas/schema-ids';
import { WebPageSchema } from '../components/schemas/WebPageSchema';
import { AUTHORS } from '../data/blogData';
import { getAllPosts } from '../lib/mdx';
import { getAuthorEntityId, getAuthorUrl } from '../utils/author';
import { formatDate } from '../utils/blog';
import NotFound from './NotFound';

const ORG_NAME = 'Anhangá Viagens';
const ORG_URL = 'https://www.anhanga.tur.br/';
const HOME_URL = 'https://www.anhanga.tur.br/';

// Carregado no nível do módulo (como BlogList): o manifesto é estático e já exclui os
// posts agendados no build de produção.
const allPosts = getAllPosts();

// Só chaves próprias de AUTHORS: `AUTHORS['constructor']` não pode virar autor.
const getAuthor = (authorId: string | undefined) =>
  authorId && Object.prototype.hasOwnProperty.call(AUTHORS, authorId) ? AUTHORS[authorId] : undefined;

const Author: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const author = getAuthor(authorId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [authorId]);

  if (!author) return <NotFound />;

  const authorUrl = getAuthorUrl(author.id);
  const personId = getAuthorEntityId(author.id);
  const sameAs = author.social ? (Object.values(author.social).filter(Boolean) as string[]) : [];
  // Mais recentes primeiro; ordem estável nos empates (Array.sort é estável).
  const posts = allPosts
    .filter((post) => post.author === author.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const description = `Artigos e roteiros de viagem de ${author.name}, ${author.role} da ${ORG_NAME}.`;

  return (
    <div className="bg-anhanga-light pt-32 pb-20 md:pt-36">
      <Seo
        title={`${author.name}, ${author.role}`}
        description={description}
        canonical={authorUrl}
      />
      <WebPageSchema
        type="ProfilePage"
        name={`${author.name}, ${author.role} | ${ORG_NAME}`}
        url={authorUrl}
        description={description}
        mainEntityId={personId}
      />
      <PersonSchema
        name={author.name}
        image={author.image}
        description={author.bio}
        jobTitle={author.role}
        url={authorUrl}
        entityId={personId}
        sameAs={sameAs}
        worksFor={{ name: ORG_NAME, url: ORG_URL, id: ORGANIZATION_ID }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: HOME_URL },
          { name: author.name, item: authorUrl },
        ]}
      />

      <div className="container mx-auto max-w-4xl px-6">
        <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          {author.image && (
            <img
              src={author.image}
              alt={`${author.name}, ${author.role} na ${ORG_NAME}`}
              width={160}
              height={160}
              className="size-40 shrink-0 rounded-2xl border-4 border-white object-cover shadow-float"
            />
          )}
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-anhanga-actionInk">{author.role}</p>
            <h1 className="mb-4 text-4xl font-black leading-tight text-anhanga-dark md:text-5xl">{author.name}</h1>
            <p className="mb-5 text-lg font-medium leading-relaxed text-zinc-600">{author.bio}</p>
            {sameAs.length > 0 && (
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                {author.social?.instagram && (
                  <a
                    href={author.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de ${author.name}`}
                    className="flex size-11 items-center justify-center rounded-full bg-anhanga-action/10 text-anhanga-actionInk transition-colors hover:bg-anhanga-actionInk hover:text-white"
                  >
                    <InstagramLogo className="size-5" weight="fill" aria-hidden="true" />
                  </a>
                )}
                {author.social?.linkedin && (
                  <a
                    href={author.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`LinkedIn de ${author.name}`}
                    className="flex size-11 items-center justify-center rounded-full bg-anhanga-action/10 text-anhanga-actionInk transition-colors hover:bg-anhanga-actionInk hover:text-white"
                  >
                    <LinkedinLogo className="size-5" weight="fill" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </header>

        <p className="mt-8 font-medium leading-relaxed text-zinc-600">
          {author.name} faz parte da equipe da {ORG_NAME}, agência de viagens em São Paulo.{' '}
          <Link
            to="/sobre/"
            className="font-bold text-anhanga-actionInk underline decoration-anhanga-actionInk/40 underline-offset-2 hover:text-anhanga-dark"
          >
            Conheça a {ORG_NAME}
          </Link>
          .
        </p>

        <section aria-labelledby="author-posts-heading" className="mt-14">
          <h2 id="author-posts-heading" className="mb-6 text-2xl font-black text-anhanga-dark md:text-3xl">
            Artigos de {author.name}
          </h2>
          {posts.length > 0 ? (
            <ul className="divide-y divide-zinc-200 border-y border-zinc-200" data-testid="author-posts">
              {posts.map((post) => (
                <li key={post.slug} className="py-5">
                  <Link to={`/blog/${post.slug}/`} className="group block">
                    <h3 className="text-lg font-bold leading-snug text-anhanga-dark group-hover:text-anhanga-actionInk md:text-xl">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      {post.category} · {formatDate(post.date)} · {post.readingTime}
                    </p>
                    <p className="mt-2 leading-relaxed text-zinc-600">{post.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-medium text-zinc-600">
              Ainda não há artigos publicados por {author.name}.{' '}
              <Link to="/blog/" className="font-bold text-anhanga-actionInk underline underline-offset-2">
                Veja o blog
              </Link>
              .
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Author;
