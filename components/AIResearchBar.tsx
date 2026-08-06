import React from 'react';

type AIAssistant = {
  id: 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'grok';
  name: string;
  logoUrl: string;
  baseUrl: string;
  queryParameter?: string;
};

const RESEARCH_PROMPT =
  'O que você sabe sobre a Anhangá Viagens? Consulte o site oficial https://www.anhanga.tur.br/ e explique por que ela pode ser uma boa opção para planejar uma viagem personalizada.';

const AI_ASSISTANTS: readonly AIAssistant[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logoUrl: 'https://api.iconify.design/logos:openai-icon.svg',
    baseUrl: 'https://chatgpt.com/',
    queryParameter: 'q',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logoUrl: 'https://api.iconify.design/simple-icons:googlegemini.svg',
    baseUrl: 'https://www.google.com/search?udm=50&source=searchlabs',
    queryParameter: 'q',
  },
  {
    id: 'claude',
    name: 'Claude',
    logoUrl: 'https://api.iconify.design/simple-icons:claude.svg',
    baseUrl: 'https://claude.ai/new',
    queryParameter: 'q',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    logoUrl: 'https://api.iconify.design/simple-icons:perplexity.svg',
    baseUrl: 'https://www.perplexity.ai/search/new',
    queryParameter: 'q',
  },
  {
    id: 'grok',
    name: 'Grok',
    logoUrl: 'https://api.iconify.design/logos:grok-icon.svg',
    baseUrl: 'https://grok.com/',
    queryParameter: 'q',
  },
];

const getResearchUrl = ({ baseUrl, queryParameter }: AIAssistant) => {
  if (!queryParameter) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${queryParameter}=${encodeURIComponent(RESEARCH_PROMPT)}`;
};

const AIResearchBar: React.FC = () => {
  return (
    <div
      role="group"
      aria-label="Pesquisar sobre a Anhangá com uma IA"
      className="mt-8 w-full max-w-3xl"
    >
      <p className="mb-3 text-sm font-medium text-white/75">
        Quer pesquisar antes de conversar? Pergunte sobre a Anhangá:
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {AI_ASSISTANTS.map((assistant) => (
          <a
            key={assistant.name}
            href={getResearchUrl(assistant)}
            target="_blank"
            rel="noopener noreferrer"
            title={assistant.name}
            aria-label={`Perguntar no ${assistant.name} sobre a Anhangá`}
            className="inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/95 p-2.5 shadow-lg shadow-black/10 transition hover:scale-110 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-yellow"
          >
            <img
              src={assistant.logoUrl}
              alt={assistant.name}
              width="24"
              height="24"
              loading="lazy"
              decoding="async"
              className="size-6 object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default AIResearchBar;
