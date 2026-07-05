import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchMessage } from '../components/search/helpers.ts';

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
