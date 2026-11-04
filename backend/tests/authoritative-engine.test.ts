import test from 'node:test';
import assert from 'node:assert/strict';
import { DeckGenerator } from '../src/engine/DeckGenerator';

test('Motor de Juego y Generador de Mazo Autoritativo', async (t) => {
  await t.test('DeckGenerator genera cartas en pares consistentes para cada modo', () => {
    const classicEasy = DeckGenerator.generate('classic', 'easy');
    assert.ok(classicEasy.length > 0, 'Debe generar cartas');
    assert.equal(classicEasy.length % 2, 0, 'El mazo debe ser par');

    // Contar ocurrencias de cada valor de carta
    const valueCounts: Record<string, number> = {};
    for (const card of classicEasy) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }

    // Cada valor debe aparecer exactamente 2 veces
    for (const [val, count] of Object.entries(valueCounts)) {
      assert.equal(count, 2, `El valor ${val} debe tener exactamente 2 cartas (un par)`);
    }
  });

  await t.test('DeckGenerator para modo tríadas genera cartas en tríos de 3', () => {
    const triadasCards = DeckGenerator.generate('triads', 'medium');
    assert.ok(triadasCards.length > 0);
    assert.equal(triadasCards.length % 3, 0, 'El mazo de tríadas debe ser divisible por 3');

    const valueCounts: Record<string, number> = {};
    for (const card of triadasCards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }

    for (const [val, count] of Object.entries(valueCounts)) {
      assert.equal(count, 3, `El valor ${val} debe aparecer exactamente 3 veces`);
    }
  });
});
