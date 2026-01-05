import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve('moja_baza.db');

async function listTables() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables);
  
  await db.close();
}

listTables().catch(console.error);
