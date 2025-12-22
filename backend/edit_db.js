import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = './moja_baza.db';

async function editDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    await db.run('ALTER TABLE apteki ADD COLUMN wlasciciel_id INTEGER');
    console.log('Dodano kolumnę wlasciciel_id do tabeli apteki.');
  } catch (err) {
    console.error('Błąd podczas modyfikacji bazy danych:', err.message);
  }

  await db.close();
}  

editDatabase().catch(err => {
  console.error('Nie udało się edytować bazy danych:', err);
});