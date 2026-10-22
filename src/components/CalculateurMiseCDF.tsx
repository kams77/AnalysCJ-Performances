import React, { useState } from 'react';
import {
  Coins,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ParsedAnalysis } from '../App';
import { generateCouponImage, printCouponPDF } from '../utils/couponExporter';

interface Props {
  analysis: ParsedAnalysis;
  onCopyText: () => void;
  copied: boolean;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const QUICK_STAKES_CDF = [1000, 2500, 5000, 10000, 20000, 50000];
const RATE_CDF_USD = 2800; // Taux de change moyen RDC

export const CalculateurMiseCDF: React.FC<Props> = ({
  analysis,
  onCopyText,
  copied,
  onShowToast,
}) => {
  const [stakeCDF, setStakeCDF] = useState<number>(5000);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const coteTotale = analysis.ticket_ngengesport?.cote_totale_combinee || 2.35;
  const gainBrut = Math.round(stakeCDF * coteTotale);
  const beneficeNet = gainBrut - stakeCDF;
  const roiPercent = Math.round(((coteTotale - 1) * 100));
  const gainUSD = (gainBrut / RATE_CDF_USD).toFixed(2);
  const stakeUSD = (stakeCDF / RATE_CDF_USD).toFixed(2);

  // Partager directement sur WhatsApp
  const handleShareWhatsApp = () => {
    const items = analysis.pronostics
      .map(
        (p) =>
          `• ${p.marche === 'cartons_jaunes' ? '🟨 CARTONS JAUNES' : '🚩 CORNERS'} : *${p.selection}* (@${p.cote_ngenge || '1.65'}) - Proba: ${p.probabilite}%`
      )
      .join('\n');

    const msg = `🎟️ *COUPON NGENGESPORT.CD (≥ 80% PROBA)*\n\n` +
      `⚽ *Match* : ${analysis.match.domicile} vs ${analysis.match.exterieur}\n` +
      `🏆 *Ligue* : ${analysis.match.competition}\n` +
      `📅 *Date & Coup d'envoi* : ${analysis.match.date}\n` +
      `🏟️ *Stade* : ${analysis.match.stade || 'Officiel'} · *Arbitre* : ${analysis.match.arbitre || 'Officiel'}\n\n` +
      `📋 *SÉLECTIONS VALIDÉES (≥ 80%) :*\n${items}\n\n` +
      `📊 *Cote Combinée* : @${coteTotale}\n` +
      `💰 *Mise simulée* : ${stakeCDF.toLocaleString('fr-FR')} CDF (~$${stakeUSD})\n` +
      `💵 *Gain Potentiel* : *${gainBrut.toLocaleString('fr-FR')} CDF* (Bénéfice Net : +${beneficeNet.toLocaleString('fr-FR')} CDF / ~$${gainUSD})\n\n` +
      `⚠️ *Conditions NgengeSport.cd respectées* : Joueurs en jeu uniquement (90 min), corners tirés.\n` +
      `⚡ *Analys C&J Performances*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Redirection vers WhatsApp...', 'info');
  };

  // Partager sur Telegram
  const handleShareTelegram = () => {
    const items = analysis.pronostics
      .map(
        (p) =>
          `• ${p.marche === 'cartons_jaunes' ? '🟨 Cartons' : '🚩 Corners'} : ${p.selection} (@${p.cote_ngenge || '1.65'} - ${p.probabilite}%)`
      )
      .join('\n');

    const msg = `🎟️ COUPON NGENGESPORT.CD (≥ 80% PROBA)\n` +
      `⚽ ${analysis.match.domicile} vs ${analysis.match.exterieur} (${analysis.match.competition})\n` +
      `📅 ${analysis.match.date}\n\n` +
      `${items}\n\n` +
      `📊 Cote @${coteTotale} | Mise : ${stakeCDF.toLocaleString('fr-FR')} CDF | Gain : ${gainBrut.toLocaleString('fr-FR')} CDF (+${beneficeNet.toLocaleString('fr-FR')} CDF)\n` +
      `Conditions ngengesport.cd respectées.`;

    const url = `https://t.me/share/url?url=${encodeURIComponent('https://ngengesport.cd')}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Redirection vers Telegram...', 'info');
  };

  // Exporter en Image HD PNG
  const handleExportImage = async () => {
    setIsExportingImage(true);
    try {
      await generateCouponImage(analysis, stakeCDF);
      onShowToast('Image HD du coupon téléchargée avec succès !', 'success');
    } catch (e: any) {
      console.error(e);
      onShowToast('Erreur lors de la génération de l\'image.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Exporter en PDF / Imprimer
  const handlePrintPDF = () => {
    printCouponPDF(analysis, stakeCDF);
    onShowToast('Fenêtre d\'impression PDF prête !', 'info');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/40 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* En-tête du calculateur */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2">
              Calculateur de Mise & Gains NgengeSport.cd
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                CDF (Franc Congolais)
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Estimez immédiatement vos gains bruts et nets selon les cotes certifiées
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-mono">Taux indicatif RDC</span>
          <span className="text-xs font-mono font-bold text-slate-300">
            1 USD ≈ {RATE_CDF_USD.toLocaleString('fr-FR')} CDF
          </span>
        </div>
      </div>

      {/* Saisie de la mise */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-300 flex items-center gap-1.5">
            <span>Montant de votre mise :</span>
            <span className="text-amber-400 font-mono text-sm">
              {stakeCDF.toLocaleString('fr-FR')} CDF
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              (~${stakeUSD} USD)
            </span>
          </label>
          <span className="text-[11px] text-slate-400">Paiement Mobile Money ou Cash</span>
        </div>

        {/* Pilules de mise rapide */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {QUICK_STAKES_CDF.map((amt) => {
            const isSelected = stakeCDF === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => setStakeCDF(amt)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {amt.toLocaleString('fr-FR')} CDF
              </button>
            );
          })}
        </div>

        {/* Input libre */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="number"
              min="500"
              step="500"
              value={stakeCDF}
              onChange={(e) => setStakeCDF(Math.max(500, Number(e.target.value) || 0))}
              placeholder="Saisir montant personnalisé en CDF..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400 pr-14"
            />
            <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-400 font-mono">
              CDF
            </span>
          </div>

          <div className="text-xs bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 whitespace-nowrap">
            Cote totale : <strong className="text-emerald-400 font-mono">@{coteTotale}</strong>
          </div>
        </div>
      </div>

      {/* RÉSULTAT DU CALCUL DES GAINS POTENTIELS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Cote combinée */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Cote Globale Validée
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              @{coteTotale}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {analysis.pronostics.length} sélection(s) ≥ 80%
          </span>
        </div>

        {/* Gain brut */}
        <div className="bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-3 rounded-xl border border-amber-500/50 flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
            Gain Brut Potentiel
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {gainBrut.toLocaleString('fr-FR')} CDF
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Équivalent : ~${gainUSD} USD
          </span>
        </div>

        {/* Bénéfice net */}
        <div className="bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-950 p-3 rounded-xl border border-emerald-500/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
              Bénéfice Net Retirable
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              +{roiPercent}%
            </span>
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              +{beneficeNet.toLocaleString('fr-FR')} CDF
            </span>
          </div>
          <span className="text-[10px] text-emerald-300/80 font-medium">
            Gain pur déduction faite de la mise
          </span>
        </div>
      </div>

      {/* BARRE D'ACTIONS : EXPORTATION IMAGE, PDF, PARTAGE WHATSAPP & TELEGRAM */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Partager ou exporter ce coupon NgengeSport.cd :
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition active:scale-95"
            title="Envoyer le coupon complet avec mise et cotes sur WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-900/30 transition active:scale-95"
            title="Partager le coupon sur Telegram"
          >
            <Smartphone className="w-4 h-4" />
            <span>Telegram</span>
          </button>

          {/* Image HD PNG */}
          <button
            onClick={handleExportImage}
            disabled={isExportingImage}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-900/20 transition active:scale-95"
            title="Télécharger l'image HD du ticket imprimable"
          >
            <Download className={`w-4 h-4 ${isExportingImage ? 'animate-bounce' : ''}`} />
            <span>{isExportingImage ? 'Génération...' : 'Image HD PNG'}</span>
          </button>

          {/* Imprimer / PDF */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition active:scale-95"
            title="Ouvrir la vue d'impression / Enregistrer en PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimer / PDF</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
          <p>
            💡 <em>Conseil NgengeSport RDC</em> : Les tickets peuvent être joués directement en point de vente NgengeSport ou via les dépôts Mobile Money (Orange Money, M-Pesa, Airtel Money).
          </p>

          <button
            onClick={onCopyText}
            className="text-amber-400 hover:underline flex items-center gap-1 font-semibold flex-shrink-0 self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Coupon Copié
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copier le texte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
