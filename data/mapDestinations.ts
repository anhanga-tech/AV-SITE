import { getDestinationImage } from './mediaConfig';

export interface Destination {
    coords: [number, number];
    image: string;
    city: string;
    country: string;
    rating: string;
    price: string;
    description: string;
    continent: string;
    details: string;
    activities: string[];
    landingPage?: string;
}

export const DESTINATIONS: Destination[] = [
    // --- AMÉRICAS ---
    {
        coords: [28.5383, -81.3792],
        image: getDestinationImage("Orlando"),
        city: "Orlando",
        landingPage: "/orlando",
        country: "EUA",
        rating: "4.98",
        price: "R$ 15.000",
        description: "Magia dos parques e compras",
        continent: "América do Norte",
        details: "A capital mundial da diversão.",
        activities: ["Disney", "Universal", "Compras"]
    },
    {
        coords: [18.5601, -68.3725],
        image: getDestinationImage("Punta Cana"),
        city: "Punta Cana",
        country: "Rep. Dominicana",
        rating: "4.95",
        price: "R$ 3.800",
        description: "Praias de areia branca",
        continent: "América Central",
        details: "Resorts All-Inclusive de luxo.",
        activities: ["Praia", "Mergulho", "Relax"]
    },
    {
        coords: [21.1619, -86.8515],
        image: getDestinationImage("Cancún"),
        city: "Cancún",
        country: "México",
        rating: "4.89",
        price: "R$ 4.100",
        description: "Caribe vibrante",
        continent: "América do Norte",
        details: "Beleza do Caribe e cultura Maia.",
        activities: ["Praia", "Festas", "História"]
    },
    // --- AMÉRICA DO SUL ---
    {
        coords: [-26.8041, -48.6521],
        image: getDestinationImage("Beto Carrero"),
        city: "Beto Carrero",
        landingPage: "/beto-carrero",
        country: "Brasil",
        rating: "4.92",
        price: "R$ 1.500",
        description: "Maior parque temático da AL",
        continent: "América do Sul",
        details: "Diversão garantida para toda a família em Santa Catarina.",
        activities: ["Hot Wheels", "FireWhip", "Zoológico"]
    },
    {
        coords: [-29.3738, -50.8764],
        image: getDestinationImage("Gramado"),
        city: "Gramado",
        country: "Brasil",
        rating: "4.91",
        price: "R$ 2.200",
        description: "Charme na Serra",
        continent: "América do Sul",
        details: "Europa no Brasil.",
        activities: ["Frio", "Chocolate", "Romance"]
    },
    {
        coords: [-22.9068, -43.1729],
        image: getDestinationImage("Rio de Janeiro"),
        city: "Rio de Janeiro",
        country: "Brasil",
        rating: "4.93",
        price: "R$ 1.900",
        description: "Cidade Maravilhosa",
        continent: "América do Sul",
        details: "Samba, praias icônicas e paisagens de tirar o fôlego.",
        activities: ["Cristo Redentor", "Praias", "Pão de Açúcar"]
    },
    {
        coords: [-5.7945, -35.2110],
        image: getDestinationImage("Natal"),
        city: "Natal",
        country: "Brasil",
        rating: "4.92",
        price: "R$ 2.300",
        description: "Cidade do Sol",
        continent: "América do Sul",
        details: "Dunas emocionantes, praias mornas e muito sol o ano todo.",
        activities: ["Genipabu", "Ponta Negra", "Buggy"]
    },
    {
        coords: [-13.1631, -72.5450],
        image: getDestinationImage("Cusco"),
        city: "Cusco",
        country: "Peru",
        rating: "4.98",
        price: "R$ 4.200",
        description: "Império Inca",
        continent: "América do Sul",
        details: "História viva, lhamas e os mistérios dos Andes.",
        activities: ["Machu Picchu", "Vale Sagrado", "História"]
    },
    {
        coords: [-33.4489, -70.6693],
        image: getDestinationImage("Santiago"),
        city: "Santiago",
        country: "Chile",
        rating: "4.88",
        price: "R$ 3.500",
        description: "Cordilheira e Vinhos",
        continent: "América do Sul",
        details: "Neve, vinhos premiados e modernidade aos pés dos Andes.",
        activities: ["Valle Nevado", "Vinícolas", "Cajón del Maipo"]
    },
    {
        coords: [10.3910, -75.4795],
        image: getDestinationImage("Cartagena"),
        city: "Cartagena",
        country: "Colômbia",
        rating: "4.90",
        price: "R$ 3.900",
        description: "Caribe Colonial",
        continent: "América do Sul",
        details: "Charme histórico, cores vibrantes e mar do Caribe.",
        activities: ["Cidade Murada", "Ilhas do Rosário", "Café"]
    },

    // --- EUROPA ---
    {
        coords: [48.8566, 2.3522],
        image: getDestinationImage("Paris"),
        city: "Paris",
        country: "França",
        rating: "4.92",
        price: "R$ 6.200",
        description: "Romance e história",
        continent: "Europa",
        details: "A Cidade Luz.",
        activities: ["Torre Eiffel", "Louvre", "Sena"]
    },
    {
        coords: [38.7223, -9.1393],
        image: getDestinationImage("Lisboa"),
        city: "Lisboa",
        country: "Portugal",
        rating: "4.96",
        price: "R$ 5.500",
        description: "História e fado",
        continent: "Europa",
        details: "Charme e azulejos.",
        activities: ["História", "Comida", "Vinho"]
    },
    {
        coords: [36.3932, 25.4615],
        image: getDestinationImage("Santorini"),
        city: "Santorini",
        country: "Grécia",
        rating: "4.97",
        price: "R$ 7.800",
        description: "Pôr do sol mágico",
        continent: "Europa",
        details: "Casinhas brancas e mar azul profundo.",
        activities: ["Vistas", "Vinho", "Praias"]
    },

    // --- ÁSIA ---
    {
        coords: [35.6762, 139.6503],
        image: getDestinationImage("Tóquio"),
        city: "Tóquio",
        country: "Japão",
        rating: "4.99",
        price: "R$ 8.500",
        description: "Tradição e Futuro",
        continent: "Ásia",
        details: "A metrópole mais fascinante do mundo.",
        activities: ["Tecnologia", "Templos", "Gastronomia"]
    },
    {
        coords: [-8.4095, 115.1889],
        image: getDestinationImage("Bali"),
        city: "Bali",
        country: "Indonésia",
        rating: "4.94",
        price: "R$ 6.800",
        description: "Paraíso Zen",
        continent: "Ásia",
        details: "Espiritualidade e natureza exuberante.",
        activities: ["Praias", "Templos", "Yoga"]
    },
    {
        coords: [25.2048, 55.2708],
        image: getDestinationImage("Dubai"),
        city: "Dubai",
        country: "Emirados Árabes",
        rating: "4.90",
        price: "R$ 7.200",
        description: "Luxo no Deserto",
        continent: "Ásia",
        details: "Arquitetura futurista e compras.",
        activities: ["Burj Khalifa", "Deserto", "Shoppings"]
    },
    {
        coords: [13.7563, 100.5018],
        image: getDestinationImage("Bangkok"),
        city: "Bangkok",
        country: "Tailândia",
        rating: "4.87",
        price: "R$ 5.500",
        description: "Templos Dourados",
        continent: "Ásia",
        details: "Cultura vibrante e comida de rua incrível.",
        activities: ["Grand Palace", "Massagem", "Street Food"]
    },

    // --- ÁFRICA ---
    {
        coords: [-33.9249, 18.4241],
        image: getDestinationImage("Cidade do Cabo"),
        city: "Cidade do Cabo",
        country: "África do Sul",
        rating: "4.88",
        price: "R$ 5.100",
        description: "Encontro de Oceanos",
        continent: "África",
        details: "Montanhas, vinhedos e pinguins.",
        activities: ["Table Mountain", "Vinhos", "Safári"]
    },
    {
        coords: [30.0444, 31.2357],
        image: getDestinationImage("Cairo"),
        city: "Cairo",
        country: "Egito",
        rating: "4.85",
        price: "R$ 5.900",
        description: "Berço da História",
        continent: "África",
        details: "Onde o passado encontra o presente.",
        activities: ["Pirâmides", "Nilo", "Museus"]
    },
    {
        coords: [31.6295, -7.9811],
        image: getDestinationImage("Marrakech"),
        city: "Marrakech",
        country: "Marrocos",
        rating: "4.89",
        price: "R$ 6.100",
        description: "Cores e Aromas",
        continent: "África",
        details: "Uma experiência sensorial única.",
        activities: ["Medina", "Jardins", "Deserto"]
    },

    // --- OCEANIA ---
    {
        coords: [-33.8688, 151.2093],
        image: getDestinationImage("Sydney"),
        city: "Sydney",
        country: "Austrália",
        rating: "4.92",
        price: "R$ 9.500",
        description: "Vibe Australiana",
        continent: "Oceania",
        details: "Praias urbanas e arquitetura icônica.",
        activities: ["Opera House", "Surf", "Cangurus"]
    },
    {
        coords: [-16.5004, -151.7415],
        image: getDestinationImage("Bora Bora"),
        city: "Bora Bora",
        country: "Polinésia Francesa",
        rating: "4.99",
        price: "R$ 12.000",
        description: "A Lagoa Azul",
        continent: "Oceania",
        details: "O destino definitivo de lua de mel.",
        activities: ["Bungalows", "Mergulho", "Relax"]
    }
];

export const FILTERS = ['Todos', 'América do Norte', 'América Central', 'América do Sul', 'Europa', 'Ásia', 'África', 'Oceania'];

export const CONTINENT_COLORS: Record<string, string> = {
    'América do Norte': '#0ea5e9',
    'América Central': '#06b6d4',
    'América do Sul': '#10b981',
    'Europa': '#10b981',
    'Ásia': '#f43f5e', // Rose
    'África': '#d97706', // Amber
    'Oceania': '#0891b2', // Cyan-700
};
