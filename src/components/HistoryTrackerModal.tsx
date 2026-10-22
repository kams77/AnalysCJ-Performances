import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Share2,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HistoryEntry, ParsedAnalysis, PronosticItem } from '../App';

interface Props {
  history: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateHistory: (updated: HistoryEntry[]) => void;
  onSelectForView?: (analysis: ParsedAnalysis) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Extraction automatique du seuil numérique et du type de marché
export function evaluateSelection(
  selectionText: string,
  actualCorners: number | null | undefined,
  actualYellows: number | null | undefined,
  marche: 'cartons_jaunes' | 'corners'
): {
  evaluated: boolean;
  isWon: boolean;
  detail: string;
} {
  const norm = selectionText.toLowerCase().replace(',', '.');
  const isCorners = marche === 'corners' || norm.includes('corner');
  const actual = isCorners ? actualCorners : actualYellows;

  if (actual === null || actual === undefined || isNaN(actual)) {
    return {
      evaluated: false,
      isWon: false,
      detail: 'Score réel non saisi',
    };
  }

  // Détection "Plus de X" / "Over X"
  const overMatch = norm.match(/(?:plus de|over|\+)\s*(\d+(?:\.\d+)?)/i);
  if (overMatch) {
    const threshold = parseFloat(overMatch[1]);
    const isWon = actual > threshold;
    const diff = Math.round((actual - threshold) * 10) / 10;
    return {
      evaluated: true,
      isWon,
      detail: isWon
        ? `Validé : ${actual} ${isCorners ? 'corners tirés' : 'cartons reçus'} (seuil +${threshold})`
        : `Non atteint : ${actual} ${isCorners ? 'corners' : 'cartons'} (seuil +${threshold}, manque ${Math.ceil(threshold - actual + 0.01)})`,
    };
  }

  // Détection "Moins de X" / "Under X"
  const underMatch = norm.match(/(?:moins de|under|\-)\s*(\d+(?:\.\d+)?)/i);
  if (underMatch) {
    const threshold = parseFloat(underMatch[1]);
    const isWon = actual < threshold;
    return {
      evaluated: true,
      isWon,
      detail: isWon
        ? `Validé : ${actual} ${isCorners ? 'corners' : 'cartons'} (inférieur au seuil ${threshold})`
        : `Dépassé : ${actual} ${isCorners ? 'corners' : 'cartons'} (seuil max ${threshold})`,
    };
  }

  // Fallback si pas de seuil précis trouvé
  return {
    evaluated: false,
    isWon: false,
    detail: 'Ligne spécifique',
  };
}

export const HistoryTrackerModal: React.FC<Props> = ({
  history,
  isOpen,
  onClose,
  onUpdateHistory,
  onSelectForView,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'success' | 'failure'>('all');
  const [editingScores, setEditingScores] = useState<
    Record<string, { corners: string; yellows: string; stakeCDF: string }>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calcul du tableau de bord global
  const total = history.length;
  const won = history.filter((h) => h.status === 'success');
  const lost = history.filter((h) => h.status === 'failure');
  const pending = history.filter((h) => h.status === 'pending');
  const evaluatedCount = won.length + lost.length;
  const winRate = evaluatedCount > 0 ? Math.round((won.length / evaluatedCount) * 100) : 0;

  // Calcul bilan financier en Francs Congolais (CDF)
  let totalMiseCDF = 0;
  let totalGainNetCDF = 0;

  history.forEach((entry) => {
    const stake = entry.stakeCDF || 5000;
    totalMiseCDF += stake;

    let cote = 2.25;
    try {
      const parsed: ParsedAnalysis = JSON.parse(entry.finalText);
      cote = parsed.ticket_ngengesport?.cote_totale_combinee || 2.25;
    } catch {
      // ignore
    }

    if (entry.status === 'success') {
      totalGainNetCDF += Math.round(stake * cote - stake);
    } else if (entry.status === 'failure') {
      totalGainNetCDF -= stake;
    }
  });

  // Mettre à jour les champs d'un match
  const handleScoreChange = (
    id: string,
    field: 'corners' | 'yellows' | 'stakeCDF',
    val: string
  ) => {
    setEditingScores((prev) => ({
      ...prev,
      [id]: {
        corners: prev[id]?.corners ?? '',
        yellows: prev[id]?.yellows ?? '',
        stakeCDF: prev[id]?.stakeCDF ?? '5000',
        [field]: val,
      },
    }));
  };

  // Comparer automatiquement le score réel avec les sélections du coupon
  const handleAutoCompare = (entry: HistoryEntry) => {
    const edit = editingScores[entry.id] || {
      corners: entry.actualCorners !== undefined && entry.actualCorners !== null ? String(entry.actualCorners) : '',
      yellows: entry.actualYellows !== undefined && entry.actualYellows !== null ? String(entry.actualYellows) : '',
      stakeCDF: entry.stakeCDF ? String(entry.stakeCDF) : '5000',
    };

    const cVal = parseFloat(edit.corners);
    const yVal = parseFloat(edit.yellows);
    const stakeVal = parseInt(edit.stakeCDF, 10) || 5000;

    if (isNaN(cVal) || isNaN(yVal)) {
      onShowToast('Veuillez saisir le nombre réel de corners et de cartons jaunes.', 'error');
      return;
    }

    let parsed: ParsedAnalysis;
    try {
      parsed = JSON.parse(entry.finalText);
    } catch {
      onShowToast('Impossible de lire les détails du coupon pour ce match.', 'error');
      return;
    }

    const pronos: PronosticItem[] = parsed.pronostics || [];
    if (pronos.length === 0) {
      onShowToast('Aucun pronostic à comparer pour ce coupon.', 'error');
      return;
    }

    // Tester chaque sélection
    let allWon = true;
    let anyLost = false;

    pronos.forEach((p) => {
      const evalRes = evaluateSelection(p.selection, cVal, yVal, p.marche);
      if (evalRes.evaluated) {
        if (!evalRes.isWon) {
          allWon = false;
          anyLost = true;
        }
      } else {
        // Non évaluable directement par mot-clé
      }
    });

    const newStatus: 'success' | 'failure' | 'pending' = anyLost
      ? 'failure'
      : allWon
      ? 'success'
      : 'pending';

    const updated = history.map((h) => {
      if (h.id === entry.id) {
        return {
          ...h,
          actualCorners: cVal,
          actualYellows: yVal,
          stakeCDF: stakeVal,
          status: newStatus,
        };
      }
      return h;
    });

    onUpdateHistory(updated);
    localStorage.setItem('analyscj_history_v2', JSON.stringify(updated));

    if (newStatus === 'success') {
      onShowToast(`🎉 Coupon validé avec succès (${cVal} corners, ${yVal} cartons) !`, 'success');
    } else {
      onShowToast(`❌ Coupon échoué (${cVal} corners, ${yVal} cartons).`, 'info');
    }
  };

  // Pré-remplir avec un profil de match typique
  const handleApplyPreset = (id: string, corners: number, yellows: number) => {
    setEditingScores((prev) => ({
      ...prev,
      [id]: {
        corners: String(corners),
        yellows: String(yellows),
        stakeCDF: prev[id]?.stakeCDF || '5000',
      },
    }));
  };

  // Partager le résultat de comparaison sur WhatsApp
  const handleShareOutcome = (entry: HistoryEntry) => {
    let parsed: ParsedAnalysis | null = null;
    try {
      parsed = JSON.parse(entry.finalText);
    } catch {
      // ignore
    }

    const isSuccess = entry.status === 'success';
    const statusText = isSuccess ? '✅ COUPON GAGNÉ !' : entry.status === 'failure' ? '❌ COUPON RATÉ' : '⏳ EN ATTENTE';

    const msg = `📊 *SUIVI RÉSULTATS ANALYS C&J PERFORMANCES*\n\n` +
      `⚽ *Match* : ${entry.matchTitle} (${entry.leagueName})\n` +
      `📅 *Date* : ${new Date(entry.ts).toLocaleDateString('fr-FR')}\n\n` +
      `🏁 *Score Réel Terminé :*\n` +
      `• Corners effectifs : *${entry.actualCorners ?? 'N/A'}*\n` +
      `• Cartons jaunes (joueurs en jeu) : *${entry.actualYellows ?? 'N/A'}*\n\n` +
      `🎯 *Résultat du Coupon NgengeSport* : *${statusText}*\n` +
      (entry.stakeCDF ? `💰 *Mise* : ${entry.stakeCDF.toLocaleString('fr-FR')} CDF\n` : '') +
      `⚡ *Analys C&J - Conformité ngengesport.cd*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtrer la liste
  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-4">
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-white flex items-center gap-2">
                Suivi des Résultats Terminés & Comparateur
              </h3>
              <p className="text-[11px] text-slate-400">
                Compare automatiquement le score réel corners/cartons avec vos pronostics ngengesport.cd
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* DASHBOARD DE PERFORMANCE & BILAN FINANCIER CDF */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Taux Réussite Réel
            </span>
            <span
              className={`text-xl font-black font-mono block mt-0.5 ${
                winRate >= 75 ? 'text-emerald-400' : winRate >= 50 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {evaluatedCount > 0 ? `${winRate}%` : '---'}
            </span>
            <span className="text-[10px] text-slate-500">
              {won.length}/{evaluatedCount} match(s) évalué(s)
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Tickets Gagnés / Perdus
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-emerald-400 font-bold font-mono text-sm">
                ✓ {won.length}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 font-bold font-mono text-sm">
                ✕ {lost.length}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/90 font-medium">
              ⏳ {pending.length} en attente
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center col-span-2">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Bilan Estimé en Francs Congolais (CDF)
            </span>
            <span
              className={`text-lg md:text-xl font-black font-mono block mt-0.5 ${
                totalGainNetCDF > 0
                  ? 'text-emerald-400'
                  : totalGainNetCDF < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {totalGainNetCDF > 0 ? '+' : ''}
              {totalGainNetCDF.toLocaleString('fr-FR')} CDF
            </span>
            <span className="text-[10px] text-slate-500">
              Mises cumulées : {totalMiseCDF.toLocaleString('fr-FR')} CDF (~${(totalMiseCDF / 2800).toFixed(1)})
            </span>
          </div>
        </div>

        {/* ONGLETS DE FILTRAGE */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Tous ({total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filter === 'pending'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              En attente ({pending.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filter === 'success'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Gagnés ({won.length})
            </button>
            <button
              onClick={() => setFilter('failure')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filter === 'failure'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Perdus ({lost.length})
            </button>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser et vider tout l’historique des pronostics ?')) {
                  onUpdateHistory([]);
                  localStorage.removeItem('analyscj_history_v2');
                  onShowToast('Historique vidé avec succès.', 'info');
                }
              }}
              className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
              title="Vider tout l'historique"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout effacer</span>
            </button>
          )}
        </div>

        {/* LISTE DÉROULANTE DES MATCHS & SAISIE DU SCORE RÉEL */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Aucun match dans cette vue</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Lancez « Donne les stats » sur un match du calendrier pour sauvegarder automatiquement un coupon et suivre son résultat final ici.
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => {
              let parsed: ParsedAnalysis | null = null;
              try {
                parsed = JSON.parse(entry.finalText);
              } catch {
                // ignore
              }

              const isExpanded = expandedId === entry.id;
              const pronos = parsed?.pronostics || [];
              const cote = parsed?.ticket_ngengesport?.cote_totale_combinee || 2.25;
              const currentEdit = editingScores[entry.id] || {
                corners:
                  entry.actualCorners !== undefined && entry.actualCorners !== null
                    ? String(entry.actualCorners)
                    : '',
                yellows:
                  entry.actualYellows !== undefined && entry.actualYellows !== null
                    ? String(entry.actualYellows)
                    : '',
                stakeCDF: entry.stakeCDF ? String(entry.stakeCDF) : '5000',
              };

              const currentCorners =
                currentEdit.corners !== ''
                  ? parseFloat(currentEdit.corners)
                  : entry.actualCorners ?? null;
              const currentYellows =
                currentEdit.yellows !== ''
                  ? parseFloat(currentEdit.yellows)
                  : entry.actualYellows ?? null;
              const currentStake = parseInt(currentEdit.stakeCDF, 10) || 5000;
              const gainPotential = Math.round(currentStake * cote);
              const netGain = gainPotential - currentStake;

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border transition-all ${
                    entry.status === 'success'
                      ? 'bg-slate-950/90 border-emerald-500/40'
                      : entry.status === 'failure'
                      ? 'bg-slate-950/90 border-rose-500/40'
                      : 'bg-slate-950/90 border-slate-800'
                  }`}
                >
                  {/* EN-TÊTE DU TICKET */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {entry.leagueName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(entry.ts).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {entry.matchTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* BADGE DE STATUT */}
                      {entry.status === 'success' && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GAGNÉ
                        </span>
                      )}
                      {entry.status === 'failure' && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> PERDU
                        </span>
                      )}
                      {entry.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> EN ATTENTE
                        </span>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <span>{isExpanded ? 'Réduire' : 'Vérifier score'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* VUE RAPIDE DU COUPON */}
                  <div className="px-3.5 pb-3">
                    <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Sélections certifiées ≥ 80% ({pronos.length}) :</span>
                        <span className="text-amber-300 font-mono font-bold">
                          Cote combinée : @{cote}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {pronos.map((p, pIdx) => {
                          const evalRes = evaluateSelection(
                            p.selection,
                            currentCorners,
                            currentYellows,
                            p.marche
                          );
                          return (
                            <div
                              key={pIdx}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/60 border border-slate-800/60"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{p.marche === 'cartons_jaunes' ? '🟨' : '🚩'}</span>
                                <span className="font-semibold text-slate-200">{p.selection}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {evalRes.evaluated ? (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      evalRes.isWon
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    {evalRes.isWon ? '✓ ' : '✕ '}
                                    {evalRes.detail}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {p.probabilite}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ZONE D'ÉDITION ÉTENDUE : SAISIE DES RÉSULTATS TERMINÉS */}
                  {isExpanded && (
                    <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 rounded-b-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Saisie du Score Réel Terminé (ngengesport.cd)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Temps réglementaire 90 min uniquement
                        </span>
                      </div>

                      {/* CHAMPS DE SAISIE */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Corners */}
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            🚩 Corners réels tirés :
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            placeholder="Ex: 10"
                            value={currentEdit.corners}
                            onChange={(e) =>
                              handleScoreChange(entry.id, 'corners', e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Cartons jaunes */}
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            🟨 Cartons jaunes réels (joueurs) :
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            placeholder="Ex: 4"
                            value={currentEdit.yellows}
                            onChange={(e) =>
                              handleScoreChange(entry.id, 'yellows', e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Mise CDF */}
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            💰 Mise jouée (CDF) :
                          </label>
                          <input
                            type="number"
                            step="500"
                            min="500"
                            placeholder="5000"
                            value={currentEdit.stakeCDF}
                            onChange={(e) =>
                              handleScoreChange(entry.id, 'stakeCDF', e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* PRESETS RAPIDES DE MATCH */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-semibold">Profils rapides :</span>
                        <button
                          onClick={() => handleApplyPreset(entry.id, 11, 5)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                          Match engagé (11 corn, 5 cart)
                        </button>
                        <button
                          onClick={() => handleApplyPreset(entry.id, 9, 4)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                          Standard (9 corn, 4 cart)
                        </button>
                        <button
                          onClick={() => handleApplyPreset(entry.id, 6, 2)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                          Fermé (6 corn, 2 cart)
                        </button>
                      </div>

                      {/* BILAN GAIN DU TICKET */}
                      {entry.status === 'success' && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-semibold">
                            🏆 Gain net réalisé :
                          </span>
                          <span className="text-emerald-400 font-black font-mono">
                            +{netGain.toLocaleString('fr-FR')} CDF (Gain brut :{' '}
                            {gainPotential.toLocaleString('fr-FR')} CDF)
                          </span>
                        </div>
                      )}

                      {entry.status === 'failure' && (
                        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs">
                          <span className="text-rose-300 font-semibold">Perte nette :</span>
                          <span className="text-rose-400 font-black font-mono">
                            -{currentStake.toLocaleString('fr-FR')} CDF
                          </span>
                        </div>
                      )}

                      {/* ACTIONS DU MATCH */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAutoCompare(entry)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Comparer & Valider Automatiquement</span>
                          </button>

                          <button
                            onClick={() => handleShareOutcome(entry)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="Partager le résultat sur WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Bascule manuelle rapide */}
                          <button
                            onClick={() => {
                              const updated = history.map((h) =>
                                h.id === entry.id ? { ...h, status: 'success' as const } : h
                              );
                              onUpdateHistory(updated);
                              localStorage.setItem('analyscj_history_v2', JSON.stringify(updated));
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              entry.status === 'success'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            ✓ Gagné
                          </button>

                          <button
                            onClick={() => {
                              const updated = history.map((h) =>
                                h.id === entry.id ? { ...h, status: 'failure' as const } : h
                              );
                              onUpdateHistory(updated);
                              localStorage.setItem('analyscj_history_v2', JSON.stringify(updated));
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              entry.status === 'failure'
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            ✕ Perdu
                          </button>

                          <button
                            onClick={() => {
                              const updated = history.map((h) =>
                                h.id === entry.id
                                  ? {
                                      ...h,
                                      status: 'pending' as const,
                                      actualCorners: null,
                                      actualYellows: null,
                                    }
                                  : h
                              );
                              onUpdateHistory(updated);
                              localStorage.setItem('analyscj_history_v2', JSON.stringify(updated));
                            }}
                            className="p-1 text-slate-500 hover:text-slate-300"
                            title="Réinitialiser"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const updated = history.filter((h) => h.id !== entry.id);
                              onUpdateHistory(updated);
                              localStorage.setItem('analyscj_history_v2', JSON.stringify(updated));
                              onShowToast('Match retiré de l\'historique.', 'info');
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PIED DE MODALE */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>
            Règle ngengesport.cd : Corners tirés · Cartons sur terrain (90 min).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
