import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import https from 'https';
import { URL } from 'url';
import querystring from 'querystring';

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'AptekON/1.0 (kontakt@aptekon.local)', Referer: 'http://localhost' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const db = await open({ filename: 'moja_baza.db', driver: sqlite3.Database });

  // Add columns if missing
  const cols = await db.all("PRAGMA table_info('apteki')");
  const hasLat = cols.some(c => c.name === 'lat');
  const hasLon = cols.some(c => c.name === 'lon');

  if (!hasLat) {
    console.log('Dodaję kolumnę lat do apteki...');
    await db.exec('ALTER TABLE apteki ADD COLUMN lat REAL');
  }
  if (!hasLon) {
    console.log('Dodaję kolumnę lon do apteki...');
    await db.exec('ALTER TABLE apteki ADD COLUMN lon REAL');
  }

  // Select apteki without coords
  const apteki = await db.all('SELECT id, nazwa, miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy FROM apteki');
  console.log(`Znaleziono ${apteki.length} aptek`);

  for (const a of apteki) {
    // Skip if already has coords
    const existing = await db.get('SELECT lat, lon FROM apteki WHERE id = ?', [a.id]);
    if (existing && existing.lat !== null && existing.lon !== null) {
      console.log(`Apteka ${a.id}: ma już koordynaty (${existing.lat}, ${existing.lon}), pomijam.`);
      continue;
    }

    // Build address
    const parts = [];
    if (a.nazwa_ulicy) parts.push(a.nazwa_ulicy.replace(/\s+/g,' ').trim());
    if (a.nr_budynku) parts.push(String(a.nr_budynku).trim());
    if (a.kod_pocztowy) parts.push(String(a.kod_pocztowy).trim());
    if (a.miejscowosc) parts.push(a.miejscowosc.trim());
    // Add country to help geocoding
    parts.push('Polska');

    const address = parts.filter(Boolean).join(', ');
    if (!address) {
      console.log(`Apteka ${a.id}: brak danych adresowych, pomijam.`);
      continue;
    }

    const params = querystring.stringify({ q: address, format: 'json', limit: 1, addressdetails: 0 });
    const url = `https://nominatim.openstreetmap.org/search?${params}`;

    try {
      console.log(`Geokodowanie apteki ${a.id}: ${address}`);
      const res = await httpGetJson(url);
      if (res && res.length > 0) {
        const { lat, lon } = res[0];
        await db.run('UPDATE apteki SET lat = ?, lon = ? WHERE id = ?', [parseFloat(lat), parseFloat(lon), a.id]);
        console.log(`-> zapisano: ${lat}, ${lon}`);
      } else {
        console.log('-> brak wyniku dla zapytania');
      }
    } catch (err) {
      console.error('Błąd geokodowania:', err.message || err);
    }

    // polite rate limit
    await sleep(1100);
  }

  await db.close();
  console.log('Zakończono przypisywanie współrzędnych.');
}

main().catch(err => { console.error(err); process.exit(1); });
