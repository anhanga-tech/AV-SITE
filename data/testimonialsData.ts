/**
 * Testimonial data shared between Testimonials.tsx (UI) and Home.tsx (ServiceSchema).
 * Centralising here prevents ratingValue/reviewCount in the schema from drifting
 * out of sync when new testimonials are added or removed.
 */

export interface TestimonialItem {
  name: string;
  destination: string;
  text: string;
  image: string;
  bg: string;
  rotate: string;
  date: string;
  /** Numeric rating out of 5. All current testimonials are 5-star. */
  ratingValue: number;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Daryw M.',
    destination: 'Finlândia',
    text: 'Desde o primeiro contato, senti um acolhimento e atendimento diferente e especial.',
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Daryw&backgroundColor=b6e3f4',
    bg: 'bg-yellow-50',
    rotate: '-rotate-2',
    date: '2025-12-15',
    ratingValue: 5,
  },
  {
    name: 'Rafa & Gabi',
    destination: 'Paraty',
    text: 'Chegamos no hotel e havia uma surpresa. Atendimento impecável do início ao fim.',
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=CarlosFer&backgroundColor=ffdfbf',
    bg: 'bg-blue-50',
    rotate: 'rotate-1',
    date: '2025-11-20',
    ratingValue: 5,
  },
  {
    name: 'William S.',
    destination: 'Alemanha',
    text: 'Viagem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente.',
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Roberto&backgroundColor=c0aede',
    bg: 'bg-emerald-50',
    rotate: '-rotate-1',
    date: '2025-10-10',
    ratingValue: 5,
  },
];

/** The highest ratingValue across all testimonials (used in ServiceSchema). */
export const TESTIMONIAL_MAX_RATING = Math.max(...TESTIMONIALS.map((t) => t.ratingValue));
