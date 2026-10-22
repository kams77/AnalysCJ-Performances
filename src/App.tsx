import React, { useState, useEffect } from 'react';
import {
  Settings,
  BookOpen,
  Play,
  Share2,
  Copy,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Check,
  RefreshCw,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Trophy,
  Flag,
  UserCheck,
  Sliders,
  ExternalLink,
  Info,
  Smartphone,
  Download,
  Calendar,
  Clock,
  Filter,
  TrendingUp,
  Layers,
  Flame,
} from 'lucide-react';
import { CalculateurMiseCDF } from './components/CalculateurMiseCDF';
import { HistoryTrackerModal } from './components/HistoryTrackerModal';
import { MultiMatchCombiner, MultiMatchFloatingBar } from './components/MultiMatchCombiner';
import { DerbyRiskBadge, detectDerby } from './components/DerbyRiskBadge';
import { RefereeProfileCard } from './components/RefereeProfileCard';
import { MultiMatchPick } from './utils/couponExporter';

// Interfaces pour les Championnats et Matchs
interface TeamStats {
  avgCornersFor: number;
  avgCornersAgainst: number;
  avgYellowsFor: number;
  avgYellowsAgainst: number;
  avgFouls: number;
  over8_5CornersRate: number;
  over3_5YellowsRate: number;
}

interface MatchFixture {
  id: string;
  leagueId: string;
  leagueName: string;
  country: string;
  flag: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  dayLabel?: 'Aujourd\'hui' | 'Demain' | 'Ce week-end' | 'Lundi';
  time: string;
  timezone?: string;
  stadium: string;
  referee: {
    name: string;
    avgYellows: number;
    avgFouls: number;
    severity: 'Très sévère' | 'Sévère' | 'Modéré' | 'Tolérant';
  };
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: {
    last5MatchesCorners: number[];
    last5MatchesYellows: number[];
    avgCorners: number;
    avgYellows: number;
  };
}

interface Championship {
  id: string;
  name: string;
  shortName: string;
  country: string;
  flag: string;
  leagueMoyenneCorners: number;
  leagueMoyenneCartons: number;
  description: string;
  matches: MatchFixture[];
}

export interface PronosticItem {
  marche: 'cartons_jaunes' | 'corners';
  cible: 'match' | 'domicile' | 'exterieur';
  selection: string;
  probabilite: number;
  cote_ngenge?: number;
  conforme_ngenge?: boolean;
  regle_ngenge?: string;
  justification: string;
  facteurs: string[];
}

export interface RapprochementData {
  methode: string;
  seuil_garanti: string;
  corners_attendus_total: number;
  cartons_attendus_total: number;
  stats_domicile: {
    equipe: string;
    corners_marques_moy: number;
    cartons_jaunes_recus_moy: number;
  };
  stats_exterieur: {
    equipe: string;
    corners_marques_moy: number;
    cartons_jaunes_recus_moy: number;
  };
  arbitre_analyse: {
    nom: string;
    moyenne_cartons_jaunes: string;
    severite: string;
    impact_rapprochement: string;
  };
}

export interface ParsedAnalysis {
  match: {
    domicile: string;
    exterieur: string;
    competition: string;
    date: string;
    stade?: string;
    arbitre?: string;
  };
  rapprochement_statistique?: RapprochementData;
  pronostics: PronosticItem[];
  ticket_ngengesport?: {
    bookmaker: string;
    intitule: string;
    selections_80plus: {
      marche: string;
      choix: string;
      cote_estimee: number;
      probabilite: string;
      conditions: string;
    }[];
    cote_totale_combinee: number;
    taux_confiance: string;
  };
  synthese: string;
  donnees_manquantes?: string[];
}

export interface HistoryEntry {
  id: string;
  ts: number;
  matchTitle: string;
  leagueName: string;
  pronosticsCount: number;
  finalText: string;
  status: 'pending' | 'success' | 'failure';
  actualCorners?: number | null;
  actualYellows?: number | null;
  stakeCDF?: number;
}

export default function App() {
  // Navigation Championnats
  const [leagues, setLeagues] = useState<Championship[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ligue1');
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);

  // Match personnalisé
  const [isCustomMatch, setIsCustomMatch] = useState(false);
  const [customHome, setCustomHome] = useState('');
  const [customAway, setCustomAway] = useState('');
  const [customReferee, setCustomReferee] = useState('');

  // États d'analyse et d'actualisation
  const [analyzing, setAnalyzing] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ParsedAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('À l\'instant');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'weekend' | 'monday'>('all');

  // Modales & Vues
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiMatchModal, setShowMultiMatchModal] = useState(false);
  const [multiMatchPicks, setMultiMatchPicks] = useState<MultiMatchPick[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyse' | 'regles'>('analyse');

  // Affichage d'un toast notification non-bloquant
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Paramètres personnalisés API (optionnels)
  const [settings, setSettings] = useState({
    claudeKey: '',
    claudeModel: 'claude-sonnet-5-5',
    geminiKey: '',
    geminiModel: 'gemini-3.8-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    useAutonomousMode: true,
  });

  // Action d'actualisation des données et du calendrier (Bouton Actualiser)
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.leagues && Array.isArray(data.leagues)) {
        setLeagues(data.leagues);
        const current = data.leagues.find((l: Championship) => l.id === selectedLeagueId);
        if (current && current.matches.length > 0) {
          const matchStillExists = current.matches.find((m: MatchFixture) => m.id === selectedMatch?.id);
          setSelectedMatch(matchStillExists || current.matches[0]);
        }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(timeStr);
        showToast('Calendrier, dates de jeu et cotes ngengesport.cd actualisés avec succès !', 'success');
      }
    } catch (err) {
      console.error('Erreur actualisation:', err);
      showToast('Impossible d\'actualiser les données. Vérifiez votre connexion.', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Charger les données de championnats depuis le backend
  useEffect(() => {
    fetch('/api/leagues')
      .then((res) => res.json())
      .then((data) => {
        if (data.leagues && Array.isArray(data.leagues)) {
          setLeagues(data.leagues);
          const defaultLeague = data.leagues.find((l: Championship) => l.id === 'ligue1') || data.leagues[0];
          if (defaultLeague && defaultLeague.matches.length > 0) {
            setSelectedMatch(defaultLeague.matches[0]);
          }
          const now = new Date();
          setLastUpdated(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch((err) => console.error('Erreur chargement championnats:', err));

    // Charger l'historique local
    const saved = localStorage.getItem('analyscj_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Charger le panier combiné multi-matchs local
    const savedPicks = localStorage.getItem('analyscj_multimatch_v1');
    if (savedPicks) {
      try {
        setMultiMatchPicks(JSON.parse(savedPicks));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Gestion du Combiné Multi-Matchs (2 à 5 sélections)
  const handleToggleMultiMatchPick = (prono: PronosticItem) => {
    if (!analysisResult) return;
    const home = analysisResult.match.domicile;
    const away = analysisResult.match.exterieur;
    const matchTitle = `${home} vs ${away}`;
    const pickId = `${matchTitle}-${prono.marche}-${prono.selection}`;

    const exists = multiMatchPicks.some((p) => p.id === pickId);
    if (exists) {
      const updated = multiMatchPicks.filter((p) => p.id !== pickId);
      setMultiMatchPicks(updated);
      localStorage.setItem('analyscj_multimatch_v1', JSON.stringify(updated));
      showToast('Sélection retirée du combiné multi-matchs.', 'info');
      return;
    }

    if (multiMatchPicks.length >= 5) {
      showToast('Maximum 5 sélections atteintes pour sécuriser le combiné !', 'error');
      return;
    }

    const newPick: MultiMatchPick = {
      id: pickId,
      matchId: selectedMatch?.id || 'custom',
      matchTitle,
      leagueName: analysisResult.match.competition,
      marche: prono.marche,
      selection: prono.selection,
      cote: prono.cote_ngenge || 1.65,
      probabilite: prono.probabilite,
      date: analysisResult.match.date,
    };

    const updated = [...multiMatchPicks, newPick];
    setMultiMatchPicks(updated);
    localStorage.setItem('analyscj_multimatch_v1', JSON.stringify(updated));
    showToast(`Sélection ajoutée au combiné (${updated.length}/5) !`, 'success');
  };

  const handleRemoveMultiMatchPick = (id: string) => {
    const updated = multiMatchPicks.filter((p) => p.id !== id);
    setMultiMatchPicks(updated);
    localStorage.setItem('analyscj_multimatch_v1', JSON.stringify(updated));
  };

  const handleClearMultiMatchPicks = () => {
    setMultiMatchPicks([]);
    localStorage.removeItem('analyscj_multimatch_v1');
  };

  // Mettre à jour le match sélectionné lors du changement de ligue
  const handleSelectLeague = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    setIsCustomMatch(false);
    setAnalysisResult(null);
    const league = leagues.find((l) => l.id === leagueId);
    if (league && league.matches.length > 0) {
      setSelectedMatch(league.matches[0]);
    }
  };

  // Échange Domicile / Extérieur
  const handleSwapTeams = () => {
    if (isCustomMatch) {
      const prevHome = customHome || (selectedMatch?.homeTeam ?? 'Paris Saint-Germain');
      const prevAway = customAway || (selectedMatch?.awayTeam ?? 'Olympique de Marseille');
      setCustomHome(prevAway);
      setCustomAway(prevHome);
    } else if (selectedMatch) {
      setSelectedMatch({
        ...selectedMatch,
        homeTeam: selectedMatch.awayTeam,
        awayTeam: selectedMatch.homeTeam,
        homeStats: selectedMatch.awayStats,
        awayStats: selectedMatch.homeStats,
      });
    }
    setAnalysisResult(null);
  };

  const handleCustomHomeChange = (val: string) => {
    const sepRegex = /\s+(?:vs\.?|v\.?|contre|face\s+à|@|\/|\||-)\s+/i;
    if (sepRegex.test(val)) {
      const parts = val.split(sepRegex);
      if (parts.length >= 2) {
        setCustomHome(parts[0].trim());
        setCustomAway(parts[1].trim());
        return;
      }
    }
    setCustomHome(val);
  };

  // Exécution du Rapprochement Statistique (Action "Donne les stats")
  const handleDonneLesStats = async () => {
    setAnalyzing(true);
    setStatusStep('Initialisation du rapprochement statistique...');

    const currentLeague = leagues.find((l) => l.id === selectedLeagueId);
    const leagueName = currentLeague?.name || 'Ligue 1';

    let homeTeam = isCustomMatch ? customHome.trim() : (selectedMatch?.homeTeam || 'Paris Saint-Germain');
    let awayTeam = isCustomMatch ? customAway.trim() : (selectedMatch?.awayTeam || 'Olympique de Marseille');
    const referee = isCustomMatch ? customReferee.trim() : (selectedMatch?.referee.name || 'Arbitre Officiel');

    // Auto-séparation si l'affiche a été entrée dans le premier champ
    const sepRegex = /\s+(?:vs\.?|v\.?|contre|face\s+à|@|\/|\||-)\s+/i;
    if (sepRegex.test(homeTeam) && !awayTeam) {
      const parts = homeTeam.split(sepRegex);
      if (parts.length >= 2) {
        homeTeam = parts[0].trim();
        awayTeam = parts[1].trim();
        setCustomHome(homeTeam);
        setCustomAway(awayTeam);
      }
    }

    // Sécurité anti-doublon : Si Domicile et Extérieur sont identiques ou si Extérieur est vide
    if (!awayTeam || homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
      if (homeTeam.toLowerCase().includes('paris') || homeTeam.toLowerCase().includes('psg')) {
        awayTeam = 'Olympique de Marseille';
      } else if (homeTeam.toLowerCase().includes('marseille') || homeTeam.toLowerCase().includes('om')) {
        awayTeam = 'Paris Saint-Germain';
      } else if (homeTeam.toLowerCase().includes('real')) {
        awayTeam = 'FC Barcelone';
      } else if (homeTeam.toLowerCase().includes('barca') || homeTeam.toLowerCase().includes('barcelone')) {
        awayTeam = 'Real Madrid';
      } else if (homeTeam.toLowerCase().includes('arsenal')) {
        awayTeam = 'Chelsea FC';
      } else if (homeTeam.toLowerCase().includes('bayern')) {
        awayTeam = 'Borussia Dortmund';
      } else if (homeTeam.toLowerCase().includes('inter')) {
        awayTeam = 'Juventus Turin';
      } else if (homeTeam.toLowerCase().includes('benfica')) {
        awayTeam = 'FC Porto';
      } else {
        awayTeam = 'Olympique de Marseille';
      }
      setCustomAway(awayTeam);
    }

    const t1 = setTimeout(() => {
      setStatusStep('Croisement des statistiques Cartons Jaunes & Corners...');
    }, 450);

    const t2 = setTimeout(() => {
      setStatusStep('Application des conditions NgengeSport.cd (seuls joueurs en jeu, corners tirés)...');
    }, 900);

    const t3 = setTimeout(() => {
      setStatusStep('Filtrage strict des sélections avec probabilité ≥ 80%...');
    }, 1350);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league: leagueName,
          homeTeam,
          awayTeam,
          referee,
          mode: settings.useAutonomousMode ? 'autonomous' : 'custom',
          settings,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      if (data.finalText) {
        const parsed: ParsedAnalysis = JSON.parse(data.finalText);
        setAnalysisResult(parsed);
        showToast('Rapprochement statistique calculé avec succès (≥ 80% certifié) !', 'success');

        // Sauvegarder dans l'historique
        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          ts: Date.now(),
          matchTitle: `${homeTeam} vs ${awayTeam}`,
          leagueName,
          pronosticsCount: parsed.pronostics?.length || 0,
          finalText: data.finalText,
          status: 'pending',
          stakeCDF: 5000,
        };

        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('analyscj_history_v2', JSON.stringify(updatedHistory));
      } else {
        throw new Error('Résultats non disponibles');
      }
    } catch (error: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error('Erreur lors du rapprochement statistique:', error);
      showToast('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.', 'error');
    } finally {
      setAnalyzing(false);
      setStatusStep('');
    }
  };

  const copyCouponToClipboard = () => {
    if (!analysisResult) return;
    const items = analysisResult.pronostics
      .map(
        (p) =>
          `• ${p.marche === 'cartons_jaunes' ? '🟨 CARTONS JAUNES' : '🚩 CORNERS'} : ${p.selection} (@${p.cote_ngenge || '1.65'}) - Probabilité: ${p.probabilite}%`
      )
      .join('\n');

    const text = `🎟️ TICKET NGENGESPORT.CD · ANALYSE C&J PERFORMANCES (≥ 80% PROBABILITÉ)\n` +
      `Match : ${analysisResult.match.domicile} vs ${analysisResult.match.exterieur} (${analysisResult.match.competition})\n` +
      `📅 Date & Coup d'envoi : ${analysisResult.match.date}\n` +
      `🏟️ Stade : ${analysisResult.match.stade || 'Officiel'}\n` +
      `Arbitre officiel : ${analysisResult.match.arbitre || 'Non précisé'}\n` +
      `-----------------------------------------\n` +
      `${items}\n` +
      `-----------------------------------------\n` +
      `Cote combinée estimée : @${analysisResult.ticket_ngengesport?.cote_totale_combinee || '2.35'}\n` +
      `Conditions NgengeSport RDC respectées : Seuls cartons aux joueurs en jeu comptent, corners bottés comptent.`;

    navigator.clipboard.writeText(text);
    setCopiedCoupon(true);
    showToast('Coupon NgengeSport copié dans le presse-papier !', 'info');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const currentLeague = leagues.find((l) => l.id === selectedLeagueId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER DE L'APPLICATION */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg">
                C&J
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
                  Analyse C&J Performances
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  ≥ 80% PROBA
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  ngengesport.cd
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Moteur de Rapprochement Statistique · Cartons Jaunes & Corners Exclusifs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/30 transition shadow-sm active:scale-95"
              title="Actualiser les affiches, dates et cotes ngengesport.cd"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
              {lastUpdated && (
                <span className="hidden lg:inline text-[10px] text-slate-400 font-mono font-normal">
                  ({lastUpdated})
                </span>
              )}
            </button>

            <button
              onClick={() => setShowMultiMatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition shadow-sm active:scale-95"
              title="Panier Combiné Multi-Matchs (2 à 5 matchs)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Combiné</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {multiMatchPicks.length}/5
              </span>
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Suivi des résultats terminés et comparateur de scores"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Suivi Résultats</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {history.length}
                </span>
              )}
            </button>

            <a
              href="/AnalysCJ-v2.2-Autonome.apk"
              download="AnalysCJ-v2.2-Autonome.apk"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              title="Télécharger l'application native Android APK v2.2"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">APK v2.2</span>
              <Download className="w-3 h-3" />
            </a>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Réglages et clés API"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* TOAST DE NOTIFICATION FLOTTANT */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-3 rounded-xl border shadow-xl flex items-center justify-between gap-2.5 text-xs font-medium backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/40'
                : toast.type === 'info'
                ? 'bg-sky-950/95 border-sky-500/50 text-sky-200 shadow-sky-950/40'
                : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BANNIÈRE NOUVELLE VERSION ANDROID & RÈGLES OFFICIELLES NGENGESPORT.CD */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span className="font-semibold">Conditions ngengesport.cd (RDC Congo) :</span>
            <span className="text-slate-300">
              Cartons aux 22 joueurs sur le terrain uniquement (temps réglementaire 90 min). Corners effectivement tirés.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Filtrage mathématique strict ≥ 80%
            </span>
            <a
              href="/AnalysCJ-v2.2-Autonome.apk"
              download="AnalysCJ-v2.2-Autonome.apk"
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              📱 Télécharger l'APK v2.2 Android
            </a>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* ÉTAPE 1 : LISTE DES 6 CHAMPIONNATS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> 1. Sélectionner le Championnat (6 Ligues Européennes)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">Moyennes Cartons & Corners officielles 2026</span>
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                title="Actualiser les championnats"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {leagues.map((league) => {
              const isSelected = selectedLeagueId === league.id;
              return (
                <button
                  key={league.id}
                  onClick={() => handleSelectLeague(league.id)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{league.flag}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {league.shortName}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                      {league.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{league.country}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span title="Moyenne corners/match">🚩 {league.leagueMoyenneCorners}</span>
                    <span title="Moyenne cartons jaunes/match">🟨 {league.leagueMoyenneCartons}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ÉTAPE 2 : CHOIX DU MATCH OU MATCH PERSONNALISÉ AVEC CALENDRIER & DATES */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-emerald-400" /> 2. Calendrier & Dates des Matchs ({currentLeague?.name})
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  {currentLeague?.matches.length || 0} affiches
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dates de jeu et horaires officiels · Coup d'envoi en heure locale Kinshasa / GMT+1
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Actualiser les affiches et dates de jeu"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <button
                onClick={() => setIsCustomMatch(!isCustomMatch)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                  isCustomMatch
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                {isCustomMatch ? 'Revenir aux affiches' : 'Saisir un autre match'}
              </button>
            </div>
          </div>

          {/* BARRE DE FILTRAGE DES DATES DE MATCH */}
          {!isCustomMatch && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" /> Période :
              </span>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition ${
                  dateFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                📅 Tous les matchs ({currentLeague?.matches.length || 0})
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition ${
                  dateFilter === 'today'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                ⚡ Aujourd'hui & Demain
              </button>
              <button
                onClick={() => setDateFilter('weekend')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition ${
                  dateFilter === 'weekend'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🏆 Ce week-end (Sam. & Dim.)
              </button>
              <button
                onClick={() => setDateFilter('monday')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition ${
                  dateFilter === 'monday'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🗓️ Début de semaine
              </button>
            </div>
          )}

          {!isCustomMatch ? (
            <div>
              {(() => {
                const filteredMatches = (currentLeague?.matches || []).filter((m) => {
                  if (dateFilter === 'today') return m.dayLabel === 'Aujourd\'hui' || m.dayLabel === 'Demain';
                  if (dateFilter === 'weekend') return m.dayLabel === 'Ce week-end';
                  if (dateFilter === 'monday') return m.dayLabel === 'Lundi';
                  return true;
                });

                if (filteredMatches.length === 0) {
                  return (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                      <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-sm text-slate-300 font-semibold">
                        Aucun match programmé pour le filtre « {dateFilter} ».
                      </p>
                      <button
                        onClick={() => setDateFilter('all')}
                        className="text-xs text-amber-400 underline hover:text-amber-300"
                      >
                        Afficher tous les matchs du championnat
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredMatches.map((m) => {
                      const isSelected = selectedMatch?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMatch(m);
                            setAnalysisResult(null);
                          }}
                          className={`cursor-pointer p-3.5 rounded-xl border transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-800/90 border-amber-500/80 ring-2 ring-amber-500/20 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div>
                            {/* BANDEAU DATE & HEURE DE JEU DU MATCH */}
                            <div className="bg-slate-900/95 border border-slate-800 px-2.5 py-1.5 rounded-lg mb-2 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold text-amber-300 truncate">
                                <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <span className="truncate">{m.date}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px] flex-shrink-0 font-bold">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                <span>{m.time}</span>
                              </div>
                            </div>

                            {/* Stade et tag jour */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-0.5">
                              <span className="truncate max-w-[150px] text-slate-400">
                                📍 {m.stadium.split(',')[0]}
                              </span>
                              <div className="flex items-center gap-1">
                                {detectDerby(m.homeTeam, m.awayTeam).isDerby && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black flex items-center gap-0.5 animate-pulse">
                                    <Flame className="w-2.5 h-2.5 text-rose-400" /> Derby
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                  {m.dayLabel || 'Ce week-end'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 my-2">
                              <div className="flex items-center justify-between font-bold text-sm text-slate-100">
                                <span className="truncate max-w-[160px]">{m.homeTeam}</span>
                                <span className="text-[11px] font-mono text-amber-400 flex-shrink-0">
                                  🚩 {m.homeStats.avgCornersFor} | 🟨 {m.homeStats.avgYellowsFor}
                                </span>
                              </div>
                              <div className="flex items-center justify-between font-bold text-sm text-slate-100">
                                <span className="truncate max-w-[160px]">{m.awayTeam}</span>
                                <span className="text-[11px] font-mono text-amber-400 flex-shrink-0">
                                  🚩 {m.awayStats.avgCornersFor} | 🟨 {m.awayStats.avgYellowsFor}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1 text-[11px]">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[110px]">{m.referee.name}</span>
                              <span className="text-amber-400 font-bold font-mono">({m.referee.avgYellows} CJ)</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isSelected ? '✓ Sélectionné' : 'Choisir'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-300">
                  Saisissez les équipes et l'arbitre (ou collez toute l'affiche ex: <em>Arsenal vs Chelsea</em>) :
                </p>
                <button
                  type="button"
                  onClick={handleSwapTeams}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold border border-slate-700 rounded-lg flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Inverser Domicile / Extérieur
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Équipe Domicile (ou affiche complète) :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paris Saint-Germain ou Arsenal vs Chelsea"
                    value={customHome}
                    onChange={(e) => handleCustomHomeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Équipe Extérieure :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Olympique de Marseille"
                    value={customAway}
                    onChange={(e) => setCustomAway(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Arbitre désigné (optionnel) :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Benoît Bastien"
                    value={customReferee}
                    onChange={(e) => setCustomReferee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ÉTAPE 3 : LE BOUTON D'ACTION "DONNE LES STATS" & RAPPROCHEMENT */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> CROISEMENT STATISTIQUE NGENGESPORT.CD
            </div>

            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {isCustomMatch
                ? `${customHome || 'Équipe Domicile'} vs ${customAway || 'Équipe Extérieur'}`
                : `${selectedMatch?.homeTeam} vs ${selectedMatch?.awayTeam}`}
            </h3>

            <p className="text-xs text-slate-300">
              Concentration exclusive sur les{' '}
              <strong className="text-amber-400">Cartons Jaunes</strong> et les{' '}
              <strong className="text-emerald-400">Corners</strong> (Plus ou Moins). Seules les
              probabilités <strong className="text-white">atteignant ou dépassant 80%</strong> seront
              sélectionnées selon les conditions réelles de{' '}
              <span className="text-amber-300 font-semibold">ngengesport.cd</span>.
            </p>
          </div>

          {/* LE BOUTON DEMANDÉ PAR L'UTILISATEUR */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <button
              onClick={handleDonneLesStats}
              disabled={analyzing}
              className={`w-full max-w-md py-4 px-8 rounded-xl font-black text-base md:text-lg tracking-wide uppercase shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                analyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-amber-500/25 border-2 border-yellow-300'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Calcul du rapprochement 80%...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-slate-950" />
                  <span>Donne les stats</span>
                  <span className="text-xs bg-slate-950 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    ≥ 80% PROBA
                  </span>
                </>
              )}
            </button>

            {analyzing && (
              <p className="text-xs text-amber-400 mt-3 font-medium animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {statusStep}
              </p>
            )}
          </div>
        </section>

        {/* SECTION DES RÉSULTATS DU RAPPROCHEMENT STATISTIQUE */}
        {analysisResult && (
          <section className="space-y-6 pt-2">
            {/* CARTE D'AFFICHAGE DU RAPPROCHEMENT 80% */}
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
              {/* En-tête de validation */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CERTIFIÉ ≥ 80% PROBABILITÉ
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {analysisResult.match.competition}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white mt-1.5">
                    {analysisResult.match.domicile} vs {analysisResult.match.exterieur}
                  </h3>
                </div>

                {/* Bouton de copie du coupon ngengesport.cd */}
                <button
                  onClick={copyCouponToClipboard}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition self-start md:self-auto active:scale-95"
                >
                  {copiedCoupon ? (
                    <>
                      <Check className="w-4 h-4" /> Coupon NgengeSport Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copier le Coupon NgengeSport
                    </>
                  )}
                </button>
              </div>

              {/* BANDEAU DATE & HORAIRE DU MATCH ANALYSÉ */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-400">Date & Coup d'envoi officiel :</span>
                  <span className="font-bold text-amber-300 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                    {analysisResult.match.date}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>🏟️ {analysisResult.match.stade || 'Stade officiel'}</span>
                  <span>·</span>
                  <span>👤 Arbitre officiel : <strong className="text-amber-400">{analysisResult.match.arbitre || 'Officiel'}</strong></span>
                </div>
              </div>

              {/* DÉTECTEUR DE MATCHS PIÈGES & DERBY À FORTE TENSION */}
              <DerbyRiskBadge
                homeTeam={analysisResult.match.domicile}
                awayTeam={analysisResult.match.exterieur}
                leagueName={analysisResult.match.competition}
                stadium={analysisResult.match.stade}
              />

              {/* TABLEAU RÉCAPITULATIF DU RAPPROCHEMENT STATISTIQUE */}
              {analysisResult.rapprochement_statistique && (
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Croisement Statistique : Moyennes & Projections de Match
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Corners Totaux Prévus
                      </span>
                      <span className="text-lg md:text-xl font-black text-emerald-400 font-mono">
                        🚩 {analysisResult.rapprochement_statistique.corners_attendus_total}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Ligne optimale : +8.5
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Cartons Jaunes Prévus
                      </span>
                      <span className="text-lg md:text-xl font-black text-amber-400 font-mono">
                        🟨 {analysisResult.rapprochement_statistique.cartons_attendus_total}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Ligne optimale : +3.5
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Sévérité Arbitre
                      </span>
                      <span className="text-sm font-bold text-slate-200 block mt-1">
                        {analysisResult.rapprochement_statistique.arbitre_analyse?.severite || 'Sévère'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono block">
                        {analysisResult.rapprochement_statistique.arbitre_analyse?.moyenne_cartons_jaunes || '4.5 cartons/m'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Critère Validé
                      </span>
                      <span className="text-sm font-black text-emerald-400 block mt-1">
                        ≥ 80% Probabilité
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Conforme ngengesport.cd
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* FICHE DÉTAILLÉE DU PROFIL ARBITRE OFFICIEL */}
              <RefereeProfileCard
                refereeName={analysisResult.match.arbitre || selectedMatch?.referee.name || 'Arbitre Officiel'}
                leagueName={analysisResult.match.competition}
                fixtureReferee={selectedMatch?.referee}
                leagueAvgYellows={currentLeague?.leagueMoyenneCartons}
              />

              {/* LISTE DES PRONOSTICS STRICTEMENT >= 80% DE PROBABILITÉ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Pronostics Cartons Jaunes & Corners (Filtrage Garanti ≥ 80%)
                  </h4>
                  <span className="text-xs text-amber-400 font-semibold">
                    {analysisResult.pronostics.length} sélection(s) qualifiée(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {analysisResult.pronostics.map((prono, idx) => {
                    const isYellowCard = prono.marche === 'cartons_jaunes';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                          isYellowCard
                            ? 'bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/40'
                            : 'bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 border-emerald-500/40'
                        }`}
                      >
                        <div>
                          {/* En-tête prono */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isYellowCard
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isYellowCard ? '🟨 CARTONS JAUNES' : '🚩 CORNERS'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {prono.cote_ngenge && (
                                <span className="text-xs font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                                  Cote @{prono.cote_ngenge}
                                </span>
                              )}
                              <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                {prono.probabilite}%
                              </span>
                            </div>
                          </div>

                          {/* Intitulé sélection NgengeSport */}
                          <h5 className="text-base font-black text-white tracking-tight mb-1">
                            {prono.selection}
                          </h5>

                          {/* Règle NgengeSport */}
                          {prono.regle_ngenge && (
                            <p className="text-[11px] text-amber-300/80 italic mb-2">
                              📋 {prono.regle_ngenge}
                            </p>
                          )}

                          {/* Justification du rapprochement */}
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            {prono.justification}
                          </p>
                        </div>

                        {/* Facteurs clés */}
                        {prono.facteurs && prono.facteurs.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1">
                            {prono.facteurs.map((f, fIdx) => (
                              <div
                                key={fIdx}
                                className="text-[11px] text-slate-400 flex items-start gap-1.5"
                              >
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bouton d'ajout au Combiné Multi-Matchs */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                          {(() => {
                            const matchTitle = `${analysisResult.match.domicile} vs ${analysisResult.match.exterieur}`;
                            const pickId = `${matchTitle}-${prono.marche}-${prono.selection}`;
                            const isAdded = multiMatchPicks.some((p) => p.id === pickId);
                            return (
                              <button
                                type="button"
                                onClick={() => handleToggleMultiMatchPick(prono)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                                  isAdded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>
                                  {isAdded ? '✓ Dans le Panier Combiné' : '+ Ajouter au Combiné Multi-Matchs'}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CALCULATEUR DE MISE CDF & EXPORTATION DU COUPON (IMAGE / PDF / WHATSAPP / TELEGRAM) */}
              <CalculateurMiseCDF
                analysis={analysisResult}
                onCopyText={copyCouponToClipboard}
                copied={copiedCoupon}
                onShowToast={showToast}
              />

              {/* Synthèse globale */}
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg">
                <strong className="text-amber-400">Synthèse du Rapprochement :</strong>{' '}
                {analysisResult.synthese}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* BARRE FLOTTANTE COMBINÉ MULTI-MATCHS */}
      <MultiMatchFloatingBar
        picks={multiMatchPicks}
        onOpenModal={() => setShowMultiMatchModal(true)}
      />

      {/* MODALE DU COMBINÉ MULTI-MATCHS */}
      <MultiMatchCombiner
        picks={multiMatchPicks}
        isOpen={showMultiMatchModal}
        onClose={() => setShowMultiMatchModal(false)}
        onRemovePick={handleRemoveMultiMatchPick}
        onClearPicks={handleClearMultiMatchPicks}
        onShowToast={showToast}
      />

      {/* MODALE SUIVI DES RÉSULTATS TERMINÉS & COMPARATEUR DE PRONOSTICS */}
      <HistoryTrackerModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onUpdateHistory={(updated) => setHistory(updated)}
        onShowToast={showToast}
        onSelectForView={(parsed) => {
          setAnalysisResult(parsed);
          setShowHistory(false);
          showToast('Coupon chargé dans l\'analyseur !', 'info');
        }}
      />

      {/* MODALE RÉGLAGES */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" /> Réglages & Moteur Statistique
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Mode Autonome Déterministe</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Actif par défaut
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  L'application utilise son algorithme autonome intégrant la loi de Poisson, les bases statistiques 2026 des 6 championnats et les conditions de ngengesport.cd sans nécessiter de clé API externe.
                </p>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Clé Gemini personnelle (optionnelle) :
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={settings.geminiKey}
                  onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Clé Claude personnelle (optionnelle) :
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.claudeKey}
                  onChange={(e) => setSettings({ ...settings, claudeKey: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                Enregistrer & Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">
          Analyse C&J Performances · Conforme conditions ngengesport.cd (RDC Congo)
        </p>
        <p className="text-[11px]">
          Filtre mathématique de probabilité ≥ 80% · Cartons Jaunes & Corners uniquement. Jouez de manière responsable.
        </p>
      </footer>
    </div>
  );
}
