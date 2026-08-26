import { WhatsappLogo, Compass, Globe, ShieldCheck, SimCard, CalendarCheck, type Icon } from '@phosphor-icons/react';

// Mora fora de LinkButton.tsx para manter aquele arquivo exportando só o componente — exports
// não-componente quebram o Fast Refresh (react-doctor/only-export-components).
export const ICON_MAP: Record<string, Icon> = {
    WhatsappLogo,
    Compass,
    Globe,
    ShieldCheck,
    SimCard,
    CalendarCheck,
};

// Um `icon` fora do mapa falha em silêncio: o botão perde o ícone, mas mantém seu tier (definido
// por `highlight`/`primary` em LinkButton.tsx, não pelo ícone). Validado em teste sobre os dados,
// não em produção.
export function isSupportedIcon(name: string): boolean {
    return Object.hasOwn(ICON_MAP, name);
}
