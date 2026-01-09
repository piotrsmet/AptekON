import { useState, useEffect } from 'react'

export const useUserLocation = () => {
	const [userLocation, setUserLocation] = useState(null)

	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				position => {
					setUserLocation({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					})
				},
				error => {
					console.error('Błąd pobierania lokalizacji:', error)
				}
			)
		}
	}, [])

	return userLocation
}
