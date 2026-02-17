import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';

const BlogRedirect: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const destination = slug ? getBlogPostUrl(slug) : getBlogHomeUrl();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(destination);
    }
  }, [destination]);

  return (
    <main className="min-h-screen bg-[#fffdf5] pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Redirecionando para o Blog</h1>
        <p className="text-gray-600 mb-6">
          O blog agora está em um novo endereço.
        </p>
        <a
          href={destination}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-cyan text-white font-bold"
        >
          Ir para blog.anhanga.tur.br
        </a>
      </div>
    </main>
  );
};

export default BlogRedirect;
