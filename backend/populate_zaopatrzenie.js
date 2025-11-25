import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function main() {
  const dbPath = path.resolve('moja_baza.db');

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Pobieranie aptek...');
  const apteki = await db.all('SELECT id FROM apteki');
  console.log(`Znaleziono ${apteki.length} aptek`);

  console.log('Pobieranie leków...');
  const leki = await db.all('SELECT id FROM leki');
  console.log(`Znaleziono ${leki.length} leków`);

  if (apteki.length === 0 || leki.length === 0) {
    console.error('Brak aptek lub leków w bazie');
    await db.close();
    process.exit(1);
  }

  let totalInserted = 0;

  // Dla każdej apteki
  for (const apteka of apteki) {
    const aptekaId = apteka.id;

    // Losuj k leków (10-20)
    const k = Math.floor(Math.random() * 11) + 10;

    // Sampling without replacement
    const chosen = new Set();
    while (chosen.size < k && chosen.size < leki.length) {
      const idx = Math.floor(Math.random() * leki.length);
      chosen.add(leki[idx].id);
    }

    // Dodaj każdy wybrany lek z losową ilością (1-100)
    for (const lekId of chosen) {
      const ilosc = Math.floor(Math.random() * 100) + 1;
      try {
        await db.run(
          'INSERT OR IGNORE INTO zaopatrzenie (apteka_id, lek_id, ilosc) VALUES (?, ?, ?)',
          [aptekaId, lekId, ilosc]
        );
        totalInserted++;
      } catch (err) {
        console.error(`Błąd insert dla apteki ${aptekaId}, leku ${lekId}:`, err.message);
      }
    }

    console.log(`Apteka ${aptekaId}: dodano ${chosen.size} leków`);
  }

  console.log(`\n✓ Zakończono. Wstawiono ${totalInserted} wierszy do zaopatrzenia.`);
  await db.close();
}

main().catch((err) => {
  console.error('Błąd:', err);
  process.exit(1);
});
