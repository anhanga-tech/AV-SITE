/**
 * Testimonial data shared between Testimonials.tsx (UI) and Home.tsx (ServiceSchema).
 * Centralising here prevents ratingValue/reviewCount in the schema from drifting
 * out of sync when new testimonials are added or removed.
 */

import { getMediaUrl } from './mediaConfig';

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
    image: getMediaUrl('images/testimonials/daryw-m.svg'),
    bg: 'bg-yellow-50',
    rotate: '-rotate-2',
    date: '2025-12-15',
    ratingValue: 5,
  },
  {
    name: 'Rafa & Gabi',
    destination: 'Paraty',
    text: 'Chegamos no hotel e havia uma surpresa. Atendimento impecável do início ao fim.',
    image: getMediaUrl('images/testimonials/rafa-gabi.svg'),
    bg: 'bg-blue-50',
    rotate: 'rotate-1',
    date: '2025-11-20',
    ratingValue: 5,
  },
  {
    name: 'William S.',
    destination: 'Alemanha',
    text: 'Viagem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente.',
    image: getMediaUrl('images/testimonials/william-s.svg'),
    bg: 'bg-emerald-50',
    rotate: '-rotate-1',
    date: '2025-10-10',
    ratingValue: 5,
  },
];
