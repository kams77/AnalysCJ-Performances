# Backtest d'efficacité : corners et cartons jaunes

Test **walk-forward** : chaque prédiction n'utilise que les matchs précédents (aucune fuite du futur).
Les paramètres sont réglés sur les saisons 2010-2020, puis évalués sur **2021-2025 (10 305 matchs, 6 championnats : PL, Ligue 1, Serie A, Bundesliga, Liga, Liga Portugal ; 61 830 prédictions sur 6 marchés)**.

Données : [xgabora/Club-Football-Match-Data-2000-2025](https://github.com/xgabora/Club-Football-Match-Data-2000-2025) (issues de football-data.co.uk).
Reproduire : `git clone` du dépôt de données puis `python3 backtest/backtest.py <Matches.csv> backtest/result.json`.

## Résultats (période test)

| Modèle | Brier (plus bas = mieux) | Gain vs taux de base |
|---|---|---|
| Ancienne app v3.2 (planchers 82-91 %, Poisson, boost ailiers) | 0,258 | **−17,5 %** (pire que ne rien modéliser) |
| App après 1er correctif (binomiale négative r=12/9, boost) | 0,216 | +1,6 % |
| **Modèle amélioré** (forces d'équipe lissées, dispersion mesurée) | **0,211** | **+4,1 %** |
| Référence naïve (taux de base du championnat) | 0,220 | 0 % |

### Les sélections « ≥ 80 % » tiennent-elles leur promesse ?

| Modèle | Part des prédictions ≥ 80 % | Probabilité annoncée | Réussite réelle |
|---|---|---|---|
| Ancienne app v3.2 | 100 % | 85,6 % | **66,1 %** |
| App après 1er correctif | 12,8 % | 83,8 % | 78,5 % |
| **Modèle amélioré** | 12,1 % | 85,1 % | **83,5 %** |
| Référence naïve (taux de base) | 11,5 % | 84,3 % | 81,6 % |

Calibration du modèle amélioré : annoncé 31 % → réel 27 % ; 45 % → 45 % ; 58 % → 60 % ; 72 % → 72 % ; 85 % → 83,5 %.

### Boost « ailiers » (PSG, Real, Liverpool…)

Erreur moyenne sur les corners totaux (réel − prédit) : avec boost −2,4 sur les matchs concernés (−0,7 sans) ; sans boost −0,7 / +0,2. Le boost surestimait de ~2 corners par match : **neutralisé**.

### Dispersion mesurée
Corners du match : quasi-Poisson (r ≈ 80). Corners d'une équipe : r ≈ 12. Cartons : Poisson. Les valeurs précédentes (r=12/9) étaient trop dispersées.

## Conclusion

- L'ancienne app était **trompeuse** : elle annonçait ~86 % pour des paris qui passaient 2 fois sur 3.
- Le modèle amélioré est **honnête et bien calibré** : quand il annonce ~85 %, ça passe ~83,5 % du temps.
- Mais son **avantage sur une simple moyenne de championnat est faible** (+4 % de Brier ; ~+2 points de réussite sur les picks ≥ 80 %). Les picks ≥ 80 % sont surtout des lignes basses (ex. plus de 2,5 cartons) qui passent presque toujours, avec ou sans modèle.
- **Rentabilité non mesurable ici** : le jeu de données n'a pas de cotes pour les corners et cartons. Un pick à 83,5 % n'est rentable que si la cote dépasse ~1,20 **et** que la marge du bookmaker ne mange pas l'écart. À vérifier avec les vraies cotes avant tout pari.

## Limites
- Le modèle amélioré s'appuie sur l'historique match par match de chaque équipe ; la base interne de l'app (≈23 matchs figés) ne le permet pas. L'app applique donc les paramètres mesurés (dispersion, moyennes par championnat, sans boost) mais pas les forces d'équipe dynamiques.
- Arbitre, blessés, enjeu et météo ne sont pas modélisés. 6 championnats seulement.
