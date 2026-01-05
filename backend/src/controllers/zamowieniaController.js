import { getDb } from '../config/db.js'

export const createZamowienie = async (req, res) => {
	try {
		const db = getDb()
		const { apteka_id, uzytkownik_id, lek_id, status } = req.body

		if (!apteka_id || !uzytkownik_id || !lek_id) {
			return res
				.status(400)
				.json({
					error: 'Brakuje danych (apteka_id, uzytkownik_id, lek_id)',
				})
		}

		const orderStatus = status || 'nowe'

		const result = await db.run(
			'INSERT INTO zamowienia (apteka_id, uzytkownik_id, lek_id, status) VALUES (?, ?, ?, ?)',
			[apteka_id, uzytkownik_id, lek_id, orderStatus]
		)

		res.json({ message: 'Zamówienie dodane!', id: result.lastID })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd dodawania zamówienia' })
	}
}

export const deleteZamowienie = async (req, res) => {
	try {
		const db = getDb()
		const { id } = req.params

		if (!id) {
			return res.status(400).json({ error: 'Brakuje id zamówienia' })
		}

		const result = await db.run('DELETE FROM zamowienia WHERE id = ?', [id])

		if (result.changes === 0) {
			return res.status(404).json({ error: 'Zamówienie nie znalezione' })
		}

		res.json({ message: 'Zamówienie usunięte!' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd usuwania zamówienia' })
	}
}

export const getZamowienia = async (req, res) => {
	try {
		const db = getDb()
		const zamowienia = await db.all('SELECT * FROM zamowienia')
		res.json(zamowienia)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd pobierania zamówień' })
	}
}
