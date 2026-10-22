import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  Share2,
  Download,
  Printer,
  Sparkles,
  ExternalLink,
  Plus,
  Coins,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  MultiMatchPick,
  generateMultiMatchCouponImage,
  printMultiMatchCouponPDF,
} from '../utils/couponExporter';

interface Props {
  picks: MultiMatchPick[];
  onRemovePick: (id: string) => void;
  onClearPicks: () => void;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const QUICK_STAKES_CDF = [1000, 2500, 5000, 10000, 20000, 50000];
const RATE_CDF_USD = 2800;

export const MultiMatchCombiner: React.FC<Props> = ({
  picks,
  onRemovePick,
  onClearPicks,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [stakeCDF, setStakeCDF] = useState<number>(5000);
  const [isExporting, setIsExporting] = useState(false);

  // Super-Cote combinée
  const superCote = parseFloat(
    picks.reduce((acc, p) => acc * (p.cote || 1.6), 1).toFixed(2)
  );
  const gainBrut = Math.round(stakeCDF * (superCote || 1));
  const beneficeNet = gainBrut - stakeCDF;
  const stakeUSD = (stakeCDF / RATE_CDF_USD).toFixed(2);
  const gainUSD = (gainBrut / RATE_CDF_USD).toFixed(2);

  // Exporter en Image HD PNG
  const handleExportImage = async () => {
    if (picks.length === 0) return;
    setIsExporting(true);
    try {
      await generateMultiMatchCouponImage(picks, stakeCDF);
      onShowToast(`Image HD du Combiné (${picks.length} matchs) téléchargée avec succès !`, 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Erreur lors de la génération de l\'image du combiné.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Imprimer ou sauvegarder en PDF
  const handlePrintPDF = () => {
    if (picks.length === 0) return;
    printMultiMatchCouponPDF(picks, stakeCDF);
    onShowToast('Fenêtre d\'impression du Combiné prête !', 'info');
  };

  // Partager sur WhatsApp
  const handleShareWhatsApp = () => {
    if (picks.length === 0) return;
    const items = picks
      .map(
        (p, idx) =>
          `*Match ${idx + 1} (${p.leagueName})* : ${p.matchTitle}\n` +
          `  👉 ${p.marche === 'cartons_jaunes' ? '🟨 CARTONS JAUNES' : '🚩 CORNERS'} : *${p.selection}* (@${p.cote} - Proba: ${p.probabilite}%)\n`
      )
      .join('\n');

    const msg =
      `🎟️ *SUPER-COMBINÉ MULTI-MATCHS NGENGESPORT.CD*\n` +
      `🔥 *${picks.length} Rencontres Combinées (Sélections Certifiées ≥ 80%)*\n\n` +
      `-----------------------------------------\n` +
      `${items}` +
      `-----------------------------------------\n` +
      `📊 *Super-Cote Globale* : *@${superCote}*\n` +
      `💰 *Mise simulée* : ${stakeCDF.toLocaleString('fr-FR')} CDF (~$${stakeUSD})\n` +
      `💵 *Gain Potentiel* : *${gainBrut.toLocaleString('fr-FR')} CDF* (Bénéfice Net : +${beneficeNet.toLocaleString('fr-FR')} CDF / ~$${gainUSD})\n\n` +
      `⚠️ *Conditions NgengeSport RDC* : Cartons aux joueurs sur le terrain en 90 min, corners tirés.\n` +
      `⚡ *Analys C&J Performances*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Redirection vers WhatsApp...', 'info');
  };

  // Partager sur Telegram
  const handleShareTelegram = () => {
    if (picks.length === 0) return;
    const items = picks
      .map(
        (p, idx) =>
          `• M${idx + 1} [${p.leagueName}] ${p.matchTitle} : ${p.marche === 'cartons_jaunes' ? '🟨' : '🚩'} ${p.selection} (@${p.cote})`
      )
      .join('\n');

    const msg =
      `🎟️ COMBINÉ GÉANT NGENGESPORT.CD (${picks.length} MATCHS)\n\n` +
      `${items}\n\n` +
      `📊 Super-Cote : @${superCote}\n` +
      `💰 Mise : ${stakeCDF.toLocaleString('fr-FR')} CDF | Gain : ${gainBrut.toLocaleString('fr-FR')} CDF (+${beneficeNet.toLocaleString('fr-FR')} CDF)\n` +
      `Analys C&J - Certifié ≥ 80%`;

    const url = `https://t.me/share/url?url=${encodeURIComponent('https://ngengesport.cd')}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Redirection vers Telegram...', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-2xl w-full p-4 md:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-4">
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base md:text-lg text-white">
                  Panier Combiné Multi-Matchs
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 font-mono">
                  {picks.length}/5 SÉLECTIONS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Générez un super-ticket consolidé de 2 à 5 matchs pour ngengesport.cd
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATIONS CONSEILS NOMBRE DE SÉLECTIONS */}
        {picks.length < 2 && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Astuce ngengesport.cd</strong> : Ajoutez encore au moins un match différent pour former un combiné (2 à 5 sélections conseillées pour optimiser la cote tout en gardant chaque probabilité $\ge 80\%$).
            </span>
          </div>
        )}

        {picks.length === 5 && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-300 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>
              <strong>Maximum de 5 matchs atteint !</strong> Équilibre parfait entre super-cote et sécurité mathématique.
            </span>
          </div>
        )}

        {/* LISTE DES SÉLECTIONS DU PANIER */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {picks.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Votre panier multi-matchs est vide</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sur n'importe quel match analysé, cliquez sur le bouton <strong>« + Ajouter au Combiné Multi-Matchs »</strong> sur vos pronostics préférés pour créer un ticket combiné géant !
              </p>
            </div>
          ) : (
            picks.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono">
                      Match {idx + 1} · {p.leagueName}
                    </span>
                    <span className="text-xs font-bold text-white">{p.matchTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      {p.marche === 'cartons_jaunes' ? '🟨' : '🚩'} {p.selection}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Confiance : {p.probabilite}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    @{p.cote}
                  </span>
                  <button
                    onClick={() => {
                      onRemovePick(p.id);
                      onShowToast('Sélection retirée du combiné.', 'info');
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                    title="Retirer ce match"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SECTION SUPER-COTE & CALCULATEUR DE MISE CDF */}
        {picks.length > 0 && (
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3.5 flex-shrink-0">
            {/* SUPER COTE ET PROJECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Super-Cote Globale Combinée
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    @{superCote}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({picks.length} cotes multipliées)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">
                  Gain Brut Potentiel
                </span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {gainBrut.toLocaleString('fr-FR')} CDF
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  Bénéfice Net : +{beneficeNet.toLocaleString('fr-FR')} CDF (~${gainUSD})
                </span>
              </div>
            </div>

            {/* SÉLECTEUR DE MISE CDF */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mise sur ce Combiné (CDF) :</span>
                  <span className="text-amber-400 font-mono">{stakeCDF.toLocaleString('fr-FR')} CDF</span>
                </label>
                <span className="text-[10px] text-slate-400">~$ {stakeUSD} USD</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {QUICK_STAKES_CDF.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStakeCDF(amt)}
                    className={`py-1 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                      stakeCDF === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {amt.toLocaleString('fr-FR')} CDF
                  </button>
                ))}
              </div>
            </div>

            {/* BOUTONS D'EXPORTATION & PARTAGE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Image HD</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Imprimer</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleShareTelegram}
                className="py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1f8fc4] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        )}

        {/* PIED DE MODALE */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          {picks.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Voulez-vous vider toutes les sélections du panier combiné ?')) {
                  onClearPicks();
                  onShowToast('Panier combiné vidé.', 'info');
                }
              }}
              className="text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider le combiné</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs ml-auto transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Barre flottante en bas d'écran lorsque des sélections sont présentes dans le combiné
export const MultiMatchFloatingBar: React.FC<{
  picks: MultiMatchPick[];
  onOpenModal: () => void;
}> = ({ picks, onOpenModal }) => {
  if (picks.length === 0) return null;

  const superCote = parseFloat(
    picks.reduce((acc, p) => acc * (p.cote || 1.6), 1).toFixed(2)
  );
  const potentialGain = Math.round(5000 * superCote);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] animate-in slide-in-from-bottom-5 duration-300">
      <div
        onClick={onOpenModal}
        className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 p-0.5 rounded-2xl shadow-2xl shadow-amber-500/30 cursor-pointer hover:scale-[1.02] transition active:scale-95"
      >
        <div className="bg-slate-950/95 backdrop-blur-md rounded-[14px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-sm shadow">
              {picks.length}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-xs">Combiné Multi-Matchs</span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {picks.length}/5
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Super-Cote : <strong className="text-emerald-400 font-mono">@{superCote}</strong> · Potentiel 5k : <strong className="text-amber-300 font-mono">{potentialGain.toLocaleString('fr-FR')} CDF</strong>
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow transition"
          >
            <span>Voir le Combiné</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
