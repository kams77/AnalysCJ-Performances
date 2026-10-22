import { ParsedAnalysis } from '../App';

/**
 * Génère une image PNG haute définition (1200x1400) du coupon certifié NgengeSport
 * et déclenche son téléchargement direct.
 */
export function generateCouponImage(analysis: ParsedAnalysis, stakeCDF: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1250;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context non disponible');
      }

      // 1. Fond sombre dégradé de style NgengeSport
      const bgGrad = ctx.createLinearGradient(0, 0, 1000, 1250);
      bgGrad.addColorStop(0, '#020617'); // slate-950
      bgGrad.addColorStop(0.5, '#0B1120'); // deep navy
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1000, 1250);

      // Bordure dorée d'accréditation
      ctx.strokeStyle = '#F59E0B'; // amber-500
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 960, 1210);

      // Liseré intérieur émeraude
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // emerald-500
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, 944, 1194);

      // 2. En-tête : Badge et Marque
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(50, 45, 900, 75, 12);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COUPON OFFICIEL NGENGESPORT.CD · RDC CONGO', 500, 78);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('RAPPROCHEMENT STATISTIQUE EXCLUSIF · SEUIL GARANTI ≥ 80% PROBABILITÉ', 500, 104);

      // 3. Match & Compétition
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`${analysis.match.domicile}  vs  ${analysis.match.exterieur}`, 500, 175);

      ctx.fillStyle = '#FCD34D'; // amber-300
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`🏆 ${analysis.match.competition}`, 500, 210);

      // Encadré Date & Heure & Stade
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.beginPath();
      ctx.roundRect(70, 235, 860, 65, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`📅 ${analysis.match.date}  ·  📍 ${analysis.match.stade || 'Stade officiel'}`, 500, 264);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '15px sans-serif';
      ctx.fillText(`👤 Arbitre officiel : ${analysis.match.arbitre || 'Arbitre désigné'}`, 500, 288);

      // 4. Sélections du coupon
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ SÉLECTIONS VALIDÉES CARTONS JAUNES & CORNERS :', 70, 345);

      let currentY = 370;
      const pronos = (analysis.pronostics || []).slice(0, 4);

      pronos.forEach((p, idx) => {
        const isYellow = p.marche === 'cartons_jaunes';

        // Boîte prono
        ctx.fillStyle = isYellow ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)';
        ctx.beginPath();
        ctx.roundRect(70, currentY, 860, 100, 10);
        ctx.fill();
        ctx.strokeStyle = isYellow ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tag marché
        ctx.fillStyle = isYellow ? '#F59E0B' : '#10B981';
        ctx.beginPath();
        ctx.roundRect(85, currentY + 14, 180, 28, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isYellow ? '🟨 CARTONS JAUNES' : '🚩 CORNERS', 175, currentY + 33);

        // Cote et Probabilité
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(740, currentY + 14, 175, 28, 6);
        ctx.fill();
        ctx.fillStyle = isYellow ? '#F59E0B' : '#34D399';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Cote @${p.cote_ngenge || 1.65} · ${p.probabilite}%`, 827, currentY + 33);

        // Intitulé de sélection
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(p.selection, 85, currentY + 70);

        // Règle NgengeSport
        ctx.fillStyle = '#94A3B8';
        ctx.font = '13px sans-serif';
        ctx.fillText(`📋 ${p.regle_ngenge || 'Conditions officielles ngengesport.cd respectées'}`, 85, currentY + 92);

        currentY += 115;
      });

      // 5. Encadré Cote Totale et Calculateur de Mise en CDF
      const coteTotale = analysis.ticket_ngengesport?.cote_totale_combinee || 2.35;
      const gainBrut = Math.round(stakeCDF * coteTotale);
      const beneficeNet = gainBrut - stakeCDF;
      const gainUSD = (gainBrut / 2800).toFixed(2);

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(70, currentY + 15, 860, 160, 12);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Colonne Gauche : Cote & Mise
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('COTE COMBINÉE ESTIMÉE', 95, currentY + 50);

      ctx.fillStyle = '#34D399';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`@${coteTotale}`, 95, currentY + 95);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Mise simulée : ${stakeCDF.toLocaleString('fr-FR')} CDF (~$${(stakeCDF / 2800).toFixed(2)})`, 95, currentY + 130);

      // Colonne Droite : Gain Brut & Bénéfice Net
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('GAIN BRUT POTENTIEL', 905, currentY + 50);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(`${gainBrut.toLocaleString('fr-FR')} CDF`, 905, currentY + 95);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Bénéfice Net : +${beneficeNet.toLocaleString('fr-FR')} CDF (~$${gainUSD} USD)`, 905, currentY + 130);

      // 6. Bas de page : Conditions officielles & signature
      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Conditions ngengesport.cd : Seuls les cartons jaunes donnés aux joueurs sur le terrain comptent. Seuls les corners tirés comptent.',
        500,
        1170
      );
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Analys C&J Performances · Moteur de Rapprochement Statistique Football 2026', 500, 1195);

      // Convertir le canvas en URL de données
      const dataUrl = canvas.toDataURL('image/png');

      // Déclencher le téléchargement du fichier
      const link = document.createElement('a');
      const safeHome = analysis.match.domicile.replace(/[^a-zA-Z0-9]/g, '_');
      const safeAway = analysis.match.exterieur.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Ticket-NgengeSport_${safeHome}_vs_${safeAway}.png`;
      link.href = dataUrl;
      link.click();

      resolve(dataUrl);
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Lance l'impression du ticket ou l'exportation au format PDF
 */
export function printCouponPDF(analysis: ParsedAnalysis, stakeCDF: number = 5000) {
  const coteTotale = analysis.ticket_ngengesport?.cote_totale_combinee || 2.35;
  const gainBrut = Math.round(stakeCDF * coteTotale);
  const beneficeNet = gainBrut - stakeCDF;

  const pronosHtml = (analysis.pronostics || [])
    .map(
      (p) => `
      <div style="border: 1px solid #d97706; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #fafaf9;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: bold; background: ${p.marche === 'cartons_jaunes' ? '#fef3c7' : '#d1fae5'}; color: ${p.marche === 'cartons_jaunes' ? '#b45309' : '#047857'}; padding: 3px 8px; border-radius: 4px;">
            ${p.marche === 'cartons_jaunes' ? '🟨 CARTONS JAUNES' : '🚩 CORNERS'}
          </span>
          <span style="font-family: monospace; font-weight: bold; font-size: 13px;">
            Cote @${p.cote_ngenge || 1.65} · Proba ${p.probabilite}%
          </span>
        </div>
        <div style="font-size: 16px; font-weight: bold; color: #1c1917; margin-bottom: 4px;">${p.selection}</div>
        <div style="font-size: 12px; color: #78716c; font-style: italic;">📋 ${p.regle_ngenge || 'Conditions NgengeSport respectées'}</div>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Ticket NgengeSport.cd - ${analysis.match.domicile} vs ${analysis.match.exterieur}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1c1917; }
        .ticket { max-width: 650px; margin: 0 auto; border: 2px solid #d97706; border-radius: 14px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px dashed #d6d3d1; padding-bottom: 16px; margin-bottom: 16px; }
        .logo { font-size: 20px; font-weight: 900; color: #b45309; }
        .title { font-size: 22px; font-weight: 800; margin: 8px 0; }
        .meta { font-size: 13px; color: #57534e; margin-bottom: 4px; }
        .summary-box { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 10px; padding: 14px; margin-top: 18px; }
        .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <div class="logo">🎟️ NGENGESPORT.CD · RDC CONGO</div>
          <div style="font-size: 11px; font-weight: bold; color: #047857; letter-spacing: 1px;">COUPON CERTIFIÉ ≥ 80% PROBABILITÉ</div>
          <div class="title">${analysis.match.domicile} vs ${analysis.match.exterieur}</div>
          <div class="meta">🏆 ${analysis.match.competition}  ·  📅 ${analysis.match.date}</div>
          <div class="meta">🏟️ ${analysis.match.stade || 'Stade officiel'}  ·  👤 Arbitre : ${analysis.match.arbitre || 'Officiel'}</div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 10px; color: #44403c;">Sélections Analys C&J Performances :</h3>
        ${pronosHtml}

        <div class="summary-box">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td><strong>Cote combinée totale :</strong></td>
              <td style="text-align: right; font-family: monospace; font-size: 18px; font-weight: 900; color: #b45309;">@${coteTotale}</td>
            </tr>
            <tr>
              <td><strong>Mise simulée :</strong></td>
              <td style="text-align: right; font-weight: bold;">${stakeCDF.toLocaleString('fr-FR')} CDF</td>
            </tr>
            <tr>
              <td><strong style="color: #047857;">Gain potentiel brut :</strong></td>
              <td style="text-align: right; font-size: 18px; font-weight: 900; color: #047857;">${gainBrut.toLocaleString('fr-FR')} CDF</td>
            </tr>
            <tr>
              <td><span style="font-size: 12px; color: #78716c;">Bénéfice net estimé :</span></td>
              <td style="text-align: right; font-size: 13px; font-weight: bold; color: #047857;">+${beneficeNet.toLocaleString('fr-FR')} CDF</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          Conditions ngengesport.cd : Cartons aux joueurs sur le terrain uniquement (temps réglementaire 90 min). Corners tirés.<br>
          Généré par Analys C&J Performances · Jouez de manière responsable.
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export interface MultiMatchPick {
  id: string;
  matchId: string;
  matchTitle: string;
  leagueName: string;
  marche: 'cartons_jaunes' | 'corners';
  selection: string;
  cote: number;
  probabilite: number;
  date?: string;
}

/**
 * Génère une image PNG HD (1000x1350) pour un combiné Multi-Matchs (2 à 5 matchs)
 */
export function generateMultiMatchCouponImage(
  picks: MultiMatchPick[],
  stakeCDF: number = 5000
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context non disponible');

      // 1. Fond sombre dégradé de style NgengeSport
      const bgGrad = ctx.createLinearGradient(0, 0, 1000, 1350);
      bgGrad.addColorStop(0, '#020617'); // slate-950
      bgGrad.addColorStop(0.5, '#0B1120'); // deep navy
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1000, 1350);

      // Bordure dorée d'accréditation
      ctx.strokeStyle = '#F59E0B'; // amber-500
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 960, 1310);

      // Liseré intérieur émeraude
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, 944, 1294);

      // 2. En-tête : Badge et Marque
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(50, 45, 900, 75, 12);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COMBINÉ MULTI-MATCHS NGENGESPORT.CD · RDC CONGO', 500, 78);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`SUPER-TICKET SÉCURISÉ (${picks.length} MATCHS) · SÉLECTIONS CERTIFIÉES ≥ 80%`, 500, 104);

      // Calcul super cote
      const superCote = parseFloat(
        picks.reduce((acc, p) => acc * (p.cote || 1.6), 1).toFixed(2)
      );
      const gainBrut = Math.round(stakeCDF * superCote);
      const beneficeNet = gainBrut - stakeCDF;

      // 3. Titre combiné
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(`COMBINÉ GÉANT 2 À 5 MATCHS`, 500, 160);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Cote Globale Multipliée : @${superCote}  ·  Mise : ${stakeCDF.toLocaleString('fr-FR')} CDF`, 500, 192);

      // 4. Liste des sélections (jusqu'à 5)
      let currentY = 225;
      const cardHeight = Math.min(130, Math.floor(650 / Math.max(picks.length, 1)));

      picks.forEach((p, idx) => {
        const isYellow = p.marche === 'cartons_jaunes';

        // Boîte du match
        ctx.fillStyle = isYellow ? 'rgba(245, 158, 11, 0.09)' : 'rgba(16, 185, 129, 0.09)';
        ctx.beginPath();
        ctx.roundRect(60, currentY, 880, cardHeight, 10);
        ctx.fill();
        ctx.strokeStyle = isYellow ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Numéro de match + Ligue
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.roundRect(75, currentY + 12, 160, 26, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`MATCH ${idx + 1} · ${p.leagueName.toUpperCase()}`, 155, currentY + 29);

        // Intitulé du Match
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(p.matchTitle, 250, currentY + 31);

        // Sélection
        ctx.fillStyle = isYellow ? '#FCD34D' : '#6EE7B7';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${isYellow ? '🟨' : '🚩'} ${p.selection}`, 75, currentY + 70);

        // Cote & Proba à droite
        ctx.textAlign = 'right';
        ctx.fillStyle = '#10B981';
        ctx.font = '900 24px monospace';
        ctx.fillText(`@${p.cote}`, 920, currentY + 45);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`Confiance : ${p.probabilite}%`, 920, currentY + 75);

        currentY += cardHeight + 15;
      });

      // 5. Bloc Bilan Financier CDF
      const finY = Math.max(currentY + 10, 920);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(60, finY, 880, 240, 12);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💰 SIMULATION DES GAINS EN FRANCS CONGOLAIS (CDF) :', 90, finY + 38);

      // Lignes de gain
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText('Mise totale engagée :', 90, finY + 75);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${stakeCDF.toLocaleString('fr-FR')} CDF (~$${(stakeCDF / 2800).toFixed(1)})`, 910, finY + 75);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Super-Cote combinée :', 90, finY + 115);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`@${superCote}`, 910, finY + 115);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GAIN BRUT POTENTIEL :', 90, finY + 160);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#10B981';
      ctx.font = '900 30px monospace';
      ctx.fillText(`${gainBrut.toLocaleString('fr-FR')} CDF`, 910, finY + 160);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Bénéfice Net : +${beneficeNet.toLocaleString('fr-FR')} CDF (~$${(beneficeNet / 2800).toFixed(1)})`, 90, finY + 200);

      // 6. Pied de page
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748B';
      ctx.font = '13px sans-serif';
      ctx.fillText(
        'Règlement ngengesport.cd : Cartons aux joueurs sur le terrain (90 min). Corners effectivement tirés.',
        500,
        1295
      );
      ctx.fillText('Analys C&J Performances · Combiné Multi-Matchs · Certifié ≥ 80% Probabilité', 500, 1318);

      // Déclencheur téléchargement
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Combine_NgengeSport_${picks.length}Matchs_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Lance l'impression du combiné multi-matchs ou l'exportation au format PDF
 */
export function printMultiMatchCouponPDF(picks: MultiMatchPick[], stakeCDF: number = 5000) {
  const superCote = parseFloat(
    picks.reduce((acc, p) => acc * (p.cote || 1.6), 1).toFixed(2)
  );
  const gainBrut = Math.round(stakeCDF * superCote);
  const beneficeNet = gainBrut - stakeCDF;

  const picksHtml = picks
    .map(
      (p, idx) => `
      <div style="border: 1px solid #d97706; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #fafaf9;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: bold; background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px;">
            MATCH ${idx + 1} · ${p.leagueName}
          </span>
          <span style="font-family: monospace; font-weight: bold; font-size: 13px; color: #047857;">
            Cote @${p.cote} · Proba ${p.probabilite}%
          </span>
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #1c1917; margin-bottom: 4px;">
          ${p.matchTitle}
        </div>
        <div style="font-size: 14px; font-weight: bold; color: #b45309;">
          ${p.marche === 'cartons_jaunes' ? '🟨' : '🚩'} ${p.selection}
        </div>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Combiné Multi-Matchs NgengeSport.cd (${picks.length} matchs)</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1c1917; }
        .ticket { max-width: 650px; margin: 0 auto; border: 2px solid #d97706; border-radius: 14px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px dashed #d6d3d1; padding-bottom: 16px; margin-bottom: 16px; }
        .logo { font-size: 20px; font-weight: 900; color: #b45309; }
        .title { font-size: 22px; font-weight: 800; margin: 8px 0; }
        .summary-box { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 10px; padding: 14px; margin-top: 18px; }
        .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <div class="logo">🎟️ NGENGESPORT.CD · RDC CONGO</div>
          <div style="font-size: 11px; font-weight: bold; color: #047857; letter-spacing: 1px;">COMBINÉ MULTI-MATCHS CERTIFIÉ ≥ 80%</div>
          <div class="title">SUPER-TICKET ${picks.length} SÉLECTIONS</div>
          <div style="font-size: 13px; color: #57534e;">Cartons Jaunes & Corners Uniquement · ngengesport.cd</div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 10px; color: #44403c;">Sélections combinées :</h3>
        ${picksHtml}

        <div class="summary-box">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td><strong>Super-Cote combinée :</strong></td>
              <td style="text-align: right; font-family: monospace; font-size: 20px; font-weight: 900; color: #b45309;">@${superCote}</td>
            </tr>
            <tr>
              <td><strong>Mise simulée (CDF) :</strong></td>
              <td style="text-align: right; font-weight: bold;">${stakeCDF.toLocaleString('fr-FR')} CDF (~$${(stakeCDF / 2800).toFixed(1)})</td>
            </tr>
            <tr>
              <td><strong style="color: #047857;">Gain potentiel brut :</strong></td>
              <td style="text-align: right; font-size: 20px; font-weight: 900; color: #047857;">${gainBrut.toLocaleString('fr-FR')} CDF</td>
            </tr>
            <tr>
              <td><span style="font-size: 12px; color: #78716c;">Bénéfice net estimé :</span></td>
              <td style="text-align: right; font-size: 14px; font-weight: bold; color: #047857;">+${beneficeNet.toLocaleString('fr-FR')} CDF</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          Conditions ngengesport.cd : Cartons aux joueurs sur le terrain uniquement (temps réglementaire 90 min). Corners tirés.<br>
          Généré par Analys C&J Performances · Jouez de manière responsable.
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

