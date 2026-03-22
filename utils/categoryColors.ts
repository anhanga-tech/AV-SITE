const CATEGORY_COLORS: Record<string, string> = {
    'Disney': 'text-blue-700 bg-blue-50 border-blue-200',
    'Viagem': 'text-cyan-700 bg-cyan-50 border-cyan-200',
    'Gastronomia': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'Lua de Mel': 'text-pink-700 bg-pink-50 border-pink-200',
    'Nova York': 'text-blue-700 bg-blue-50 border-blue-200',
    'Festivais': 'text-purple-700 bg-purple-50 border-purple-200',
    'Carnaval': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'Cruzeiros': 'text-cyan-700 bg-cyan-50 border-cyan-200',
    'Dicas de Viagem': 'text-brand-dark bg-brand-yellow/10 border-brand-yellow',
};
const DEFAULT_COLOR = 'text-brand-dark bg-brand-yellow/10 border-brand-yellow';

export function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}
