import { useEffect, useRef, useState } from 'react'

function Map() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [apteki, setApteki] = useState([])

  // Pobierz apteki z API
  useEffect(() => {
    const fetchApteki = async () => {
      try {
        const response = await fetch('http://localhost:5000/apteki')
        const data = await response.json()
        setApteki(data)
      } catch (err) {
        console.error('Błąd pobierania aptek:', err)
      }
    }

    fetchApteki()
  }, [])

  // Inicjalizuj mapę i dodaj markery
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Dynamicznie załaduj Leaflet
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      if (!mapContainer.current) return

      // Inicjalizacja mapy - Lublin
      map.current = L.default.map(mapContainer.current).setView([51.2465, 22.5684], 13)

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map.current)

      // Dodaj markery dla wszystkich aptek
      apteki.forEach((apteka) => {
        if (apteka.lat && apteka.lon) {
          const marker = L.default.marker([apteka.lat, apteka.lon]).addTo(map.current)
          const popupContent = `
            <div class="font-semibold text-sm">
              <p class="font-bold">${apteka.nazwa_apteki}</p>
              <p>${apteka.nazwa_ulicy} ${apteka.numer_budynku}</p>
              <p>${apteka.kod_pocztowy} ${apteka.miejscowosc}</p>
              <p class="mt-1 text-xs">Tel: ${apteka.telefon}</p>
              ${apteka.email ? `<p class="text-xs">${apteka.email}</p>` : ''}
            </div>
          `
          marker.bindPopup(popupContent)
        }
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [apteki])

  return <div ref={mapContainer} className="flex-1 h-full" />
}

export default Map
