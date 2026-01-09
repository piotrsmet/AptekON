import { useState, useEffect } from 'react'

// Funkcja do obliczania odległości (wzór Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Promień Ziemi w km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Odległość w km
}

// Funkcja pomocnicza do formatowania odległości
const formatDistance = (distanceInKm) => {
  if (distanceInKm < 1) {
    // Mniej niż 1 km - pokaż w metrach
    return `${Math.round(distanceInKm * 1000)} m`
  } else {
    // 1 km lub więcej - pokaż w km z jednym miejscem po przecinku
    return `${distanceInKm.toFixed(1)} km`
  }
}

function DrugSearchBar({ onDrugSelect }) {
  const [drugQuery, setDrugQuery] = useState('')
  const [drugSuggestions, setDrugSuggestions] = useState([])
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false)
  const [initialSuggestions, setInitialSuggestions] = useState([])

  // Pobierz przykładowe leki przy starcie
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/leki/suggestions')
        const data = await response.json()
        // Deduplikuj również początkowe sugestie
        const uniqueDrugs = deduplicateDrugs(data)
        setInitialSuggestions(uniqueDrugs)
      } catch (err) {
        console.error('Błąd pobierania sugestii:', err)
      }
    }
    fetchSuggestions()
  }, [])

  // UWAGA: W bazie mogą być leki o tej samej nazwie ale różnych ID
  // (np. różne moce, opakowania, kraje pochodzenia).
  // Ta funkcja deduplikuje leki po nazwie, ale zachowuje wszystkie ID w tablicy,
  // dzięki czemu wyszukiwanie aptek działa dla wszystkich wariantów tego leku.
  const deduplicateDrugs = (drugs) => {
    const drugMap = new Map()
    
    drugs.forEach(drug => {
      if (drugMap.has(drug.nazwa)) {
        // Jeśli lek o tej nazwie już istnieje, dodaj ID do tablicy
        const existing = drugMap.get(drug.nazwa)
        existing.ids.push(drug.id)
      } else {
        // Pierwszy lek o tej nazwie - utwórz nowy wpis z tablicą ID
        drugMap.set(drug.nazwa, {
          ...drug,
          ids: [drug.id] // Tablica wszystkich ID dla tej nazwy
        })
      }
    })
    
    return Array.from(drugMap.values())
  }

  const handleDrugSearch = async (query) => {
    setDrugQuery(query)
    if (query.length < 2) {
      setDrugSuggestions([])
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/leki?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      // Deduplikuj leki po nazwie, zachowując wszystkie ID
      const uniqueDrugs = deduplicateDrugs(data)
      setDrugSuggestions(uniqueDrugs)
      setShowDrugSuggestions(true)
    } catch (err) {
      console.error('Błąd wyszukiwania leków:', err)
    }
  }

  const handleDrugFocus = () => {
    if (!drugQuery) {
      setDrugSuggestions(initialSuggestions)
      setShowDrugSuggestions(true)
    }
  }

  const selectDrug = (drug) => {
    setDrugQuery(drug.nazwa)
    setShowDrugSuggestions(false)
    onDrugSelect(drug)
  }

  // Obsługa klawisza Enter - wybiera pierwszy lek z listy
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && drugSuggestions.length > 0) {
      selectDrug(drugSuggestions[0])
    }
  }

  return (
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder="Szukaj leku..."
        value={drugQuery}
        onChange={(e) => handleDrugSearch(e.target.value)}
        onFocus={handleDrugFocus}
        onBlur={() => setTimeout(() => setShowDrugSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 transition text-sm"
      />
      {showDrugSuggestions && drugSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
          <ul>
            {drugSuggestions.map((drug) => (
              <li
                key={drug.id}
                onClick={() => selectDrug(drug)}
                className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
              >
                <p className="font-semibold text-gray-900 text-sm">
                  {drug.nazwa}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Header({ searchQuery, onSearchChange, onSelectApteka, onDrugSelect, user, onOpenAuth, onLogout, onOpenProfile }) {
  const [allApteki, setAllApteki] = useState([])
  const [filteredApteki, setFilteredApteki] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

  // Pobierz lokalizację użytkownika
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.error('Błąd pobierania lokalizacji:', error)
        }
      )
    }
  }, [])

  // Pobierz wszystkie apteki na początek
  useEffect(() => {
    const fetchApteki = async () => {
      try {
        const response = await fetch('http://localhost:5000/apteki')
        const data = await response.json()
        setAllApteki(data)
      } catch (err) {
        console.error('Błąd pobierania aptek:', err)
      }
    }

    fetchApteki()
  }, [])

  // Filtruj apteki na podstawie search query i oblicz odległość
  useEffect(() => {
    // Dodaj odległość do każdej apteki jeśli mamy lokalizację
    let aptekiWithDistance = allApteki.map(apteka => {
      if (userLocation && apteka.lat && apteka.lon) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lon,
          apteka.lat, apteka.lon
        )
        return { ...apteka, distance }
      }
      return { ...apteka, distance: null }
    })

    // Sortuj po odległości (najbliższe pierwsze) - apteki bez lokalizacji na końcu
    aptekiWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })

    if (!searchQuery.trim()) {
      setFilteredApteki(aptekiWithDistance.slice(0, 4))
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = aptekiWithDistance.filter((apteka) => {
      const nazwa = (apteka.nazwa || '').toLowerCase()
      const wlasciciel = (apteka.wlasciciel_nazwa || '').toLowerCase()
      return nazwa.includes(query) || wlasciciel.includes(query)
    })
    setFilteredApteki(filtered.slice(0, 4))
  }, [searchQuery, allApteki, userLocation])

  const handleSelectSuggestion = (apteka) => {
    onSearchChange('')
    setShowSuggestions(false)
    onSelectApteka(apteka)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  // Obsługa klawisza Enter - wybiera pierwszą aptekę z listy
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredApteki.length > 0) {
      handleSelectSuggestion(filteredApteki[0])
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <img 
          src="/logo1.svg" 
          alt="Logo" 
          className="h-10 w-auto"
        />
      </div>
      <div className="flex flex-1 max-w-3xl mx-auto gap-4">
        {/* Wyszukiwarka aptek */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Szukaj apteki..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm"
          />
          {showSuggestions && filteredApteki.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
              <ul>
                {filteredApteki.map((apteka) => (
                  <li
                    key={apteka.id}
                    onClick={() => handleSelectSuggestion(apteka)}
                    className="ml-3 mb-1 mt-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {apteka.nazwa || apteka.wlasciciel_nazwa}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {apteka.nazwa_ulicy}{apteka.nr_budynku ? `, ${apteka.nr_budynku}` : ''}
                        </p>
                      </div>
                      {apteka.distance !== null && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">
                          {formatDistance(apteka.distance)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Wyszukiwarka leków */}
        <DrugSearchBar onDrugSelect={onDrugSelect} />
      </div>
      
      {/* Przyciski logowania / Info o użytkowniku */}
      <div className="flex items-center gap-3 min-w-fit">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Witaj, <span className="font-semibold text-blue-600">{user.email}</span>
            </span>
            <button
              onClick={onOpenProfile}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Profil
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Wyloguj
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Zaloguj się
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Zarejestruj się
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
