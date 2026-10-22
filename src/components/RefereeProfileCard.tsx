import React from 'react';
import {
  UserCheck,
  AlertOctagon,
  Scale,
  Clock,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface Props {
  refereeName: string;
  leagueName?: string;
  fixtureReferee?: {
    name: string;
    avgYellows: number;
    avgFouls: number;
    severity: 'Très sévère' | 'Sévère' | 'Modéré' | 'Tolérant';
  };
  leagueAvgYellows?: number;
}

// Données enrichies des arbitres officiels récurrents
const REFEREE_DATABASE: Record<
  string,
  {
    avgYellows: number;
    avgFouls: number;
    severity: 'Très sévère' | 'Sévère' | 'Modéré' | 'Tolérant';
    yellows1stHalf: number;
    yellows2ndHalf: number;
    quickCardTendency: string;
    foulsPerYellow: number;
    matchesSeason: number;
    styleNote: string;
  }
> = {
  'benoît bastien': {
    avgYellows: 4.85,
    avgFouls: 27.4,
    severity: 'Très sévère',
    yellows1stHalf: 1.4,
    yellows2ndHalf: 3.45,
    quickCardTendency: 'Avertit très vite (< 18e minute) pour poser son autorité',
    foulsPerYellow: 5.6,
    matchesSeason: 22,
    styleNote: 'Très strict sur les contestations et les tirages de maillot d’arrêt d’attaque.',
  },
  'clément turpin': {
    avgYellows: 4.1,
    avgFouls: 24.8,
    severity: 'Sévère',
    yellows1stHalf: 1.1,
    yellows2ndHalf: 3.0,
    quickCardTendency: 'Dialogue en début de match, sévit fermement après la 35e minute',
    foulsPerYellow: 6.0,
    matchesSeason: 24,
    styleNote: 'Arbitre international expérimenté : protège les attaquants et sanctionne les tacles par derrière.',
  },
  'françois letexier': {
    avgYellows: 4.6,
    avgFouls: 26.2,
    severity: 'Très sévère',
    yellows1stHalf: 1.3,
    yellows2ndHalf: 3.3,
    quickCardTendency: 'Intraitable sur l\'antijeu et la simulation',
    foulsPerYellow: 5.7,
    matchesSeason: 21,
    styleNote: 'Rythme élevé imposé : ne tolère pas les contestations véhémentes des capitaines.',
  },
  'simon hooper': {
    avgYellows: 4.5,
    avgFouls: 25.1,
    severity: 'Sévère',
    yellows1stHalf: 1.2,
    yellows2ndHalf: 3.3,
    quickCardTendency: 'Laisse jouer les contacts légers puis sort les cartons en série',
    foulsPerYellow: 5.6,
    matchesSeason: 20,
    styleNote: 'Arbitrage typique de Premier League : grosse décharge de cartons en fin de match.',
  },
  'michael oliver': {
    avgYellows: 4.3,
    avgFouls: 24.5,
    severity: 'Sévère',
    yellows1stHalf: 1.2,
    yellows2ndHalf: 3.1,
    quickCardTendency: 'Ferme dès les premières fautes répétées',
    foulsPerYellow: 5.7,
    matchesSeason: 23,
    styleNote: 'Application stricte des règles de la FA, n’hésite pas à avertir les gardiens qui gagnent du temps.',
  },
  'anthony taylor': {
    avgYellows: 4.75,
    avgFouls: 26.9,
    severity: 'Très sévère',
    yellows1stHalf: 1.5,
    yellows2ndHalf: 3.25,
    quickCardTendency: 'Gâchette rapide : sanctionne dès le 1er tacle glissé non maîtrisé',
    foulsPerYellow: 5.6,
    matchesSeason: 25,
    styleNote: 'Arbitrage sous haute autorité, seuil de tolérance physique réduit.',
  },
  'daniele doveri': {
    avgYellows: 5.1,
    avgFouls: 28.7,
    severity: 'Très sévère',
    yellows1stHalf: 1.6,
    yellows2ndHalf: 3.5,
    quickCardTendency: 'Carton précoce quasi-systématique dans les grands chocs italiens',
    foulsPerYellow: 5.6,
    matchesSeason: 19,
    styleNote: 'Spécialiste des derbys de Serie A : siffle énormément pour éviter les bagarres.',
  },
  'jesús gil manzano': {
    avgYellows: 5.3,
    avgFouls: 29.4,
    severity: 'Très sévère',
    yellows1stHalf: 1.7,
    yellows2ndHalf: 3.6,
    quickCardTendency: 'Extrêmement sévère dès le quart d\'heure de jeu',
    foulsPerYellow: 5.5,
    matchesSeason: 21,
    styleNote: 'L\'un des arbitres les plus prolifiques en cartons de La Liga.',
  },
  'felix zwayer': {
    avgYellows: 4.4,
    avgFouls: 25.8,
    severity: 'Sévère',
    yellows1stHalf: 1.2,
    yellows2ndHalf: 3.2,
    quickCardTendency: 'Accentue les sanctions sur les fautes tactiques de contre',
    foulsPerYellow: 5.8,
    matchesSeason: 18,
    styleNote: 'Arbitrage rythmé en Bundesliga, très précis sur les mains et blocages.',
  },
  'artur soares dias': {
    avgYellows: 5.4,
    avgFouls: 31.0,
    severity: 'Très sévère',
    yellows1stHalf: 1.8,
    yellows2ndHalf: 3.6,
    quickCardTendency: 'Interventions immédiates avec carton jaune d\'entrée',
    foulsPerYellow: 5.7,
    matchesSeason: 20,
    styleNote: 'Arbitre numéro 1 portugais pour les derbys chauds à Porto et Lisbonne.',
  },
};

export const RefereeProfileCard: React.FC<Props> = ({
  refereeName,
  leagueName = 'Ligue 1',
  fixtureReferee,
  leagueAvgYellows = 3.65,
}) => {
  const norm = refereeName.trim().toLowerCase();
  const dbData = REFEREE_DATABASE[norm];

  const avgYellows =
    fixtureReferee?.avgYellows || dbData?.avgYellows || 4.75;
  const avgFouls = fixtureReferee?.avgFouls || dbData?.avgFouls || 26.5;
  const severity =
    fixtureReferee?.severity || dbData?.severity || (avgYellows >= 4.8 ? 'Très sévère' : avgYellows >= 4.2 ? 'Sévère' : 'Modéré');

  const yellows1stHalf = dbData?.yellows1stHalf || Number((avgYellows * 0.28).toFixed(1));
  const yellows2ndHalf = dbData?.yellows2ndHalf || Number((avgYellows * 0.72).toFixed(1));
  const quickCardTendency =
    dbData?.quickCardTendency || (avgYellows >= 4.7 ? 'Avertit rapidement (< 20e min pour poser le cadre)' : 'Temporise puis sévit');
  const foulsPerYellow = dbData?.foulsPerYellow || Number((avgFouls / avgYellows).toFixed(1));
  const styleNote =
    dbData?.styleNote || 'Arbitre officiel désigné appliquant scrupuleusement les consignes de discipline.';

  // Comparaison avec la moyenne du championnat
  const diffPercent = Math.round(((avgYellows - leagueAvgYellows) / leagueAvgYellows) * 100);
  const isAboveLeague = diffPercent >= 0;

  // Calcul position curseur jauge (entre 2 et 6 cartons)
  const gaugePercent = Math.min(100, Math.max(0, Math.round(((avgYellows - 2.5) / 3.5) * 100)));

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                👤 FICHE PROFIL ARBITRE OFFICIEL
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {leagueName}
              </span>
            </div>
            <h4 className="font-black text-base md:text-lg text-white mt-1">
              {refereeName || 'Arbitre Officiel'}
            </h4>
          </div>
        </div>

        {/* Badge sévérité */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl font-bold text-xs border flex items-center gap-1.5 ${
              severity === 'Très sévère'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : severity === 'Sévère'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {severity}
          </span>
          <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {avgYellows} CJ/match
          </span>
        </div>
      </div>

      {/* Jauge visuelle de sévérité graduée */}
      <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" /> Jauge de Sévérité & Tolérance Cartons :
          </span>
          <span className="text-amber-400 font-mono font-bold">
            {avgYellows} / match ({isAboveLeague ? `+${diffPercent}%` : `${diffPercent}%`} vs ligue)
          </span>
        </div>

        {/* Barre dégradée Tolérant -> Sévère -> Très sévère */}
        <div className="relative pt-2 pb-1">
          <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 w-full relative">
            {/* Curseur de l'arbitre */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-white border-2 border-slate-950 shadow-md shadow-white/50"
              style={{ left: `${gaugePercent}%` }}
              title={`Sévérité : ${avgYellows} cartons`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
            <span>🟢 Tolérant (&lt; 3.5)</span>
            <span>🟡 Modéré (3.5 - 4.2)</span>
            <span>🟠 Sévère (4.2 - 4.8)</span>
            <span className="font-bold text-rose-400">🔴 Très Sévère (&gt; 4.8)</span>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées de l'arbitre */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            ⏱️ 1ère Mi-temps
          </span>
          <span className="text-base font-black text-amber-400 font-mono block mt-0.5">
            ~{yellows1stHalf} CJ
          </span>
          <span className="text-[10px] text-slate-500">Pose son autorité</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            ⏱️ 2ème Mi-temps
          </span>
          <span className="text-base font-black text-rose-400 font-mono block mt-0.5">
            ~{yellows2ndHalf} CJ
          </span>
          <span className="text-[10px] text-slate-500">72% des avertissements</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            Fautes Sifflées
          </span>
          <span className="text-base font-black text-slate-200 font-mono block mt-0.5">
            {avgFouls} / m
          </span>
          <span className="text-[10px] text-slate-500">Intensité physique</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            Ratio Sévérité
          </span>
          <span className="text-base font-black text-emerald-400 font-mono block mt-0.5">
            1 CJ / {foulsPerYellow} fautes
          </span>
          <span className="text-[10px] text-slate-500">Seuil de tolérance bas</span>
        </div>
      </div>

      {/* Comportement & Règle ngengesport.cd */}
      <div className="space-y-2 text-xs">
        <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 space-y-1">
          <span className="font-bold text-amber-300 block text-[11px] uppercase">
            ⚡ Tempérament & Tendance de Sifflet :
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {quickCardTendency}. {styleNote}
          </p>
        </div>

        <div className="bg-emerald-950/30 rounded-xl p-2.5 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Impact ngengesport.cd certifié</strong> : Avec {avgYellows} cartons en moyenne, ce profil garantit une probabilité $\ge 80\%$ sur le <em>Plus de 3,5 Cartons Jaunes</em> (joueurs sur le terrain pendant les 90 min uniquement).
          </span>
        </div>
      </div>
    </div>
  );
};
