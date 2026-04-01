import { optimizeRemoteImageUrl } from './mediaConfig';

export interface Author {
    id: string;
    name: string;
    role: string;
    bio: string;
    image?: string;
    social?: {
        instagram?: string;
        linkedin?: string;
    };
}

export const AUTHORS: Record<string, Author> = {
    "ana-souza": {
        id: "ana-souza",
        name: "Ana Souza",
        role: "Dicas de Expert",
        bio: "Especialista em roteiros para a Disney e apaixonada por transformar viagens em família em momentos mágicos.",
        image: optimizeRemoteImageUrl('images/authors/ana-souza.jpg', 256, 256),
        social: {
            instagram: "https://www.instagram.com/anhangaviagens"
        }
    },
    "rafa-tech": {
        id: "rafa-tech",
        name: "Rafa Tech",
        role: "Especialista em Planejamento",
        bio: "Entusiasta de tecnologia e organização, focado em tornar cada etapa da viagem mais eficiente e tranquila.",
        image: optimizeRemoteImageUrl('images/authors/rafa-tech.jpg', 256, 256)
    },
    "luigi": {
        id: "luigi",
        name: "Chef Luigi",
        role: "Crítico Gastronômico",
        bio: "Viajante incansável em busca dos melhores sabores do mundo, da alta gastronomia à comida de rua.",
        image: optimizeRemoteImageUrl('images/authors/chef-luigi.jpg', 256, 256)
    },
    "mariana": {
        id: "mariana",
        name: "Mariana S.",
        role: "Consultora de Viagens Românticas",
        bio: "Especialista em destinos de luxo e roteiros personalizados para casais em busca de momentos únicos.",
        image: optimizeRemoteImageUrl('images/authors/mariana-s.jpg', 256, 256)
    },
    "carlos": {
        id: "carlos",
        name: "Carlos Viajante",
        role: "Explorador Cultural",
        bio: "Curioso por natureza, adora descobrir as histórias e tradições por trás de cada destino icônico.",
        image: optimizeRemoteImageUrl('images/authors/carlos-viajante.jpg', 256, 256)
    },
    "equipe-anhanga": {
        id: "equipe-anhanga",
        name: "Equipe Anhangá",
        role: "Especialistas em Viagens",
        bio: "Nossa equipe de especialistas compartilha as melhores dicas coletivas para sua próxima aventura.",
        image: "https://www.anhanga.tur.br/logo.png"
    }
};
