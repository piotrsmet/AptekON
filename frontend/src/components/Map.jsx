import {
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from 'react'

function escapeHtml(unsafe) {
	if (unsafe === null || unsafe === undefined) return ''
	return String(unsafe)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

const Map = forwardRef(
	(
		{ onSelectApteka, apteki, selectedDrug, pharmaciesWithDrug, user },
		ref
	) => {
		const mapContainer = useRef(null)
		const map = useRef(null)
		const markersMap = useRef({})
		const layerGroup = useRef(null)

		useImperativeHandle(ref, () => ({
			zoomToApteka: apteka => {
				if (map.current && apteka.lat && apteka.lon) {
					map.current.setView([apteka.lat, apteka.lon], 16)
				}
				if (markersMap.current[apteka.id]) {
					markersMap.current[apteka.id].openPopup()
				}
			},
		}))

		useEffect(() => {
			if (map.current || !mapContainer.current) return

			Promise.all([
				import('leaflet'),
				import('leaflet/dist/leaflet.css'),
			]).then(([L]) => {
				if (!mapContainer.current) return

				map.current = L.default
					.map(mapContainer.current)
					.setView([51.2465, 22.5684], 13)

				L.default
					.tileLayer(
						'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
						{
							maxZoom: 19,
							attribution:
								'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
						}
					)
					.addTo(map.current)

				layerGroup.current = L.default.layerGroup().addTo(map.current)
			})

			return () => {
				if (map.current) {
					map.current.remove()
					map.current = null
				}
			}
		}, [])

		useEffect(() => {
			if (!map.current || !layerGroup.current) return

			import('leaflet').then(L => {
				layerGroup.current.clearLayers()
				markersMap.current = {}

				apteki.forEach(apteka => {
					if (apteka.lat && apteka.lon) {
						let iconUrl =
							'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzI1NjNlYiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'

						if (user && apteka.wlasciciel_id === user.id) {
							iconUrl =
								'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI2Y1OWUwYiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
						} else if (
							selectedDrug &&
							pharmaciesWithDrug.includes(apteka.id)
						) {
							iconUrl =
								'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzE2YTM0YSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
						}

						const customIcon = L.default.icon({
							iconUrl: iconUrl,
							iconSize: [24, 24],
							iconAnchor: [12, 12],
							popupAnchor: [0, -12],
						})

						const marker = L.default
							.marker([apteka.lat, apteka.lon], {
								icon: customIcon,
							})
							.addTo(layerGroup.current)
						markersMap.current[apteka.id] = marker

						const nazwa = apteka.nazwa || null
						const owner =
							apteka.wlasciciel_nazwa || 'wlasciciel nazwa'
						const street = apteka.nazwa_ulicy || ''
						const number = apteka.nr_budynku || ''
						const postal = apteka.kod_pocztowy || ''
						const city = apteka.miejscowosc || ''
						const phone = apteka.telefon || ''
						const email = apteka.email || ''

						const addressLine =
							street && number
								? `${street}, ${number}`
								: street || number
						const cityLine = [postal, city]
							.filter(Boolean)
							.join(' ')

						let popupContent
						if (nazwa) {
							popupContent = `
              <div class="max-w-xs p-0">
                <div class="font-bold text-base text-gray-900 mb-1">${escapeHtml(
					nazwa
				)}</div>
                <div class="text-sm text-gray-500 mb-2">${escapeHtml(
					owner
				)}</div>
                ${
					addressLine
						? `<div class="text-sm text-gray-900">${escapeHtml(
								addressLine
						  )}</div>`
						: ''
				}
                ${
					cityLine
						? `<div class="text-sm text-gray-900">${escapeHtml(
								cityLine
						  )}</div>`
						: ''
				}
                ${
					phone
						? `<div class="mt-2 text-sm text-gray-900">Tel: ${escapeHtml(
								phone
						  )}</div>`
						: ''
				}
                ${
					email
						? `<div class="text-sm text-gray-900">${escapeHtml(
								email
						  )}</div>`
						: ''
				}
              </div>
            `
						} else {
							popupContent = `
              <div class="max-w-xs p-0">
                <div class="font-bold text-base text-gray-900 mb-2">${escapeHtml(
					owner
				)}</div>
                ${
					addressLine
						? `<div class="text-sm text-gray-900">${escapeHtml(
								addressLine
						  )}</div>`
						: ''
				}
                ${
					cityLine
						? `<div class="text-sm text-gray-900">${escapeHtml(
								cityLine
						  )}</div>`
						: ''
				}
                ${
					phone
						? `<div class="mt-2 text-sm text-gray-900">Tel: ${escapeHtml(
								phone
						  )}</div>`
						: ''
				}
                ${
					email
						? `<div class="text-sm text-gray-900">${escapeHtml(
								email
						  )}</div>`
						: ''
				}
              </div>
            `
						}
						marker.bindPopup(popupContent)

						marker.on('click', () => {
							onSelectApteka(apteka)
						})
					}
				})
			})
		}, [apteki, selectedDrug, pharmaciesWithDrug, user])

		return <div ref={mapContainer} className='flex-1 h-full' />
	}
)

Map.displayName = 'Map'

export default Map
