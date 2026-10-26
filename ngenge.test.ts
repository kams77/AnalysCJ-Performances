import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFixturesFromText, htmlToText, resolveDay } from './ngenge.ts';

test('extrait jour, heure, équipes et 3 cotes (texte à plat)', () => {
  const f = parseFixturesFromText('Prochains événements Sam 08:00 Newcastle United Jets FC - Perth Redstar FC 1.85 3.40 4,10 Sam 10:30 Arsenal - Chelsea 1.95 3.5 3.9');
  assert.equal(f.length, 2);
  assert.deepEqual(f[0], { day: 'Sam', time: '08:00', home: 'Newcastle United Jets FC', away: 'Perth Redstar FC', odds: [1.85, 3.4, 4.1] });
  assert.equal(f[1].home, 'Arsenal');
});

test('lit aussi du HTML et garde les noms avec trait d\'union', () => {
  const html = '<div>Dim</div><div>21:00</div><div>Paris Saint-Germain - Olympique de Marseille</div><span>1.40</span><span>4.8</span><span>7.2</span><script>x=1</script>';
  const f = parseFixturesFromText(htmlToText(html));
  assert.equal(f.length, 1);
  assert.equal(f[0].home, 'Paris Saint-Germain');
  assert.equal(f[0].away, 'Olympique de Marseille');
});

test('ignore les doublons et les lignes sans 3 cotes', () => {
  const t = 'Lun 20:45 A FC - B FC 2.0 3.0 4.0 Lun 20:45 A FC - B FC 2.0 3.0 4.0 Mar 18:00 C - D 2.0 3.0';
  assert.equal(parseFixturesFromText(t).length, 1);
});

test('aucun match reconnu si le texte ne ressemble pas à un listing', () => {
  assert.equal(parseFixturesFromText('Bienvenue sur le site, parier en ligne').length, 0);
});

test('résolution du jour de la semaine (Kinshasa, UTC+1)', () => {
  const now = new Date('2026-10-26T09:00:00Z'); // lundi 26 octobre 2026
  assert.equal(resolveDay('Sam', now).date, 'Samedi 31 Octobre 2026');
  assert.equal(resolveDay('Lun', now).dayLabel, "Aujourd'hui");
  assert.equal(resolveDay('Demain', now).date, 'Mardi 27 Octobre 2026');
});
