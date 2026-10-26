// Récupération des matchs affichés sur ngengesport.cd.
// Aucune API officielle n'est documentée : on lit la page publique et on en extrait
// « jour heure  Équipe A - Équipe B  cote1 cote2 cote3 ». Parseur sans dépendance, testé.

export interface RawFixture {
  day: string;        // 'Sam', 'Aujourd'hui', 'Demain'...
  time: string;       // 'HH:MM' (heure locale du site)
  home: string;
  away: string;
  odds: [number, number, number];
}

const DAY = "Aujourd['’]hui|Demain|Lun|Mar|Mer|Jeu|Ven|Sam|Dim";

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(div|li|tr|p|a|span|td|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
}

export function parseFixturesFromText(input: string): RawFixture[] {
  const flat = input.replace(/\s+/g, ' ');
  const re = new RegExp(
    `\\b(${DAY})\\.?\\s+(\\d{1,2}[:h]\\d{2})\\s+([^|]{2,60}?)\\s+[-–]\\s+([^|]{2,60}?)\\s+(\\d{1,3}[.,]\\d{1,3})\\s+(\\d{1,3}[.,]\\d{1,3})\\s+(\\d{1,3}[.,]\\d{1,3})`,
    'gi'
  );
  const seen = new Set<string>();
  const out: RawFixture[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat))) {
    const num = (s: string) => parseFloat(s.replace(',', '.'));
    const home = m[3].trim(), away = m[4].trim();
    if (!home || !away || home.toLowerCase() === away.toLowerCase()) continue;
    const time = m[2].replace('h', ':').padStart(5, '0');
    const key = `${m[1].toLowerCase()}|${time}|${home.toLowerCase()}|${away.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ day: m[1], time, home, away, odds: [num(m[5]), num(m[6]), num(m[7])] });
  }
  return out;
}

const WD = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WD_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Date (heure de Kinshasa, UTC+1) du prochain jour correspondant au libellé du site. */
export function resolveDay(day: string, now = new Date()): { date: string; dayLabel: 'Aujourd\'hui' | 'Demain' | 'Ce week-end' | 'Lundi' } {
  const k = new Date(now.getTime() + 60 * 60 * 1000); // UTC+1
  let offset = 0;
  const d = day.toLowerCase();
  if (d.startsWith('demain')) offset = 1;
  else if (!d.startsWith('aujourd')) {
    const target = WD.indexOf(d.slice(0, 3));
    offset = target < 0 ? 0 : (target - k.getUTCDay() + 7) % 7;
  }
  const t = new Date(k.getTime() + offset * 86400000);
  const wd = t.getUTCDay();
  return {
    date: `${WD_FULL[wd]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`,
    dayLabel: offset === 0 ? "Aujourd'hui" : offset === 1 ? 'Demain' : wd === 1 ? 'Lundi' : 'Ce week-end',
  };
}

let cache: { at: number; fixtures: RawFixture[] } | null = null;

/** Télécharge la page publique (cache 10 min). Lève une erreur claire si inaccessible ou illisible. */
export async function fetchNgengeFixtures(url = process.env.NGENGE_URL || 'https://ngengesport.cd', force = false): Promise<RawFixture[]> {
  if (!force && cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.fixtures;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'AnalysCJ-Performances/3 (lecture de la page publique)', 'Accept-Language': 'fr' } });
    if (!res.ok) throw new Error(`ngengesport.cd a répondu HTTP ${res.status}`);
    const fixtures = parseFixturesFromText(htmlToText(await res.text()));
    if (fixtures.length === 0) throw new Error('aucun match lisible dans la page (site rendu en JavaScript ou structure modifiée)');
    cache = { at: Date.now(), fixtures };
    return fixtures;
  } finally {
    clearTimeout(timer);
  }
}
