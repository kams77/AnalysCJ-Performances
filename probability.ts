// Moteur de probabilités (sans dépendance), testé dans probability.test.ts.

// Loi binomiale négative (moyenne mu, dispersion r). r = Infinity => Poisson.
// Paramètres MESURÉS par backtest walk-forward (voir backtest/RESULTATS.md) :
//  - corners du match et cartons : quasi-Poisson une fois la moyenne bien estimée,
//  - corners d'une seule équipe : plus dispersés (r ≈ 12).
export const DISPERSION_CORNERS_TOTAL = 80;
export const DISPERSION_CORNERS_TEAM = 12;
export const DISPERSION_YELLOWS = Infinity;
export function nbOver(mu: number, threshold: number, r: number): number {
  if (mu <= 0) return 0;
  const poisson = !Number.isFinite(r);
  const q = poisson ? 0 : mu / (r + mu);
  let pmf = poisson ? Math.exp(-mu) : Math.pow(1 - q, r);
  let cdf = 0;
  const maxK = Math.floor(threshold);
  for (let k = 0; k <= maxK; k++) {
    cdf += pmf;
    pmf = poisson ? (pmf * mu) / (k + 1) : (pmf * (k + r) / (k + 1)) * q;
  }
  return Math.min(98, Math.max(2, Math.round((1 - cdf) * 100)));
}

// Calcul de Valeur Nette (Value Bet / Edge Mathématique vs Bookmaker)
export function calculateValueBet(probaReelle: number, coteNgenge: number): { proba_bookmaker: number; value_net: number; is_value_bet: boolean } {
  if (!(coteNgenge > 1)) return { proba_bookmaker: 100, value_net: probaReelle - 100, is_value_bet: false };
  const proba_bookmaker = Math.round((1 / coteNgenge) * 100);
  const value_net = probaReelle - proba_bookmaker;
  return {
    proba_bookmaker,
    value_net,
    is_value_bet: value_net >= 10,
  };
}
