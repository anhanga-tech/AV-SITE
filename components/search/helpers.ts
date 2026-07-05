import { BUDGET_TIERS } from '../../data/destinations';

export const isDateInPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const formatDateDisplay = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const getGuestSummary = (adults: number, children: number): string => {
  return `${adults} Adulto${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Chd` : ''}`;
};

export const buildSearchMessage = (params: {
  inputValue: string;
  startDate: Date | null;
  endDate: Date | null;
  adults: number;
  children: number;
  childAges: string[];
  tripType: string;
  budget: string;
}): string => {
  const startStr = params.startDate ? params.startDate.toLocaleDateString('pt-BR') : 'Datas flexíveis';
  const endStr = params.endDate ? params.endDate.toLocaleDateString('pt-BR') : 'A definir';
  const childAgesStr = params.children > 0
    ? ` (${params.childAges.map((age) => age ? `${age} anos` : 'Idade N/I').join(', ')})`
    : '';

  let message = 'Olá! Gostaria de um orçamento para minha próxima viagem:\n\n';
  message += `📍 *Destino:* ${params.inputValue}\n`;
  message += `📅 *Ida:* ${startStr}\n`;
  message += `📅 *Volta:* ${endStr}\n`;
  message += `👥 *Viajantes:* ${params.adults} Adt, ${params.children} Chd${childAgesStr}\n`;

  if (params.tripType) {
    message += `🎭 *Tipo de Viagem:* ${params.tripType}\n`;
  }

  if (params.budget) {
    const selectedBudget = BUDGET_TIERS.find((tier) => tier.label === params.budget);
    message += `💰 *Orçamento:* ${selectedBudget?.range || params.budget}\n`;
  }

  return message;
};
