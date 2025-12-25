import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

let db;

export async function initDb() {
  if (db) return db;
  
  db = await open({
    filename: path.resolve(process.cwd(), 'moja_baza.db'), 
    driver: sqlite3.Database
  });
  console.log("Połączono z bazą SQLite.");
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}
