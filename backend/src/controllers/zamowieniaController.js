import { getDb } from '../config/db.js'

export const createZamowienie = async (req, res) => {
	try {
		const db = getDb()
		const { apteka_id, uzytkownik_id, lek_id, status } = req.body

		if (!apteka_id || !uzytkownik_id || !lek_id) {
			return res.status(400).json({
				error: 'Brakuje danych (apteka_id, uzytkownik_id, lek_id)',
			})
		}

		const orderStatus = status || 'nowe'
		const dataZamowienia = new Date().toISOString()

		const result = await db.run(
			'INSERT INTO zamowienia (apteka_id, uzytkownik_id, lek_id, status, data_zamowienia) VALUES (?, ?, ?, ?, ?)',
			[apteka_id, uzytkownik_id, lek_id, orderStatus, dataZamowienia]
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
		const { uzytkownik_id, apteka_id } = req.query

		let query = `
			SELECT z.id, z.apteka_id, z.uzytkownik_id, z.lek_id, z.status, z.data_zamowienia,
			       l.nazwa as lek_nazwa, l.moc as lek_moc,
			       a.nazwa as apteka_nazwa, a.nazwa_ulicy, a.nr_budynku, a.miejscowosc,
			       u.email as uzytkownik_email
			FROM zamowienia z
			LEFT JOIN leki l ON z.lek_id = l.id
			LEFT JOIN apteki a ON z.apteka_id = a.id
			LEFT JOIN uzytkownicy u ON z.uzytkownik_id = u.id
		`
		const params = []
		const conditions = []

		if (uzytkownik_id) {
			conditions.push('z.uzytkownik_id = ?')
			params.push(uzytkownik_id)
		}

		if (apteka_id) {
			conditions.push('z.apteka_id = ?')
			params.push(apteka_id)
		}

		if (conditions.length > 0) {
			query += ' WHERE ' + conditions.join(' AND ')
		}

		query += ' ORDER BY z.id DESC'

		const zamowienia = await db.all(query, params)
		res.json(zamowienia)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd pobierania zamówień' })
	}
}

export const updateZamowienieStatus = async (req, res) => {
	try {
		const db = getDb()
		const { id } = req.params
		const { status } = req.body

		if (!id || !status) {
			return res.status(400).json({ error: 'Brakuje id lub status' })
		}

		const result = await db.run(
			'UPDATE zamowienia SET status = ? WHERE id = ?',
			[status, id]
		)

		if (result.changes === 0) {
			return res.status(404).json({ error: 'Zamówienie nie znalezione' })
		}

		res.json({ message: 'Status zamówienia zaktualizowany!' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd aktualizacji zamówienia' })
	}
}
