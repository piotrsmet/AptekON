import { getDb } from '../config/db.js'

export const getZaopatrzenie = async (req, res) => {
	try {
		const db = getDb()
		const { apteka_id, lek_id } = req.query

		if (lek_id) {
			const zaopatrzenie = await db.all(
				`SELECT id, apteka_id, ilosc, cena
             FROM zaopatrzenie
             WHERE lek_id = ?`,
				[lek_id]
			)
			return res.json(zaopatrzenie)
		}

		let sql = `
      SELECT z.id, z.apteka_id, z.lek_id, z.ilosc, z.cena,
             l.nazwa, l.nazwa_powszechna, l.substancja, l.moc
      FROM zaopatrzenie z
      LEFT JOIN leki l ON z.lek_id = l.id
    `
		const params = []

		if (apteka_id) {
			sql += ' WHERE z.apteka_id = ?'
			params.push(apteka_id)
		}

		const result = await db.all(sql, params)
		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd pobierania zaopatrzenia' })
	}
}

export const createZaopatrzenie = async (req, res) => {
	try {
		const db = getDb()
		const { apteka_id, lek_id, ilosc, cena } = req.body

		if (
			!apteka_id ||
			!lek_id ||
			ilosc === undefined ||
			cena === undefined
		) {
			return res
				.status(400)
				.json({
					error: 'Brakuje danych (apteka_id, lek_id, ilosc, cena)',
				})
		}

		await db.run(
			'INSERT INTO zaopatrzenie (apteka_id, lek_id, ilosc, cena) VALUES (?, ?, ?, ?)',
			[apteka_id, lek_id, ilosc, cena]
		)

		res.json({ message: 'Zaopatrzenie dodane!' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd zapisu zaopatrzenia' })
	}
}

export const updateZaopatrzenie = async (req, res) => {
	try {
		const db = getDb()
		const { id } = req.params
		const { ilosc, cena } = req.body

		if (!id) {
			return res.status(400).json({ error: 'Brakuje id' })
		}

		if (ilosc === undefined && cena === undefined) {
			return res
				.status(400)
				.json({
					error: 'Brakuje danych do aktualizacji (ilosc lub cena)',
				})
		}

		if (ilosc !== undefined && cena !== undefined) {
			await db.run(
				'UPDATE zaopatrzenie SET ilosc = ?, cena = ? WHERE id = ?',
				[ilosc, cena, id]
			)
		} else if (ilosc !== undefined) {
			await db.run('UPDATE zaopatrzenie SET ilosc = ? WHERE id = ?', [
				ilosc,
				id,
			])
		} else if (cena !== undefined) {
			await db.run('UPDATE zaopatrzenie SET cena = ? WHERE id = ?', [
				cena,
				id,
			])
		}

		res.json({ message: 'Zaopatrzenie zaktualizowane!' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd aktualizacji zaopatrzenia' })
	}
}

export const deleteZaopatrzenie = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Brakuje id' });
        }

        await db.run('DELETE FROM zaopatrzenie WHERE id = ?', [id]);
        res.json({ message: 'Zaopatrzenie usunięte!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd usuwania zaopatrzenia' });
    }
}
