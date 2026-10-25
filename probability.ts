// Moteur de probabilités (sans dépendance), testé dans probability.test.ts.

// Loi binomiale négative (moyenne mu, paramètre de dispersion r) : plus réaliste que Poisson
// pour les corners et cartons, dont la variance dépasse la moyenne.
export const DISPERSION_CORNERS = 12;
export const DISPERSION_YELLOWS = 9;
export function nbOver(mu: number, threshold: number, r: number): number {
  if (mu <= 0) return 0;
  const q = mu / (r + mu);
  let pmf = Math.pow(1 - q, r);
  let cdf = 0;
  const maxK = Math.floor(threshold);
  for (let k = 0; k <= maxK; k++) {
    cdf += pmf;
    pmf = (pmf * (k + r) / (k + 1)) * q;
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
