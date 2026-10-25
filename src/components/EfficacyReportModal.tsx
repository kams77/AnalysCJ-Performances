import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Download,
  ExternalLink,
  Target,
  BarChart2,
  Percent,
  Sparkles,
  Info,
  X,
  FileText,
  Activity,
  Smartphone,
} from 'lucide-react';
import type { HistoryEntry } from '../App';

interface Props {
  history?: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// KPI calculés uniquement à partir des résultats réellement saisis dans l'historique
function computeRealStats(history: HistoryEntry[]) {
  const evaluated = history.filter((h) => h.status === 'success' || h.status === 'failure');
  const won = evaluated.filter((h) => h.status === 'success').length;
  let brierSum = 0;
  let brierN = 0;
  let stakeSum = 0;
  let netSum = 0;
  for (const h of evaluated) {
    const outcome = h.status === 'success' ? 1 : 0;
    const stake = h.stakeCDF || 0;
    let proba: number | null = null;
    let cote = 0;
    try {
      const parsed = JSON.parse(h.finalText);
      const sel = parsed?.ticket_ngengesport?.selections_80plus;
      if (Array.isArray(sel) && sel.length > 0) {
        proba = sel.slice(0, 2).reduce((acc: number, x: any) => acc * (parseFloat(x.probabilite) / 100), 1);
      }
      cote = Number(parsed?.ticket_ngengesport?.cote_totale_combinee) || 0;
    } catch {
      /* historique illisible : ignoré pour la calibration */
    }
    if (proba !== null && !Number.isNaN(proba)) {
      brierSum += (proba - outcome) ** 2;
      brierN += 1;
    }
    if (stake > 0 && cote > 0) {
      stakeSum += stake;
      netSum += outcome ? stake * cote - stake : -stake;
    }
  }
  return {
    evaluated: evaluated.length,
    winRate: evaluated.length > 0 ? (won / evaluated.length) * 100 : null,
    brier: brierN >= 10 ? brierSum / brierN : null,
    roi: stakeSum > 0 ? (netSum / stakeSum) * 100 : null,
  };
}

export const EfficacyReportModal: React.FC<Props> = ({
  history = [],
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'math' | 'download'>('audit');

  if (!isOpen) return null;

  const stats = computeRealStats(history);
  const fmt = (v: number | null, d = 1, suffix = '%') => (v === null ? '—' : `${v.toFixed(d)}${suffix}`);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* EN-TÊTE MODALE */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/60 to-slate-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                  Audit d'Efficacité & Précision Algorithmique
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  Version 3.2 Finale
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Résultats réels, calibration du modèle et règles ngengesport.cd
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Taux de Réussite & KPI</span>
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'math'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Moteur Mathématique</span>
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'download'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Obtenir la Dernière Version (v3.2)</span>
          </button>
        </div>

        {/* CONTENU */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* AVERTISSEMENT */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                Ces indicateurs sont calculés <strong>uniquement</strong> à partir des résultats que vous avez saisis
                dans l'historique. Aucun taux de réussite n'est garanti : les cartons et les corners restent très
                aléatoires et vous pouvez perdre votre mise.
              </div>

              {/* CARTES KPI RÉELS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tickets terminés</span>
                  <span className="text-2xl md:text-3xl font-black text-emerald-400 font-mono block mt-1">
                    {stats.evaluated}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-medium">Résultats saisis</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Taux de réussite réel</span>
                  <span className="text-2xl md:text-3xl font-black text-amber-400 font-mono block mt-1">
                    {fmt(stats.winRate)}
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-medium">
                    {stats.evaluated < 30 ? 'Échantillon trop petit (< 30)' : 'Tickets gagnés / terminés'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Brier Score</span>
                  <span className="text-2xl md:text-3xl font-black text-cyan-400 font-mono block mt-1">
                    {fmt(stats.brier, 3, '')}
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-medium">
                    {stats.brier === null ? 'Il faut au moins 10 tickets' : 'Plus bas = mieux calibré'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Rendement (ROI)</span>
                  <span className="text-2xl md:text-3xl font-black text-purple-400 font-mono block mt-1">
                    {fmt(stats.roi)}
                  </span>
                  <span className="text-[10px] text-purple-300/80 font-medium">Gain net / mises engagées</span>
                </div>
              </div>

              {/* ANALYSE DÉTAILLÉE DE L'EFFICACITÉ */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Comment le modèle fonctionne
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      1. Au-delà de la moyenne simple
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      La plupart des parieurs se fient à la moyenne simple. L'application utilise une loi
                      binomiale négative (qui tient compte de la variabilité réelle des cartons et des corners)
                      combinée au profil de l'arbitre pour estimer une probabilité.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      2. Respect Strict du Règlement NgengeSport
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      En RDC, NgengeSport annule les cartons au banc et ne compte que les corners bottés.
                      L'algorithme filtre en amont toute sélection risquant d'être faussée par ces critères.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      3. Pondération Tactique des Ailes
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      82% des corners proviennent de centres contrés par les latéraux. Le moteur évalue
                      l'utilisation des couloirs pour chaque équipe (+1.4 à +2.8 corners pour les équipes à ailiers explosifs).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      4. Simulation des Game States
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      Le match n'est pas linéaire. L'application simule 3 scénarios (0-0 bloc bas, avantage précoce, transition rapide)
                      pour illustrer l'effet du déroulement du match sur les estimations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-100 block mb-1">Comment lire ces chiffres</span>
                Le Brier Score mesure l'écart entre la probabilité annoncée et le résultat réel (0 = parfait,
                0,25 = équivalent à lancer une pièce). Il n'a de sens qu'avec un nombre suffisant de tickets terminés.
              </div>
            </div>
          )}

          {activeTab === 'math' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 font-mono">
                  1. Loi binomiale négative (surdispersion)
                </h4>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
                  <p className="text-cyan-300 font-bold mb-1">
                    P(X = k) = (λ^k · e^(-λ)) / k!
                  </p>
                  <p className="text-slate-400">
                    P(X ≥ seuil) = 1 - ∑ [ (λ^i · e^(-λ)) / i! ] pour i allant de 0 à seuil - 1
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  La loi de Poisson suppose variance = moyenne ; or cartons et corners varient davantage.
                  Le moteur utilise donc une loi binomiale négative (variance = moyenne × facteur de dispersion),
                  plus prudente. Le résultat reste une estimation.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-amber-400 font-mono">
                  2. Calcul de la Valeur Nette (Value Bet / Edge)
                </h4>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
                  <p className="text-amber-300 font-bold mb-1">
                    Edge (pts) = P_estimée - (1 / Cote_saisie × 100)
                  </p>
                  <p className="text-slate-400">
                    Si Edge ≥ +5 pts avec une cote que VOUS avez saisie → badge ⭐ Value Bet.
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sans cote réelle saisie, aucune valeur n'est calculée : l'application affiche seulement la cote
                  équitable (sans marge). Une probabilité estimée ne garantit jamais un gain.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-purple-400 font-mono">
                  3. Matrice de Corrélation Arbitre / Tension
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  L'espérance de cartons λ_cartons intègre un coefficient de sévérité de l'arbitre officiel
                  désigné (ex: +0.4 carton si l'arbitre distribue plus de 4.8 CJ/match) et un surcroît de +0.8 carton
                  pour les derbys et confrontations à enjeu européen.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'download' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 p-4 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    Version 3.2 Finale
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cette version intègre le modèle statistique, le simulateur Game State,
                  le calculateur de mise CDF, l'export de coupon HD/PDF, le combiné multi-matchs et le suivi réel des scores.
                </p>
              </div>

              {/* OPTIONS DE TÉLÉCHARGEMENT DIRECT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="/AnalyseCJ-Performances-v3-Source.zip"
                  download="AnalyseCJ-Performances-v3.2-Complete.zip"
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition group flex items-start gap-3.5"
                >
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      Archive ZIP Complète (v3.2)
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Code source complet prêt à l'emploi (TypeScript, React, Tailwind, Express)
                    </p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold mt-2 inline-block">
                      Téléchargement direct (.zip)
                    </span>
                  </div>
                </a>

                <a
                  href="/AnalyseCJ-Performances-v3-Source.tar.gz"
                  download="AnalyseCJ-Performances-v3.2-Complete.tar.gz"
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition group flex items-start gap-3.5"
                >
                  <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      Archive TAR.GZ Linux / Mac (v3.2)
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Format compressé haute vitesse pour serveurs et postes Linux
                    </p>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold mt-2 inline-block">
                      Téléchargement direct (.tar.gz)
                    </span>
                  </div>
                </a>

                <a
                  href="/AnalysCJ-v3.2-Autonome.apk"
                  download="AnalysCJ-v3.2-Autonome.apk"
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 transition group flex items-start gap-3.5"
                >
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                      APK Autonome Android (v3.2)
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fichier d'installation native Android sans dépendance externe
                    </p>
                    <span className="text-[10px] text-amber-400 font-mono font-bold mt-2 inline-block">
                      Télécharger APK Android (v3.2)
                    </span>
                  </div>
                </a>

                <a
                  href="https://github.com/kams77/AnalysCJ-Performances"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40 transition group flex items-start gap-3.5"
                >
                  <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                      Dépôt GitHub Officiel
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      github.com/kams77/AnalysCJ-Performances (branche main)
                    </p>
                    <span className="text-[10px] text-purple-400 font-mono font-bold mt-2 inline-block">
                      Voir sur GitHub ↗
                    </span>
                  </div>
                </a>
              </div>

              {/* INSTALLATION PWA RAPIDE */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Installation Instantanée sur Smartphone (PWA)
                </h5>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 leading-relaxed">
                  <li>Ouvrez l'application dans Chrome ou Safari sur votre téléphone.</li>
                  <li>Appuyez sur le menu du navigateur (3 points ou bouton de partage).</li>
                  <li>Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
                  <li>L'application s'ouvre alors comme une véritable app native en plein écran !</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* PIED DE MODALE */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500">
            Analyse C&J Performances • Estimations statistiques, aucune garantie • 18+
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
