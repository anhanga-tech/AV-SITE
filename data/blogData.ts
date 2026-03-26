
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
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        social: {
            instagram: "https://www.instagram.com/anhangaviagens"
        }
    },
    "rafa-tech": {
        id: "rafa-tech",
        name: "Rafa Tech",
        role: "Especialista em Planejamento",
        bio: "Entusiasta de tecnologia e organização, focado em tornar cada etapa da viagem mais eficiente e tranquila.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "luigi": {
        id: "luigi",
        name: "Chef Luigi",
        role: "Crítico Gastronômico",
        bio: "Viajante incansável em busca dos melhores sabores do mundo, da alta gastronomia à comida de rua.",
        image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=256&q=80"
    },
    "mariana": {
        id: "mariana",
        name: "Mariana S.",
        role: "Consultora de Viagens Românticas",
        bio: "Especialista em destinos de luxo e roteiros personalizados para casais em busca de momentos únicos.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "carlos": {
        id: "carlos",
        name: "Carlos Viajante",
        role: "Explorador Cultural",
        bio: "Curioso por natureza, adora descobrir as histórias e tradições por trás de cada destino icônico.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "equipe-anhanga": {
        id: "equipe-anhanga",
        name: "Equipe Anhangá",
        role: "Especialistas em Viagens",
        bio: "Nossa equipe de especialistas compartilha as melhores dicas coletivas para sua próxima aventura.",
        image: "https://www.anhanga.tur.br/logo.png"
    }
};

