import { useState, useEffect } from 'react'
import { API_URL } from '../config'

export const useApteki = () => {
	const [apteki, setApteki] = useState([])

	const fetchApteki = async () => {
		try {
			const response = await fetch(`${API_URL}/apteki`)
			const data = await response.json()
			setApteki(data)
		} catch (err) {
			console.error('Błąd pobierania aptek:', err)
		}
	}

	useEffect(() => {
		fetchApteki()
	}, [])

	return { apteki, fetchApteki }
}
