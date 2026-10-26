# Analyse C&J Performances (v3.3)
> **Application d'estimation statistique des Cartons Jaunes et Corners pour le football.**
> Règles de comptage alignées sur ngengesport.cd (Kinshasa, RDC). Réservé aux personnes majeures (18+).

> ⚠️ **Aucun gain n'est garanti.** Les probabilités affichées sont des *estimations* issues d'un modèle simple.
> Les cartons et les corners sont des événements très aléatoires. Ne pariez jamais plus que ce que vous pouvez perdre.

---

## 🔬 Comment fonctionne le moteur

1. **Loi binomiale négative** (au lieu de Poisson pur) : cartons et corners varient plus que leur moyenne.
   Pour une espérance λ et un facteur de dispersion φ (variance = λ·φ, φ = 1,25 cartons / 1,35 corners) :
   $$P(X \ge k) = 1 - \sum_{i=0}^{k-1} \binom{i+r-1}{i} (1-q)^r q^i,\quad r = \frac{\lambda}{\varphi-1}$$
2. **Aucune probabilité n'est gonflée** : la valeur affichée est celle du calcul. Seules les sélections
   ≥ 80 % sont retenues ; si aucune n'y arrive, l'application le dit et déconseille de parier.
3. **Largeur tactique et sévérité de l'arbitre** ajustent λ (heuristiques simples, à valider sur vos données).
4. **Cotes** : l'application affiche la *cote équitable* (100 / probabilité). Le *Value Bet* n'est calculé que si
   vous saisissez la cote réelle (`cotes` dans la requête `/api/analyze`, clé `marché:cible:seuil`, ex. `corners:match:8.5`).
5. **L'IA (Gemini) ne rédige que la synthèse** ; elle ne produit ni probabilité ni cote.
6. **Indicateurs de performance** (onglet « Audit ») : calculés uniquement depuis les résultats que vous saisissez
   dans l'historique (taux de réussite, Brier score, ROI). Ils s'affichent « — » tant que les données manquent.

### Limites connues
- Les moyennes d'équipes proviennent d'une base statique ; un match absent utilise des valeurs par défaut.
- Le modèle n'a pas été validé sur un historique de résultats externe.

---

## 🏆 Les 6 Championnats Européens Couverts
- 🇫🇷 **Ligue 1** (France)
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League** (Angleterre)
- 🇮🇹 **Serie A** (Italie)
- 🇩🇪 **Bundesliga** (Allemagne)
- 🇪🇸 **La Liga** (Espagne)
- 🇵🇹 **Premier League Portugal** (Liga Portugal Betclic)

---

## 🚀 Procédure Complète pour Avoir et Utiliser la Dernière Version (v3.2)

### Méthode 1 : Utilisation Immédiate en Web / Mobile PWA (Recommandé)
L'application est une **Progressive Web App (PWA)** complète. Elle s'installe sur smartphone sans passer par les stores d'applications :
1. **Sur Android** :
   - Ouvrez le lien de l'application dans **Google Chrome**.
   - Appuyez sur le menu (les **3 points** verticaux en haut à droite).
   - Appuyez sur **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
   - L'icône apparaît sur votre écran et se lance en plein écran hors-navigateur.
2. **Sur iPhone / iPad (iOS)** :
   - Ouvrez le lien dans **Safari**.
   - Appuyez sur l'icône de **Partage** (carré avec flèche vers le haut en bas de l'écran).
   - Sélectionnez **« Sur l'écran d'accueil »**.

---

### Méthode 2 : Téléchargement Direct des Packs Sources (v3.2)
Vous pouvez télécharger directement les archives complètes de la version 3.2 :
- **Pack Source Complet ZIP** : `/AnalyseCJ-Performances-v3-Source.zip`
- **Pack Source Complet TAR.GZ** : `/AnalyseCJ-Performances-v3-Source.tar.gz`
- **Application APK Android Autonome** : `/AnalysCJ-v2.2-Autonome.apk`

---

### Méthode 3 : Récupération & Mise à Jour via GitHub

Le dépôt officiel de l'application est :
👉 **https://github.com/kams77/AnalysCJ-Performances**

#### Si vous avez déjà cloné le dépôt :
```bash
cd AnalysCJ-Performances
git checkout main
git pull origin main
```

#### Si vous partez de zéro (Nouveau Clone) :
```bash
git clone https://github.com/kams77/AnalysCJ-Performances.git
cd AnalysCJ-Performances
```

#### Lancement en local (Node.js 18+) :
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement (Port 3000)
npm run dev

# 3. Ou compiler et lancer la version de production haute performance
npm run build
npm start
```
Ouvrez ensuite votre navigateur sur **http://localhost:3000**.

---

## 📋 Fonctionnalités
- **Moteur binomial négatif** avec espérance $\lambda$ affichée et probabilités non gonflées.
- **Simulateur Game State & Analyse de Largeur Tactique**.
- **Value Bet** calculé à partir de la cote réelle saisie.
- **Calculateur de mise en Francs Congolais (CDF)** avec conversion automatique USD.
- **Exportation HD de coupons** en Image (.png) et PDF pour WhatsApp et Telegram.
- **Suivi des Résultats Terminés** avec calcul automatique des gains réels et du taux de réussite.
- **Panier Multi-Matchs** pour générer des combinés géants (2 à 5 matchs).
- **Détecteur de Derbys et Alertes Risque**.
- **Fiche Profil Arbitre Officiel** avec taux de cartons par mi-temps et sévérité.
- **Audit basé sur vos résultats réels** (taux de réussite, Brier, ROI).

---

*Avertissement : estimations statistiques à titre indicatif, sans garantie de résultat. Réservé aux personnes majeures (18+).*


## Efficacité mesurée
Résultats d'un backtest walk-forward sur 10 305 matchs réels (2021-2025) : voir [backtest/RESULTATS.md](backtest/RESULTATS.md).
En bref : probabilités bien calibrées (≈ 85 % annoncé pour ≈ 83,5 % réel), mais avantage faible sur une simple moyenne de championnat, et rentabilité non démontrée faute de cotes réelles. Estimations, aucune garantie.
