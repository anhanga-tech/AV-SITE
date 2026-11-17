/*
  Seletor "Quem vai?" do hub /parques-brasil.

  O h1 promete "só um serve para a sua família", e até aqui a página não
  perguntava nada sobre a família. O perfil (idades + dias) faz duas coisas:
  destaca os parques que encaixam e chega pré-preenchido no ContactModal, para
  o consultor receber o lead já qualificado.

  O encaixe de cada parque (`PARK_FIT`) sai da própria copy de constants.ts —
  "Rende mais para" e "Quantos dias". Não é ranking nem opinião nova: se a copy
  mudar, este mapa muda junto.
*/

export type AgeGroup = 'ate6' | 'de7a12' | 'adolescentes' | 'soAdultos';
export type DaysBucket = 'umDia' | 'doisATres' | 'quatroOuMais';

export const AGE_OPTIONS: ReadonlyArray<{ value: AgeGroup; label: string; detail: string }> = [
  { value: 'ate6', label: 'Crianças até 6 anos', detail: 'até 6 anos' },
  { value: 'de7a12', label: 'Crianças de 7 a 12', detail: '7 a 12 anos' },
  { value: 'adolescentes', label: 'Adolescentes', detail: 'adolescentes' },
  { value: 'soAdultos', label: 'Só adultos', detail: 'sem crianças' },
];

export const DAYS_OPTIONS: ReadonlyArray<{ value: DaysBucket; label: string }> = [
  { value: 'umDia', label: '1 dia' },
  { value: 'doisATres', label: '2 a 3 dias' },
  { value: 'quatroOuMais', label: '4 dias ou mais' },
];

export interface ParquesProfile {
  ages: AgeGroup[];
  days: DaysBucket | null;
}

export const EMPTY_PROFILE: ParquesProfile = { ages: [], days: null };

interface ParkFit {
  ages: AgeGroup[];
  days: DaysBucket[];
}

export const PARK_FIT: Record<string, ParkFit> = {
  // "Família com filhos de idades diferentes"; 2 dias de parque, 3 a 4 de roteiro.
  'beto-carrero': { ages: ['ate6', 'de7a12', 'adolescentes'], days: ['doisATres', 'quatroOuMais'] },
  // "Adolescente, adulto e criança grande… para filho pequeno rende menos"; "1 dia resolve".
  'hopi-hari': { ages: ['de7a12', 'adolescentes', 'soAdultos'], days: ['umDia', 'doisATres'] },
  // "Família que quer piscina o dia inteiro"; 2 a 3 dias.
  'thermas-dos-laranjais': { ages: ['ate6', 'de7a12', 'adolescentes', 'soAdultos'], days: ['doisATres'] },
  // "Parque e praia na mesma viagem"; 4 a 5 dias.
  'beach-park': { ages: ['ate6', 'de7a12', 'adolescentes', 'soAdultos'], days: ['quatroOuMais'] },
  // "Casal ou família… parque com descanso"; 3 a 4 dias.
  'hot-park': { ages: ['ate6', 'de7a12', 'adolescentes', 'soAdultos'], days: ['doisATres', 'quatroOuMais'] },
};

export function hasProfile(profile: ParquesProfile): boolean {
  return profile.ages.length > 0 || profile.days !== null;
}

/** "Só adultos" exclui as faixas de criança, e vice-versa. */
export function toggleAge(profile: ParquesProfile, age: AgeGroup): ParquesProfile {
  if (profile.ages.includes(age)) {
    return { ...profile, ages: profile.ages.filter((value) => value !== age) };
  }
  const ages =
    age === 'soAdultos' ? ['soAdultos' as const] : [...profile.ages.filter((value) => value !== 'soAdultos'), age];
  return { ...profile, ages };
}

export function toggleDays(profile: ParquesProfile, days: DaysBucket): ParquesProfile {
  return { ...profile, days: profile.days === days ? null : days };
}

/**
 * Slugs dos parques que servem para todas as faixas escolhidas e para os dias.
 * Sem perfil, devolve vazio: nada é destacado antes de a família responder.
 */
export function matchParks(profile: ParquesProfile, slugs: readonly string[]): string[] {
  if (!hasProfile(profile)) return [];
  return slugs.filter((slug) => {
    const fit = PARK_FIT[slug];
    if (!fit) return false;
    const agesOk = profile.ages.every((age) => fit.ages.includes(age));
    const daysOk = profile.days === null || fit.days.includes(profile.days);
    return agesOk && daysOk;
  });
}

/** Texto que vai para os campos "Idade das crianças" e "Quantos dias" do modal. */
export function profileToTripDetails(profile: ParquesProfile): { childrenAges?: string; tripDays?: string } {
  const details: { childrenAges?: string; tripDays?: string } = {};
  const ages = AGE_OPTIONS.filter((option) => profile.ages.includes(option.value)).map((option) => option.detail);
  if (ages.length > 0) details.childrenAges = ages.join(', ');
  const days = DAYS_OPTIONS.find((option) => option.value === profile.days);
  if (days) details.tripDays = days.label;
  return details;
}
