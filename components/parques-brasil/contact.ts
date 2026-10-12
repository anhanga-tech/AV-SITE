import { openContactModal } from '../../utils/contactForm';
import type { Park } from './constants';

export const PARQUES_CTA_SOURCE = 'parques-brasil';

/*
  Único ponto do hub que abre o ContactModal. Hero, cards e CTA final passam
  por aqui, então mudar o que o lead carrega (source, parque) é uma edição só.
  Com `park`, o modal mostra "Sobre: <parque>" e o nome segue como
  `destination` para o CRM; sem ele, é a dúvida genérica de "qual escolher".
*/
export function openParquesContact(park?: Pick<Park, 'name'>): void {
  openContactModal(
    park ? { source: PARQUES_CTA_SOURCE, destination: park.name } : { source: PARQUES_CTA_SOURCE },
  );
}
