import { useState, useEffect } from 'react'

function Header({ searchQuery, onSearchChange, onSelectApteka }) {
  const [allApteki, setAllApteki] = useState([])
  const [filteredApteki, setFilteredApteki] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // Filtruj apteki na podstawie search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredApteki(allApteki.slice(0, 4))
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allApteki.filter((apteka) => {
      const nazwa = (apteka.nazwa || '').toLowerCase()
      const wlasciciel = (apteka.wlasciciel_nazwa || '').toLowerCase()
      return nazwa.includes(query) || wlasciciel.includes(query)
    })
    setFilteredApteki(filtered.slice(0, 4))
  }, [searchQuery, allApteki])

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

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <img 
          src="/logo1.svg" 
          alt="Logo" 
          className="h-10 w-auto"
        />
      </div>
      <div className="flex-1 max-w-md mx-auto relative">
        <input
          type="text"
          placeholder="Szukaj apteki..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
                  <p className="font-semibold text-gray-900 text-sm">
                    {apteka.nazwa || apteka.wlasciciel_nazwa}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {apteka.nazwa_ulicy} {apteka.numer_budynku}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="w-32"></div>
    </header>
  )
}

export default Header
