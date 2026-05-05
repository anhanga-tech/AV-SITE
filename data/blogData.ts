
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
    "queila-oliveira": {
        id: "queila-oliveira",
        name: "Queila de Oliveira",
        role: "Especialista em Viagens",
        bio: "Apaixonada por conectar pessoas aos destinos que vão transformar suas vidas. Especialista em roteiros personalizados e viagens em família.",
        social: {
            instagram: "https://www.instagram.com/anhangaviagens"
        }
    },
    "felipe-william": {
        id: "felipe-william",
        name: "Felipe William",
        role: "Consultor de Viagens",
        bio: "Explorador incansável e especialista em planejamento de roteiros internacionais. Acredita que cada viagem bem planejada é uma história inesquecível.",
        social: {
            instagram: "https://www.instagram.com/anhangaviagens"
        }
    }
};
