import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve('moja_baza.db');

async function dropZamowieniaPozycje() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    await db.run('DROP TABLE IF EXISTS zamowienia_pozycje');
    console.log('Usunięto tabelę zamowienia_pozycje.');
  } catch (err) {
    console.error('Błąd podczas usuwania tabeli:', err.message);
  }

  await db.close();
}

dropZamowieniaPozycje().catch(err => {
  console.error('Nie udało się edytować bazy danych:', err);
});
