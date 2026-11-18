import { openContactModal, type ContactModalOptions } from '../../utils/contactForm';
import type { Park } from './constants';
import { profileToTripDetails, type ParquesProfile } from './profile';

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
export function parquesContactOptions(
  park?: Pick<Park, 'name' | 'city' | 'state'>,
  profile?: ParquesProfile,
): ContactModalOptions {
  const options: ContactModalOptions = park
    ? {
        source: PARQUES_CTA_SOURCE,
        destination: `${PARQUES_DESTINATION_LABEL} · ${park.name}`,
        message: `Olá! Quero ajuda para montar uma viagem ao ${park.name}, em ${park.city} (${park.state}).`,
        askTripDetails: true,
      }
    : {
        source: PARQUES_CTA_SOURCE,
        destination: `${PARQUES_DESTINATION_LABEL} · ainda escolhendo`,
        message: UNDECIDED_WHATSAPP_MESSAGE,
        askTripDetails: true,
      };
  // O que a família respondeu no "Quem vai?" chega preenchido no modal: o
  // consultor recebe idade e dias sem a pessoa digitar de novo.
  const tripDetails = profile ? profileToTripDetails(profile) : {};
  if (tripDetails.childrenAges || tripDetails.tripDays) options.tripDetails = tripDetails;
  return options;
}

/*
  Único ponto do hub que abre o ContactModal. Hero, cards e CTA final passam
  por aqui, então mudar o que o lead carrega (source, parque) é uma edição só.
  Com `park`, o modal mostra "Sobre: Parques do Brasil · <parque>"; sem ele, é
  a dúvida genérica de "qual escolher".
*/
export function openParquesContact(park?: Pick<Park, 'name' | 'city' | 'state'>, profile?: ParquesProfile): void {
  openContactModal(parquesContactOptions(park, profile));
}
