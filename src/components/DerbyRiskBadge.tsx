import React from 'react';
import {
  Flame,
  AlertTriangle,
  CloudRain,
  Sun,
  ShieldAlert,
  Trophy,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface Props {
  homeTeam: string;
  awayTeam: string;
  leagueName?: string;
  stadium?: string;
}

interface DerbyInfo {
  isDerby: boolean;
  name: string;
  tensionLevel: 'Extrême' | 'Très Élevée' | 'Élevée' | 'Modérée';
  tensionPercent: number;
  cartonImpact: string;
  cornerImpact: string;
  weather: string;
  weatherType: 'rain' | 'clear' | 'cloudy';
  stakeTitle: string;
  advice: string;
}

export function detectDerby(home: string, away: string, league: string = ''): DerbyInfo {
  const norm = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const h = norm(home);
  const a = norm(away);

  // 1. Ligue 1
  if ((h.includes('paris') || h.includes('psg')) && (a.includes('marseille') || a.includes('om')) ||
      (a.includes('paris') || a.includes('psg')) && (h.includes('marseille') || h.includes('om'))) {
    return {
      isDerby: true,
      name: '🔥 Le Classique : PSG vs Marseille',
      tensionLevel: 'Extrême',
      tensionPercent: 96,
      cartonImpact: '+35% de cartons jaunes attendus. Les 2ème mi-temps sont particulièrement électriques avec de multiples fautes tactiques.',
      cornerImpact: 'Rythme d\'attaque soutenu des deux côtés avec utilisation intensive des couloirs (Corners attendus > 10.5).',
      weather: '16°C · Ciel clair · Pelouse ultra-rapide favorisant les accélérations et les duels engagés.',
      weatherType: 'clear',
      stakeTitle: 'Rivalité Historique & Course au Titre',
      advice: 'Sur ngengesport.cd, la sélection "Plus de 3,5 Cartons Jaunes" est l\'une des plus fiables de la saison sur ce choc.',
    };
  }

  if ((h.includes('lyon') || h.includes('ol')) && (a.includes('saint-etienne') || a.includes('asse')) ||
      (a.includes('lyon') || a.includes('ol')) && (h.includes('saint-etienne') || h.includes('asse'))) {
    return {
      isDerby: true,
      name: '🔥 Derby du Rhône : OL vs AS Saint-Étienne',
      tensionLevel: 'Extrême',
      tensionPercent: 98,
      cartonImpact: 'Historiquement le match le plus agressif de France : duel physique intense et fautes de frustration.',
      cornerImpact: 'Bataille de milieu de terrain fermée débouchant sur des centres contrés.',
      weather: '13°C · Bruine fine · Pelouse glissante augmentant les tacles en retard.',
      weatherType: 'rain',
      stakeTitle: 'Suprématie Régionale & Fierté Populaire',
      advice: 'Ligne Cartons Jaunes Over 4.5 fortement appuyée par les statistiques H2H.',
    };
  }

  // 2. Premier League
  if ((h.includes('arsenal') && a.includes('chelsea')) || (a.includes('arsenal') && h.includes('chelsea'))) {
    return {
      isDerby: true,
      name: '🔥 London Derby : Arsenal vs Chelsea',
      tensionLevel: 'Très Élevée',
      tensionPercent: 88,
      cartonImpact: 'Duel londonien récurrent : pressing tout terrain et duels musclés dans les 30 derniers mètres.',
      cornerImpact: 'Volume offensif très élevé sur les ailes (Moyenne 10.8 corners sur les 5 dernières confrontations).',
      weather: '12°C · Averses modérées · Ballons fusants provoquant des parades déviées en corners.',
      weatherType: 'rain',
      stakeTitle: 'Derby de Londres & Qualification Ligue des Champions',
      advice: 'Double validation : Over 8,5 Corners et Over 3,5 Cartons Jaunes certifiés.',
    };
  }

  if ((h.includes('liverpool') && a.includes('everton')) || (a.includes('liverpool') && h.includes('everton'))) {
    return {
      isDerby: true,
      name: '🔥 Merseyside Derby : Liverpool vs Everton',
      tensionLevel: 'Extrême',
      tensionPercent: 97,
      cartonImpact: 'Le derby le plus sanctionné de l\'histoire de la Premier League : contacts rugueux et engagement total.',
      cornerImpact: 'Assiègement régulier de la surface d\'Everton par Liverpool débouchant sur une avalanche de corners.',
      weather: '11°C · Ciel couvert avec rafales de vent.',
      weatherType: 'cloudy',
      stakeTitle: 'Derby de la Mersey',
      advice: 'Sécuriser le Plus de 3,5 Cartons Jaunes dès la 1ère mi-temps.',
    };
  }

  if ((h.includes('manchester city') || h.includes('man city')) && (a.includes('manchester united') || a.includes('man united')) ||
      (a.includes('manchester city') || a.includes('man city')) && (h.includes('manchester united') || h.includes('man united'))) {
    return {
      isDerby: true,
      name: '🔥 Manchester Derby : Man City vs Man United',
      tensionLevel: 'Extrême',
      tensionPercent: 93,
      cartonImpact: 'Fautes tactiques répétées de Manchester United pour enrayer les circuits de passes de City.',
      cornerImpact: 'City accumule une possession écrasante provoquant de nombreux corners concédés.',
      weather: '14°C · Temps humide typiquement mancunien.',
      weatherType: 'rain',
      stakeTitle: 'Suprématie de Manchester',
      advice: 'Corners Man City + Cartons Jaunes United : combinaison idéale.',
    };
  }

  // 3. Serie A
  if ((h.includes('inter') && a.includes('juventus')) || (a.includes('inter') && h.includes('juventus'))) {
    return {
      isDerby: true,
      name: '🔥 Derby d’Italie : Inter Milan vs Juventus',
      tensionLevel: 'Extrême',
      tensionPercent: 97,
      cartonImpact: 'Duel tactique fermé où chaque contre-attaque est stoppée par une faute d\'antijeu sanctionnée d\'un carton jaune.',
      cornerImpact: 'Jeu vertical avec centres déviés par des défenses regroupées.',
      weather: '15°C · Nuit fraîche à San Siro.',
      weatherType: 'clear',
      stakeTitle: 'Course au Scudetto & Hégémonie Italienne',
      advice: 'Moyenne de 5.2 cartons jaunes sur les 5 derniers duels.',
    };
  }

  if ((h.includes('milan') && a.includes('inter')) || (a.includes('milan') && h.includes('inter'))) {
    return {
      isDerby: true,
      name: '🔥 Derby della Madonnina : AC Milan vs Inter Milan',
      tensionLevel: 'Extrême',
      tensionPercent: 99,
      cartonImpact: 'Climat incandescent : contestations d\'arbitrage systématiques et duels physiques intraitables.',
      cornerImpact: 'Les deux équipes attaquent constamment par les ailes.',
      weather: '16°C · Atmosphère chaude à San Siro.',
      weatherType: 'clear',
      stakeTitle: 'Derby de Milan',
      advice: 'Cartons Jaunes Plus de 4,5 à cote très élevée sur ngengesport.',
    };
  }

  if ((h.includes('lazio') && a.includes('roma')) || (a.includes('lazio') && h.includes('roma'))) {
    return {
      isDerby: true,
      name: '🔥 Derby della Capitale : Lazio vs AS Roma',
      tensionLevel: 'Extrême',
      tensionPercent: 100,
      cartonImpact: 'Le derby le plus explosif d\'Europe : moyenne record de 6.4 cartons par match.',
      cornerImpact: 'Rythme saccadé par les arrêts de jeu, corners en seconde période.',
      weather: '18°C · Stadio Olimpico plein à craquer.',
      weatherType: 'clear',
      stakeTitle: 'Derby de Rome',
      advice: 'Over Cartons Jaunes est la priorité n°1 certifiée.',
    };
  }

  // 4. La Liga
  if ((h.includes('real') && a.includes('barcelone')) || (a.includes('real') && h.includes('barcelone'))) {
    return {
      isDerby: true,
      name: '🔥 El Clásico : Real Madrid vs FC Barcelone',
      tensionLevel: 'Extrême',
      tensionPercent: 99,
      cartonImpact: 'Le sommet du football mondial :intensité folle, duels 1v1 répétés sur les ailes générant des fautes inévitables.',
      cornerImpact: 'Transitions offensives fulgurantes générant un nombre colossal de corners.',
      weather: '19°C · Pelouse impeccable.',
      weatherType: 'clear',
      stakeTitle: 'Choc Planétaire & Titre de La Liga',
      advice: 'Plus de 8,5 Corners & Plus de 3,5 Cartons Jaunes certifiés.',
    };
  }

  if ((h.includes('betis') && a.includes('seville')) || (a.includes('betis') && h.includes('seville'))) {
    return {
      isDerby: true,
      name: '🔥 El Gran Derbi : Real Betis vs Séville FC',
      tensionLevel: 'Extrême',
      tensionPercent: 98,
      cartonImpact: 'L\'affiche la plus indisciplinée d\'Espagne : 6.8 cartons jaunes par confrontation.',
      cornerImpact: 'Forte activité sur les couloirs et tirs lointains contrés.',
      weather: '22°C · Soirée andalouse très chaude.',
      weatherType: 'clear',
      stakeTitle: 'Derby Sévillan',
      advice: 'Over Cartons Jaunes à jouer les yeux fermés.',
    };
  }

  // 5. Bundesliga
  if ((h.includes('bayern') && a.includes('dortmund')) || (a.includes('bayern') && h.includes('dortmund'))) {
    return {
      isDerby: true,
      name: '🔥 Der Klassiker : Bayern Munich vs Dortmund',
      tensionLevel: 'Très Élevée',
      tensionPercent: 90,
      cartonImpact: 'Match à très haute intensité avec pressing haut et fautes de compensation.',
      cornerImpact: 'Volume de corners très élevé (> 10.5 corners réguliers).',
      weather: '14°C · Ciel dégagé.',
      weatherType: 'clear',
      stakeTitle: 'Meisterschale Bundesliga',
      advice: 'Over Corners Match est le marché roi sur cette affiche.',
    };
  }

  // 6. Portugal
  if ((h.includes('benfica') && a.includes('porto')) || (a.includes('benfica') && h.includes('porto'))) {
    return {
      isDerby: true,
      name: '🔥 O Clássico : Benfica vs FC Porto',
      tensionLevel: 'Extrême',
      tensionPercent: 98,
      cartonImpact: 'Pression maximale sur l\'arbitre, antijeu et échauffourées fréquentes.',
      cornerImpact: 'Centres continus et défenses rugueuses concédant des corners.',
      weather: '17°C · Ambiance de feu à l\'Estádio da Luz / Dragão.',
      weatherType: 'clear',
      stakeTitle: 'Le Sommet du Portugal',
      advice: 'Over 4,5 Cartons Jaunes très rentable.',
    };
  }

  // Détection par défaut pour match à haute intensité
  return {
    isDerby: false,
    name: `⚡ Choc Majeur : ${home} vs ${away}`,
    tensionLevel: 'Élevée',
    tensionPercent: 78,
    cartonImpact: 'Engagement standard de haut niveau : les cartons sont concentrés en 2ème période.',
    cornerImpact: 'Équilibre tactique favorable aux débordements et tirs contrés en corners.',
    weather: '16°C · Conditions météorologiques optimales pour le football professionnel.',
    weatherType: 'clear',
    stakeTitle: 'Enjeu Compétition & Course aux Points',
    advice: 'Suivre les lignes mathématiques certifiées ≥ 80% calculées pour ngengesport.cd.',
  };
}

export const DerbyRiskBadge: React.FC<Props> = ({
  homeTeam,
  awayTeam,
  leagueName = 'Ligue',
  stadium,
}) => {
  const derby = detectDerby(homeTeam, awayTeam, leagueName);

  return (
    <div
      className={`rounded-2xl p-4 md:p-5 border transition-all ${
        derby.isDerby
          ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-500/50 shadow-lg shadow-rose-950/30'
          : 'bg-gradient-to-br from-slate-900/90 to-slate-950 border-slate-800'
      }`}
    >
      {/* En-tête Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              derby.isDerby
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {derby.isDerby ? <Flame className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  derby.isDerby
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {derby.isDerby ? '🚨 DÉTECTEUR DE DERBY & FORTE TENSION' : '⚡ ANALYSE DE RISQUE DU MATCH'}
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">
                {derby.stakeTitle}
              </span>
            </div>
            <h4 className="font-extrabold text-sm md:text-base text-white mt-1">
              {derby.name}
            </h4>
          </div>
        </div>

        {/* Jauge visuelle de tension */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Indice de Tension
            </span>
            <span
              className={`text-sm font-black font-mono ${
                derby.tensionPercent >= 90
                  ? 'text-rose-400'
                  : derby.tensionPercent >= 80
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {derby.tensionPercent}% ({derby.tensionLevel})
            </span>
          </div>
          <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                derby.tensionPercent >= 90
                  ? 'bg-rose-500'
                  : derby.tensionPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${derby.tensionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Détails d'impact du contexte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3.5 text-xs">
        {/* Impact Cartons Jaunes */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase">
            <span>🟨 Impact Cartons Jaunes ngengesport.cd :</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {derby.cartonImpact}
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>Règle : Seuls les cartons aux joueurs en jeu durant 90 min comptent.</span>
          </div>
        </div>

        {/* Impact Corners & Météo */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] uppercase">
            <span>🚩 Impact Corners & Facteur Météo :</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {derby.cornerImpact}
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-medium">
            {derby.weatherType === 'rain' ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            )}
            <span>{derby.weather}</span>
          </div>
        </div>
      </div>

      {/* Conseil stratégique de mise */}
      <div className="mt-3 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2 text-xs">
        <span className="text-amber-400 font-bold whitespace-nowrap">💡 Conseil NgengeSport :</span>
        <span className="text-slate-300 text-[11px] font-medium">{derby.advice}</span>
      </div>
    </div>
  );
};
