import { useState } from 'react'
import { API_URL } from '../config'

export const useDrugAvailability = () => {
	const [pharmaciesWithDrug, setPharmaciesWithDrug] = useState([])

	const checkDrugAvailability = async drug => {
		try {
			const drugIds = drug.ids || [drug.id]
			const allPharmacyIds = new Set()

			for (const lekId of drugIds) {
				const response = await fetch(
					`${API_URL}/zaopatrzenie?lek_id=${lekId}`
				)
				const data = await response.json()
				data.filter(item => item.ilosc > 0).forEach(item =>
					allPharmacyIds.add(item.apteka_id)
				)
			}

			setPharmaciesWithDrug(Array.from(allPharmacyIds))
		} catch (err) {
			console.error('Błąd pobierania dostępności leku:', err)
			setPharmaciesWithDrug([])
		}
	}

	const clearAvailability = () => {
		setPharmaciesWithDrug([])
	}

	return { pharmaciesWithDrug, checkDrugAvailability, clearAvailability }
}
