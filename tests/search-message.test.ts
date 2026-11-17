import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchMessage, formatDateDisplay, formatDateLabel } from '../components/search/helpers.ts';

test('buildSearchMessage uses flexible dates when no start date is selected', () => {
  const message = buildSearchMessage({
    inputValue: 'Orlando',
    startDate: null,
    endDate: null,
    adults: 2,
    children: 0,
    childAges: [],
    tripType: '',
    budget: '',
  });

  assert.match(message, /Destino:\* Orlando/);
  assert.match(message, /Ida:\* Datas flexíveis/);
});

test('formatDateLabel spells out weekday, day, month and year for screen readers', () => {
  const label = formatDateLabel(new Date(2026, 10, 12));

  assert.match(label, /quinta-feira/);
  assert.match(label, /12 de novembro de 2026/);
});

test('cached date formatters match toLocaleDateString output across repeated calls', () => {
  const dates = [new Date(2026, 0, 1), new Date(2026, 10, 12), new Date(2027, 11, 31)];

  for (const date of dates) {
    assert.equal(formatDateDisplay(date), date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }));
    assert.equal(
      formatDateLabel(date),
      date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    );
  }
  assert.equal(formatDateDisplay(null), '');
});
