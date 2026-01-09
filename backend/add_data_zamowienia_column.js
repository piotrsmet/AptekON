import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

const dbPath = path.resolve('moja_baza.db')

async function addColumn() {
	const db = await open({
		filename: dbPath,
		driver: sqlite3.Database,
	})

	try {
		// Dodaj kolumnę data_zamowienia
		await db.run(`ALTER TABLE zamowienia ADD COLUMN data_zamowienia TEXT`)
		console.log('Kolumna data_zamowienia dodana!')

		// Ustaw domyślną datę dla istniejących rekordów
		await db.run(
			`UPDATE zamowienia SET data_zamowienia = datetime('now') WHERE data_zamowienia IS NULL`
		)
		console.log('Uzupełniono daty dla istniejących zamówień.')
	} catch (err) {
		if (err.message.includes('duplicate column name')) {
			console.log('Kolumna data_zamowienia już istnieje.')
		} else {
			console.error('Błąd:', err)
		}
	}

	await db.close()
}

addColumn()
