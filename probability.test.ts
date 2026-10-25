import test from 'node:test';
import assert from 'node:assert/strict';
import { nbOver, calculateValueBet, DISPERSION_CORNERS, DISPERSION_YELLOWS } from './probability.ts';

test('la probabilité augmente avec la moyenne attendue', () => {
  assert.ok(nbOver(12, 8.5, DISPERSION_CORNERS) > nbOver(9, 8.5, DISPERSION_CORNERS));
});

test('la probabilité baisse quand le seuil monte', () => {
  assert.ok(nbOver(5, 2.5, DISPERSION_YELLOWS) > nbOver(5, 3.5, DISPERSION_YELLOWS));
});

test('aucun plancher artificiel : une moyenne basse donne une probabilité basse', () => {
  assert.ok(nbOver(6, 8.5, DISPERSION_CORNERS) < 40);
});

test('la surdispersion réduit la confiance par rapport à une variance serrée', () => {
  // r grand ~ Poisson ; r petit = plus de variance, donc moins de certitude au-dessus de la moyenne
  assert.ok(nbOver(11, 8.5, 3) < nbOver(11, 8.5, 1000));
});

test('bornes 2..98 et moyenne nulle', () => {
  assert.equal(nbOver(0, 3.5, 9), 0);
  assert.ok(nbOver(40, 3.5, 9) <= 98);
});

test('value bet : seulement si l\'écart dépasse 10 points', () => {
  assert.equal(calculateValueBet(70, 2).is_value_bet, true); // 70 - 50 = 20
  assert.equal(calculateValueBet(55, 2).is_value_bet, false); // 5
  assert.equal(calculateValueBet(80, 1).is_value_bet, false); // cote invalide
});
