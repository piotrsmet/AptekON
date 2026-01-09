import { getDb } from '../config/db.js'
import { geocodeAddress } from '../utils/address_fetching.js'

function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371 // Radius of the earth in km
	const dLat = deg2rad(lat2 - lat1)
	const dLon = deg2rad(lon2 - lon1)
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) *
			Math.cos(deg2rad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	const d = R * c // Distance in km
	return d
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}

export const getNajblizszaApteka = async (req, res) => {
	try {
		const db = getDb()
		const { lat, lon } = req.query

		if (!lat || !lon) {
			return res
				.status(400)
				.json({ error: 'Brakuje współrzędnych (lat, lon)' })
		}

		const userLat = parseFloat(lat)
		const userLon = parseFloat(lon)

		const apteki = await db.all(
			'SELECT * FROM apteki WHERE lat IS NOT NULL AND lon IS NOT NULL'
		)

		if (apteki.length === 0) {
			return res.status(404).json({ error: 'Brak aptek z lokalizacją' })
		}

		let closestApteka = null
		let minDistance = Infinity

		for (const apteka of apteki) {
			const dist = calculateDistance(
				userLat,
				userLon,
				apteka.lat,
				apteka.lon
			)
			if (dist < minDistance) {
				minDistance = dist
				closestApteka = { ...apteka, distance: dist }
			}
		}

		res.json(closestApteka)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd wyszukiwania najbliższej apteki' })
	}
}

export const getNajblizszaAptekaZLekiem = async (req, res) => {
	try {
		const db = getDb()
		const { lat, lon, lek_id } = req.query

		if (!lat || !lon || !lek_id) {
			return res
				.status(400)
				.json({ error: 'Brakuje danych (lat, lon, lek_id)' })
		}

		const userLat = parseFloat(lat)
		const userLon = parseFloat(lon)

		const query = `
      SELECT a.*, z.cena, z.ilosc
      FROM apteki a
      JOIN zaopatrzenie z ON a.id = z.apteka_id
      WHERE z.lek_id = ? AND z.ilosc > 0 AND a.lat IS NOT NULL AND a.lon IS NOT NULL
    `

		const apteki = await db.all(query, [lek_id])

		if (apteki.length === 0) {
			return res
				.status(404)
				.json({ error: 'Nie znaleziono apteki z tym lekiem' })
		}

		let closestApteka = null
		let minDistance = Infinity

		for (const apteka of apteki) {
			const dist = calculateDistance(
				userLat,
				userLon,
				apteka.lat,
				apteka.lon
			)
			if (dist < minDistance) {
				minDistance = dist
				closestApteka = { ...apteka, distance: dist }
			}
		}

		res.json(closestApteka)
	} catch (err) {
		console.error(err)
		res.status(500).json({
			error: 'Błąd wyszukiwania najbliższej apteki z lekiem',
		})
	}
}

export const getApteki = async (req, res) => {
	try {
		const db = getDb()
		const { search, fields } = req.query

		if (fields === 'id') {
			const apteki = await db.all('SELECT id FROM apteki')
			return res.json(apteki)
		}

		if (search && search.trim().length >= 2) {
			const searchTerm = `%${search}%`
			const apteki = await db.all(
				'SELECT * FROM apteki WHERE nazwa LIKE ? OR wlasciciel_nazwa LIKE ? LIMIT 5',
				[searchTerm, searchTerm]
			)
			return res.json(apteki)
		}

		const apteki = await db.all('SELECT * FROM apteki')
		res.json(apteki)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd pobierania danych' })
	}
}

export const createApteka = async (req, res) => {
	try {
		const db = getDb()
		let {
			nazwa,
			miejscowosc,
			nazwa_ulicy,
			nr_budynku,
			kod_pocztowy,
			telefon,
			email,
			wlasciciel_nazwa,
			wlasciciel_id,
		} = req.body
		if (!nazwa) {
			return res.status(400).json({ error: 'Brakuje danych w body' })
		}
		const { lat, lon } = await geocodeAddress(
			miejscowosc,
			nazwa_ulicy,
			nr_budynku,
			kod_pocztowy
		)

		if (!telefon) telefon = ''
		if (!email) email = ''
		if (!wlasciciel_nazwa) wlasciciel_nazwa = ''
		if (!wlasciciel_id) wlasciciel_id = null

		await db.run(
			`INSERT INTO apteki (nazwa, miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy, telefon, email, wlasciciel_nazwa, wlasciciel_id, lat, lon) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				nazwa,
				miejscowosc,
				nazwa_ulicy,
				nr_budynku,
				kod_pocztowy,
				telefon,
				email,
				wlasciciel_nazwa,
				wlasciciel_id,
				lat,
				lon,
			]
		)

		res.json({ message: 'Apteka dodana!' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd zapisu apteki' })
	}
}

export const getAptekaById = async (req, res) => {
	try {
		const db = getDb()
		const { id } = req.params
		if (!id) {
			return res
				.status(400)
				.json({ error: 'Brakuje id apteki w zapytaniu' })
		}

		const apteka = await db.get('SELECT * FROM apteki WHERE id = ?', [id])
		if (!apteka) {
			return res
				.status(404)
				.json({ error: 'Nie znaleziono apteki o podanym id' })
		}

		res.json(apteka)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd pobierania danych' })
	}
}

export const updateAptekaOwner = async (req, res) => {
	try {
		const db = getDb()
		const { id } = req.params
		const { wlasciciel_id } = req.body
		if (!id || !wlasciciel_id) {
			return res
				.status(400)
				.json({ error: 'Brakuje id apteki lub wlasciciel_id' })
		}

		await db.run('UPDATE apteki SET wlasciciel_id = ? WHERE id = ?', [
			wlasciciel_id,
			id,
		])

		res.json({ message: 'Zaktualizowano właściciela apteki' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Błąd aktualizacji właściciela apteki' })
	}
}

export const getAptekaZaopatrzenie = async (req, res) => {
	try {
		const db = getDb()
		const id = req.params.id
		if (!id) {
			return res
				.status(400)
				.json({ error: 'Brakuje id apteki w zapytaniu' })
		}

		const result = await db.all(
			`SELECT z.id, z.apteka_id, z.lek_id, z.ilosc, 
              l.nazwa, l.nazwa_powszechna, l.substancja, l.moc, l.droga_podania, l.kraj_pochodzenia
       FROM zaopatrzenie z
       LEFT JOIN leki l ON z.lek_id = l.id
       WHERE z.apteka_id = ?`,
			[id]
		)

		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({
			error: 'Błąd pobierania zaopatrzenia dla apteki',
		})
	}
}

export const deleteApteka = async (req, res) => {
    try {
        const db = getDb()
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ error: 'Brakuje id' })
        }

        // Optional: Checks before delete (e.g. ownership verification middleware usually handles this)
        
        await db.run('DELETE FROM apteki WHERE id = ?', [id])
        // Delete related data
        await db.run('DELETE FROM zaopatrzenie WHERE apteka_id = ?', [id])
        await db.run('DELETE FROM rezerwacje WHERE apteka_id = ?', [id])
        await db.run('DELETE FROM zamowienia WHERE apteka_id = ?', [id])
        
        res.json({ message: 'Apteka usunięta!' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Błąd usuwania apteki' })
    }
}
