"""Backtest walk-forward des marchés Corners / Cartons jaunes.

Chaque prédiction n'utilise que les matchs PRÉCÉDENTS (aucune fuite du futur).
Données : xgabora/Club-Football-Match-Data-2000-2025 (issues de football-data.co.uk).
Usage : python3 backtest.py <Matches.csv> [sortie.json]
"""
import sys, json, math
import numpy as np
import pandas as pd
from scipy.stats import nbinom, poisson

CSV = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else None
DIVS = ['E0', 'F1', 'I1', 'D1', 'SP1', 'P1']
TRAIN = range(2010, 2021)   # saisons de réglage (dispersion, lissage)
TEST = range(2021, 2026)    # saisons de test, jamais vues pendant le réglage

d = pd.read_csv(CSV, low_memory=False)
d = d[d.Division.isin(DIVS)].dropna(subset=['HomeCorners', 'AwayCorners', 'HomeYellow', 'AwayYellow']).copy()
d['MatchDate'] = pd.to_datetime(d['MatchDate'])
d = d.sort_values('MatchDate').reset_index(drop=True)
d['season'] = np.where(d.MatchDate.dt.month >= 7, d.MatchDate.dt.year, d.MatchDate.dt.year - 1)
d = d[d.season <= 2025].reset_index(drop=True)

WING = ['paris', 'psg', 'real', 'barcelone', 'barca', 'manchester city', 'man city', 'arsenal', 'liverpool',
        'bayern', 'dortmund', 'benfica', 'sporting', 'inter', 'chelsea', 'milan', 'juventus', 'tottenham', 'aston villa']
def wing(n): n = n.lower(); return any(k in n for k in WING)

# marchés : (clé, type, seuil) ; type = 'tc' total corners, 'hc' domicile corners, 'ty' total cartons, 'ay' cartons extérieur
MARKETS = [('corners_tot_8.5', 'tc', 8.5), ('corners_tot_7.5', 'tc', 7.5), ('corners_dom_4.5', 'hc', 4.5),
           ('cartons_tot_3.5', 'ty', 3.5), ('cartons_tot_2.5', 'ty', 2.5), ('cartons_ext_1.5', 'ay', 1.5)]
FLOOR = {'corners_tot_8.5': 82, 'corners_tot_7.5': 88, 'corners_dom_4.5': 81,
         'cartons_tot_3.5': 83, 'cartons_tot_2.5': 91, 'cartons_ext_1.5': 85}

def outcome(row, typ, thr):
    v = {'tc': row.HomeCorners + row.AwayCorners, 'hc': row.HomeCorners,
         'ty': row.HomeYellow + row.AwayYellow, 'ay': row.AwayYellow}[typ]
    return 1 if v > thr else 0

def p_over_pois(mu, thr):
    return float(1 - poisson.cdf(math.floor(thr), max(mu, 1e-6)))

def p_over_nb(mu, thr, r):
    mu = max(mu, 1e-6)
    return float(1 - nbinom.cdf(math.floor(thr), r, r / (r + mu)))

def run_states(decay, k):
    """Passe chronologique : renvoie, pour chaque match, les moyennes attendues (modèle amélioré) et
    les moyennes brutes d'équipe (modèle de l'ancienne app), calculées AVANT de voir le match."""
    st = {}   # (div, team) -> [W, cf, ca, yf, ya]
    lg = {}   # div -> [W, hc, ac, hy, ay] cumul pondéré (domicile/extérieur)
    rows = []
    for row in d.itertuples(index=False):
        div = row.Division
        L = lg.setdefault(div, [0.0, 0.0, 0.0, 0.0, 0.0])
        h = st.setdefault((div, row.HomeTeam), [0.0, 0.0, 0.0, 0.0, 0.0])
        a = st.setdefault((div, row.AwayTeam), [0.0, 0.0, 0.0, 0.0, 0.0])
        ok = L[0] > 50 and h[0] >= 5 and a[0] >= 5
        rec = None
        if ok:
            lhc, lac, lhy, lay = (L[1] / L[0], L[2] / L[0], L[3] / L[0], L[4] / L[0])
            lc_t = (lhc + lac) / 2; ly_t = (lhy + lay) / 2
            def sh(num, W, prior): return (num + k * prior) / (W + k)
            h_cf = sh(h[1], h[0], lc_t); h_ca = sh(h[2], h[0], lc_t); a_cf = sh(a[1], a[0], lc_t); a_ca = sh(a[2], a[0], lc_t)
            h_yf = sh(h[3], h[0], ly_t); h_ya = sh(h[4], h[0], ly_t); a_yf = sh(a[3], a[0], ly_t); a_ya = sh(a[4], a[0], ly_t)
            mu_hc = lhc * (h_cf / lc_t) * (a_ca / lc_t)
            mu_ac = lac * (a_cf / lc_t) * (h_ca / lc_t)
            mu_hy = lhy * (h_yf / ly_t) * (a_ya / ly_t)
            mu_ay = lay * (a_yf / ly_t) * (h_ya / ly_t)
            # moyennes brutes (comme la base statique de l'ancienne app : corners/cartons "pour" de chaque équipe)
            raw = (h[1] / h[0], a[1] / a[0], h[3] / h[0], a[3] / a[0])
            rec = dict(mu_hc=mu_hc, mu_ac=mu_ac, mu_hy=mu_hy, mu_ay=mu_ay, raw=raw)
        rows.append(rec)
        w = decay
        for x in (h, a, L):
            for i in range(5): x[i] *= w if x is not L else 0.999
        h[0] += 1; h[1] += row.HomeCorners; h[2] += row.AwayCorners; h[3] += row.HomeYellow; h[4] += row.AwayYellow
        a[0] += 1; a[1] += row.AwayCorners; a[2] += row.HomeCorners; a[3] += row.AwayYellow; a[4] += row.HomeYellow
        L[0] += 1; L[1] += row.HomeCorners; L[2] += row.AwayCorners; L[3] += row.HomeYellow; L[4] += row.AwayYellow
    return rows

def mus_for(rec, typ):
    if typ == 'tc': return rec['mu_hc'] + rec['mu_ac']
    if typ == 'hc': return rec['mu_hc']
    if typ == 'ty': return rec['mu_hy'] + rec['mu_ay']
    return rec['mu_ay']

_TRAIN_ROWS = None
def train_arrays(rows):
    out = {t: ([], []) for t in ('tc', 'hc', 'ty', 'ay')}
    for rec, row in zip(rows, d.itertuples(index=False)):
        if rec is None or row.season not in TRAIN: continue
        for t in out:
            v = {'tc': row.HomeCorners + row.AwayCorners, 'hc': row.HomeCorners, 'ty': row.HomeYellow + row.AwayYellow, 'ay': row.AwayYellow}[t]
            out[t][0].append(max(mus_for(rec, t), 1e-6)); out[t][1].append(int(v))
    return {t: (np.array(m), np.array(v)) for t, (m, v) in out.items()}

def fit_dispersion(rows, typ, thr_unused=None):
    mu, v = train_arrays(rows)[typ]
    best = None
    for r in [3, 5, 8, 12, 20, 30, 50, 80, 150, 400, 5000]:
        ll = float(nbinom.logpmf(v, r, r / (r + mu)).sum())
        if best is None or ll > best[1]: best = (r, ll, len(v))
    return best

def logloss_train(rows, rmap):
    arr = train_arrays(rows); tot = 0.0; n = 0
    for key, typ, thr in MARKETS:
        mu, v = arr[typ]
        p = np.clip(1 - nbinom.cdf(math.floor(thr), rmap[typ], rmap[typ] / (rmap[typ] + mu)), 1e-4, 1 - 1e-4)
        y = (v > thr).astype(float)
        tot += float(-(y * np.log(p) + (1 - y) * np.log(1 - p)).sum()); n += len(y)
    return tot / n

best = None
for decay in (0.97, 0.985, 0.995):
    for k in (3, 8, 16):
        rows = run_states(decay, k)
        rmap0 = {t: 30 for t in ('tc', 'hc', 'ty', 'ay')}
        ll = logloss_train(rows, rmap0)
        print(f'réglage decay={decay} k={k} logloss_train={ll:.4f}', flush=True)
        if best is None or ll < best[0]: best = (ll, decay, k, rows)
_, DECAY, K, ROWS = best
RMAP = {t: fit_dispersion(ROWS, t)[0] for t in ('tc', 'hc', 'ty', 'ay')}
print('Paramètres retenus :', dict(decay=DECAY, k=K, dispersion_r=RMAP), flush=True)

# --- évaluation TEST
def metrics(preds, ys):
    p = np.clip(np.array(preds), 1e-4, 1 - 1e-4); y = np.array(ys)
    return dict(n=int(len(y)), brier=float(np.mean((p - y) ** 2)),
                logloss=float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))),
                pred_moy=float(p.mean()), freq_reelle=float(y.mean()))

def hit80(preds, ys, thr=0.80):
    p = np.array(preds); y = np.array(ys); m = p >= thr
    return dict(n=int(m.sum()), part=float(m.mean()), reussite=float(y[m].mean()) if m.sum() else None,
                proba_annoncee=float(p[m].mean()) if m.sum() else None)

# base rate train par (division, marché) = baseline naïf
base = {}
for key, typ, thr in MARKETS:
    for div in DIVS:
        ys = [outcome(r, typ, thr) for r in d[(d.Division == div) & (d.season.isin(TRAIN))].itertuples(index=False)]
        base[(key, div)] = float(np.mean(ys)) if ys else 0.5

wing_res = {'wing': [], 'non_wing': []}
wing_res_noboost = {'wing': [], 'non_wing': []}
models = ['ancienne_app_v3.2', 'app_actuelle_NB', 'modele_ameliore', 'baseline_taux_de_base']
res = {m: {k: ([], []) for k, _, _ in MARKETS} for m in models}
tr_flat = {m: ([], []) for m in models}
for rec, row in zip(ROWS, d.itertuples(index=False)):
    if rec is None or row.season not in TEST: continue
    hw, aw = wing(row.HomeTeam), wing(row.AwayTeam)
    boost = (1.4 if hw else 0.5) + (1.0 if aw else 0.4)
    h_cf, a_cf, h_yf, a_yf = rec['raw']
    # ancienne app : moyennes "pour" de chaque équipe + boost ailiers, Poisson, plancher fixe
    old_mu = {'tc': h_cf + a_cf + boost, 'hc': h_cf + boost * 0.6,
              'ty': h_yf + a_yf + (4.8 - 4.2) * 0.4, 'ay': a_yf + (4.8 - 4.2) * 0.2}
    act_tc = row.HomeCorners + row.AwayCorners
    grp = 'wing' if (hw or aw) else 'non_wing'
    wing_res[grp].append(act_tc - old_mu['tc'])
    wing_res_noboost[grp].append(act_tc - (old_mu['tc'] - boost))
    for key, typ, thr in MARKETS:
        y = outcome(row, typ, thr)
        p_old = max(FLOOR[key], round(p_over_pois(old_mu[typ], thr) * 100)) / 100
        # app actuelle : moyennes brutes + boost, binomiale négative r=12 (corners) / 9 (cartons), sans plancher
        r_app = 12 if typ in ('tc', 'hc') else 9
        p_app = round(p_over_nb(old_mu[typ], thr, r_app) * 100) / 100
        p_new = p_over_nb(mus_for(rec, typ), thr, RMAP[typ])
        p_base = base[(key, row.Division)]
        for m, p in zip(models, (p_old, p_app, p_new, p_base)):
            res[m][key][0].append(p); res[m][key][1].append(y)
            tr_flat[m][0].append(p); tr_flat[m][1].append(y)

report = {'params': dict(decay=DECAY, k=K, dispersion=RMAP), 'train_saisons': [min(TRAIN), max(TRAIN)],
          'test_saisons': [min(TEST), max(TEST)], 'n_matchs_test': int(sum(1 for r, x in zip(ROWS, d.itertuples(index=False)) if r and x.season in TEST)),
          'globaux': {}, 'par_marche': {}, 'seuil80': {}, 'calibration': {}}
for m in models:
    report['globaux'][m] = metrics(*tr_flat[m])
    report['seuil80'][m] = hit80(*tr_flat[m])
    report['par_marche'][m] = {k: metrics(*res[m][k]) for k, _, _ in MARKETS}
# calibration par tranche, modèles app actuelle et amélioré
bins = [(0, .35), (.35, .5), (.5, .65), (.65, .8), (.8, 1.01)]
for m in ('ancienne_app_v3.2', 'app_actuelle_NB', 'modele_ameliore'):
    p = np.array(tr_flat[m][0]); y = np.array(tr_flat[m][1]); rows_ = []
    for lo, hi in bins:
        mk = (p >= lo) & (p < hi)
        if mk.sum(): rows_.append(dict(tranche=f'{int(lo*100)}-{int(min(hi,1)*100)}%', n=int(mk.sum()), annoncee=float(p[mk].mean()), reelle=float(y[mk].mean())))
    report['calibration'][m] = rows_
# skill vs baseline
bl = report['globaux']['baseline_taux_de_base']['brier']
report['skill_brier_vs_baseline'] = {m: float(1 - report['globaux'][m]['brier'] / bl) for m in models}

# seuils de rentabilité : cote minimale pour que le seuil >=80 % soit rentable
h = report['seuil80']['modele_ameliore']
if h['reussite']: report['cote_minimale_rentable_modele_ameliore'] = 1 / h['reussite']

report['boost_ailiers_erreur_moyenne_corners'] = {
    'avec_boost': {g: dict(n=len(v), erreur=float(np.mean(v))) for g, v in wing_res.items()},
    'sans_boost': {g: dict(n=len(v), erreur=float(np.mean(v))) for g, v in wing_res_noboost.items()}}
rec5 = d[d.season >= 2021]
report['moyennes_ligue_2021_2025'] = {div: dict(corners_dom=float(x.HomeCorners.mean()), corners_ext=float(x.AwayCorners.mean()),
    cartons_dom=float(x.HomeYellow.mean()), cartons_ext=float(x.AwayYellow.mean()), n=int(len(x)))
    for div, x in rec5.groupby('Division')}
print(json.dumps(report, indent=1, ensure_ascii=False))
if OUT: json.dump(report, open(OUT, 'w'), indent=1, ensure_ascii=False)
