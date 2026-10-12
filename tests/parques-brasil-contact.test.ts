import test from 'node:test';
import assert from 'node:assert/strict';

import { BOOKABLE_PARKS } from '../components/parques-brasil/constants.ts';
import { parquesContactOptions } from '../components/parques-brasil/contact.ts';
import { REGION_TAG, resolveRegionTagsFromText } from '../lib/destination-region.ts';
import { buildLeadFields, leadInputFromSubmitContact } from '../lib/odoo-lead-mapping.ts';
import { appendTripDetailsToMessage } from '../utils/contactForm.ts';
import type { LeadUtms } from '../types/leadCapture.ts';

const EMPTY_UTMS: LeadUtms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

for (const park of BOOKABLE_PARKS) {
  test(`card do ${park.name}: o lead chega ao Odoo com o nome do parque`, () => {
    const options = parquesContactOptions(park);
    assert.equal(options.askTripDetails, true);
    assert.match(options.message ?? '', new RegExp(park.name));

    const input = leadInputFromSubmitContact({
      firstName: 'Ana',
      whatsapp: '+5511999990000',
      emailOptIn: false,
      source: options.source,
      destination: options.destination,
      childrenAges: '4 e 9 anos',
      tripDays: '4 dias',
      utms: EMPTY_UTMS,
    });
    const lead = buildLeadFields(input, 1);

    assert.match(String(lead.x_destino), new RegExp(park.name));
    assert.match(String(lead.name), new RegExp(park.name));
    assert.match(String(lead.description), /Idade das crianças: 4 e 9 anos/);
    assert.match(String(lead.description), /Dias disponíveis: 4 dias/);
  });
}

test('destinos do hub são classificados como Brasil no Odoo', () => {
  for (const park of BOOKABLE_PARKS) {
    assert.deepEqual(resolveRegionTagsFromText(parquesContactOptions(park).destination), [REGION_TAG.brasil]);
  }
  assert.deepEqual(resolveRegionTagsFromText(parquesContactOptions().destination), [REGION_TAG.brasil]);
});

test('CTA final pede idade e dias, que é o que a copy promete', () => {
  assert.equal(parquesContactOptions().askTripDetails, true);
  assert.ok(parquesContactOptions().destination);
});

test('appendTripDetailsToMessage acrescenta só as respostas preenchidas', () => {
  assert.equal(appendTripDetailsToMessage('Olá!', {}), 'Olá!');
  assert.equal(appendTripDetailsToMessage('Olá!', { childrenAges: '  ', tripDays: '' }), 'Olá!');
  assert.equal(
    appendTripDetailsToMessage('Olá!', { childrenAges: ' 4 e 9 ', tripDays: '3 dias' }),
    'Olá!\nIdade das crianças: 4 e 9\nDias disponíveis: 3 dias',
  );
  assert.equal(appendTripDetailsToMessage('Olá!', { tripDays: '3 dias' }), 'Olá!\nDias disponíveis: 3 dias');
});
