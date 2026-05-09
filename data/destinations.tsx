import Palmtree from 'lucide-react/dist/esm/icons/palmtree';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Baby from 'lucide-react/dist/esm/icons/baby';
import Compass from 'lucide-react/dist/esm/icons/compass';
import Users from 'lucide-react/dist/esm/icons/users';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

// --- DATA: COMPREHENSIVE DESTINATION LIST (IATA & TOURIST HOTSPOTS) ---
const DESTINATIONS_DATABASE = [
  // Brasil
  { label: "São Paulo, Brasil", city: "São Paulo" },
  { label: "Rio de Janeiro, Brasil", city: "Rio de Janeiro" },
  { label: "Gramado, Brasil", city: "Gramado" },
  { label: "Foz do Iguaçu, Brasil", city: "Foz do Iguaçu" },
  { label: "Salvador, Brasil", city: "Salvador" },
  { label: "Recife, Brasil", city: "Recife" },
  { label: "Fortaleza, Brasil", city: "Fortaleza" },
  { label: "Maceió, Brasil", city: "Maceió" },
  { label: "Porto Seguro, Brasil", city: "Porto Seguro" },
  { label: "Natal, Brasil", city: "Natal" },
  { label: "Fernando de Noronha, Brasil", city: "Noronha" },
  { label: "Florianópolis, Brasil", city: "Florianópolis" },
  { label: "Jericoacoara, Brasil", city: "Jericoacoara" },
  { label: "Bonito, Brasil", city: "Bonito" },
  { label: "Manaus, Brasil", city: "Manaus" },
  { label: "Brasília, Brasil", city: "Brasília" },
  { label: "Belo Horizonte, Brasil", city: "Belo Horizonte" },
  { label: "Curitiba, Brasil", city: "Curitiba" },
  { label: "Porto de Galinhas, Brasil", city: "Porto de Galinhas" },
  { label: "Maragogi, Brasil", city: "Maragogi" },
  { label: "Jalapão, Brasil", city: "Jalapão" },
  { label: "Lençóis Maranhenses, Brasil", city: "Lençóis" },

  // América do Norte
  { label: "Orlando, EUA", city: "Orlando" },
  { label: "Miami, EUA", city: "Miami" },
  { label: "Nova York, EUA", city: "Nova York" },
  { label: "Las Vegas, EUA", city: "Las Vegas" },
  { label: "Los Angeles, EUA", city: "Los Angeles" },
  { label: "São Francisco, EUA", city: "São Francisco" },
  { label: "Chicago, EUA", city: "Chicago" },
  { label: "Washington DC, EUA", city: "Washington" },
  { label: "Boston, EUA", city: "Boston" },
  { label: "Honolulu, Havaí", city: "Havaí" },
  { label: "Toronto, Canadá", city: "Toronto" },
  { label: "Vancouver, Canadá", city: "Vancouver" },
  { label: "Montreal, Canadá", city: "Montreal" },
  { label: "Quebec, Canadá", city: "Quebec" },
  { label: "Cancún, México", city: "Cancún" },
  { label: "Cidade do México, México", city: "Cidade do México" },
  { label: "Tulum, México", city: "Tulum" },
  { label: "Playa del Carmen, México", city: "Playa del Carmen" },

  // Caribe
  { label: "Punta Cana, Rep. Dominicana", city: "Punta Cana" },
  { label: "Aruba, Caribe", city: "Aruba" },
  { label: "Curaçao, Caribe", city: "Curaçao" },
  { label: "San Andrés, Colômbia", city: "San Andrés" },
  { label: "Havana, Cuba", city: "Havana" },
  { label: "Varadero, Cuba", city: "Varadero" },
  { label: "Nassau, Bahamas", city: "Bahamas" },
  { label: "Montego Bay, Jamaica", city: "Jamaica" },
  { label: "Saint Martin, Caribe", city: "Saint Martin" },

  // América do Sul
  { label: "Buenos Aires, Argentina", city: "Buenos Aires" },
  { label: "Bariloche, Argentina", city: "Bariloche" },
  { label: "Mendoza, Argentina", city: "Mendoza" },
  { label: "Ushuaia, Argentina", city: "Ushuaia" },
  { label: "Santiago, Chile", city: "Santiago" },
  { label: "Deserto do Atacama, Chile", city: "Atacama" },
  { label: "Montevidéu, Uruguai", city: "Montevidéu" },
  { label: "Punta del Este, Uruguai", city: "Punta del Este" },
  { label: "Lima, Peru", city: "Lima" },
  { label: "Cusco, Peru", city: "Cusco" },
  { label: "Machu Picchu, Peru", city: "Machu Picchu" },
  { label: "Bogotá, Colômbia", city: "Bogotá" },
  { label: "Cartagena, Colômbia", city: "Cartagena" },

  // Europa
  { label: "Lisboa, Portugal", city: "Lisboa" },
  { label: "Porto, Portugal", city: "Porto" },
  { label: "Algarve, Portugal", city: "Algarve" },
  { label: "Paris, França", city: "Paris" },
  { label: "Nice, França", city: "Nice" },
  { label: "Londres, Reino Unido", city: "Londres" },
  { label: "Roma, Itália", city: "Roma" },
  { label: "Milão, Itália", city: "Milão" },
  { label: "Veneza, Itália", city: "Veneza" },
  { label: "Florença, Itália", city: "Florença" },
  { label: "Madri, Espanha", city: "Madri" },
  { label: "Barcelona, Espanha", city: "Barcelona" },
  { label: "Ibiza, Espanha", city: "Ibiza" },
  { label: "Amsterdã, Holanda", city: "Amsterdã" },
  { label: "Berlim, Alemanha", city: "Berlim" },
  { label: "Munique, Alemanha", city: "Munique" },
  { label: "Dublin, Irlanda", city: "Dublin" },
  { label: "Atenas, Grécia", city: "Atenas" },
  { label: "Santorini, Grécia", city: "Santorini" },
  { label: "Mykonos, Grécia", city: "Mykonos" },
  { label: "Zurique, Suíça", city: "Zurique" },
  { label: "Praga, Rep. Tcheca", city: "Praga" },
  { label: "Budapeste, Hungria", city: "Budapeste" },
  { label: "Viena, Áustria", city: "Viena" },
  { label: "Istambul, Turquia", city: "Istambul" },
  { label: "Capadócia, Turquia", city: "Capadócia" },

  // Ásia, África e Oceania
  { label: "Dubai, Emirados Árabes", city: "Dubai" },
  { label: "Doha, Catar", city: "Doha" },
  { label: "Maldivas", city: "Maldivas" },
  { label: "Tóquio, Japão", city: "Tóquio" },
  { label: "Kyoto, Japão", city: "Kyoto" },
  { label: "Bangkok, Tailândia", city: "Bangkok" },
  { label: "Phuket, Tailândia", city: "Phuket" },
  { label: "Bali, Indonésia", city: "Bali" },
  { label: "Cidade do Cabo, África do Sul", city: "Cidade do Cabo" },
  { label: "Cairo, Egito", city: "Cairo" },
  { label: "Marrakech, Marrocos", city: "Marrakech" },
  { label: "Sydney, Austrália", city: "Sydney" },
  { label: "Auckland, Nova Zelândia", city: "Auckland" }
];

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Utility to normalize strings for search (lowercase, no accents).
 */
export const normalizeStr = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Pre-normalized destination database.
 */
export const PRE_NORMALIZED_DB = DESTINATIONS_DATABASE.map(d => ({
  ...d,
  nLabel: normalizeStr(d.label),
  nCity: normalizeStr(d.city)
}));

/**
 * Static Quick Features list.
 */
export const QUICK_FEATURES = [
  { text: "Roteiros Exclusivos", icon: Sparkles },
  { text: "Suporte 24/7", icon: Sparkles },
  { text: "Ótimos Preços", icon: Sparkles }
];

// Rich Options for UI
export const TRIP_OPTIONS = [
  { label: "Férias / Lazer", icon: Palmtree, color: "text-green-500", bg: "bg-green-50" },
  { label: "Lua de Mel", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
  { label: "Negócios", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Família", icon: Baby, color: "text-orange-500", bg: "bg-orange-50" },
  { label: "Aventura", icon: Compass, color: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "Grupo", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" }
];

export const BUDGET_TIERS = [
  { label: "Econômico", icon: DollarSign, level: 1, desc: "Essencial e inteligente", range: "até R$ 1,5 mil" },
  { label: "Conforto", icon: Wallet, level: 2, desc: "Equilíbrio ideal", range: "R$ 1,5-3 mil" },
  { label: "Luxo", icon: Gem, level: 3, desc: "Sofisticação e mimos", range: "R$ 3-5 mil" },
  { label: "Super Luxo", icon: Crown, level: 4, desc: "Exclusividade total", range: "R$ 5 mil+" }
];

/**
 * Calendar Logic
 */
export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};
