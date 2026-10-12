import { openContactModal, type ContactModalOptions } from '../../utils/contactForm';
import type { Park } from './constants';

export const PARQUES_CTA_SOURCE = 'parques-brasil';
export const PARQUES_DESTINATION_LABEL = 'Parques do Brasil';

/** Também usada no link direto "Prefiro WhatsApp" do CTA final. */
export const UNDECIDED_WHATSAPP_MESSAGE =
  'Olá! Estou escolhendo um parque no Brasil para viajar com a família e queria ajuda para decidir.';

/*
  Contexto que cada CTA do hub entrega ao ContactModal.

  `destination` vira o x_destino e o título da oportunidade no Odoo, e é o que
  o consultor lê primeiro. O prefixo "Parques do Brasil" faz a
  auto-classificação de região (lib/destination-region.ts) marcar Brasil — o
  nome do parque sozinho ("Beach Park") não casa com nenhuma região.

  Todos pedem idade das crianças e dias: é o que a copy do CTA final promete
  usar para responder.
*/
export function parquesContactOptions(park?: Pick<Park, 'name' | 'city' | 'state'>): ContactModalOptions {
  if (!park) {
    return {
      source: PARQUES_CTA_SOURCE,
      destination: `${PARQUES_DESTINATION_LABEL} · ainda escolhendo`,
      message: UNDECIDED_WHATSAPP_MESSAGE,
      askTripDetails: true,
    };
  }
  return {
    source: PARQUES_CTA_SOURCE,
    destination: `${PARQUES_DESTINATION_LABEL} · ${park.name}`,
    message: `Olá! Quero ajuda para montar uma viagem ao ${park.name}, em ${park.city} (${park.state}).`,
    askTripDetails: true,
  };
}

/*
  Único ponto do hub que abre o ContactModal. Hero, cards e CTA final passam
  por aqui, então mudar o que o lead carrega (source, parque) é uma edição só.
  Com `park`, o modal mostra "Sobre: Parques do Brasil · <parque>"; sem ele, é
  a dúvida genérica de "qual escolher".
*/
export function openParquesContact(park?: Pick<Park, 'name' | 'city' | 'state'>): void {
  openContactModal(parquesContactOptions(park));
}
