import { useEffect, useState } from 'react'

function Sidebar({ selectedApteka, selectedDrug, apteki, pharmaciesWithDrug, onSelectApteka }) {
  const [zaopatrzenie, setZaopatrzenie] = useState([])
  const [loading, setLoading] = useState(false)
  const [drugSearchQuery, setDrugSearchQuery] = useState('')
  const [filteredZaopatrzenie, setFilteredZaopatrzenie] = useState([])
  const [showDrugSearch, setShowDrugSearch] = useState(false)

  // Pobierz zaopatrzenie gdy zmieni się wybrana apteka
  useEffect(() => {
    if (!selectedApteka || !selectedApteka.id) {
      setZaopatrzenie([])
      setFilteredZaopatrzenie([])
      setDrugSearchQuery('')
      return
    }

    const fetchZaopatrzenie = async () => {
      setLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/zaopatrzenie/apteka/${selectedApteka.id}`)
        const data = await response.json()
        setZaopatrzenie(data)
        setFilteredZaopatrzenie(data)
      } catch (err) {
        console.error('Błąd pobierania zaopatrzenia:', err)
        setZaopatrzenie([])
        setFilteredZaopatrzenie([])
      } finally {
        setLoading(false)
      }
    }

    fetchZaopatrzenie()
  }, [selectedApteka])

  // Filtruj leki w aptece na podstawie wyszukiwania
  const handleDrugSearch = (query) => {
    setDrugSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredZaopatrzenie(zaopatrzenie)
      setShowDrugSearch(false)
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = zaopatrzenie.filter(lek => {
      const nazwa = (lek.nazwa || '').toLowerCase()
      const nazwaPowszechna = (lek.nazwa_powszechna || '').toLowerCase()
      const substancja = (lek.substancja || '').toLowerCase()
      return nazwa.includes(lowerQuery) || 
             nazwaPowszechna.includes(lowerQuery) || 
             substancja.includes(lowerQuery)
    })
    
    setFilteredZaopatrzenie(filtered)
    setShowDrugSearch(query.length >= 2)
  }

  // Obsługa Enter - pokaż pierwszy wynik
  const handleDrugSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredZaopatrzenie.length > 0) {
      setShowDrugSearch(false)
    }
  }

  // Wybierz lek z sugestii
  const selectDrugFromSuggestion = (lek) => {
    setDrugSearchQuery(lek.nazwa)
    setFilteredZaopatrzenie([lek])
    setShowDrugSearch(false)
  }

  // Filtruj apteki które mają wybrany lek
  const availablePharmacies = selectedDrug 
    ? apteki.filter(a => pharmaciesWithDrug.includes(a.id))
    : []

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      {selectedApteka ? (
        <>
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 break-words mb-1">
              {selectedApteka.nazwa || selectedApteka.wlasciciel_nazwa || 'Apteka'}
            </h3>
            <p className="text-sm text-gray-500 break-words">
              {selectedApteka.wlasciciel_nazwa}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {selectedApteka.nazwa_ulicy}{selectedApteka.nr_budynku ? `, ${selectedApteka.nr_budynku}` : ''}
            </p>
            <p className="text-xs text-gray-400">
              {selectedApteka.kod_pocztowy} {selectedApteka.miejscowosc}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="mb-4 px-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                Leki ({zaopatrzenie.length})
              </h4>
              
              {/* Searchbar dla leków w aptece */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj leku w tej aptece..."
                  value={drugSearchQuery}
                  onChange={(e) => handleDrugSearch(e.target.value)}
                  onKeyDown={handleDrugSearchKeyDown}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
                
                {/* Sugestie leków z apteki */}
                {showDrugSearch && filteredZaopatrzenie.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    <ul>
                      {filteredZaopatrzenie.slice(0, 5).map((lek) => (
                        <li
                          key={lek.id}
                          onClick={() => selectDrugFromSuggestion(lek)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                        >
                          <p className="font-semibold text-gray-900 text-sm">
                            {lek.nazwa}
                          </p>
                          {lek.ilosc && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              Dostępne: {lek.ilosc} szt.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {loading && <p className="text-sm text-gray-500 px-2">Ładowanie...</p>}
            
            {!loading && zaopatrzenie.length === 0 && (
              <p className="text-sm text-gray-400 px-2">Brak leków w zaopatrzeniu</p>
            )}
            
            {!loading && drugSearchQuery && filteredZaopatrzenie.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">Danego leku nie ma w tej aptece</p>
              </div>
            )}
            
            {!loading && filteredZaopatrzenie.length > 0 && (
              <ul className="space-y-4">
                {filteredZaopatrzenie.map((lek) => (
                  <li key={lek.id} className="bg-white border-2 border-gray-400 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition mx-2">
                    <p className="font-bold text-gray-900 text-base break-words leading-snug">
                      {lek.nazwa || 'Nieznany lek'}
                    </p>
                    
                    <div className="mt-2 space-y-2 text-sm">
                      {lek.nazwa_powszechna && (
                        <div className="flex flex-col">
                          <span className="text-gray-600 font-bold text-xs uppercase tracking-wide">Nazwa powszechna</span>
                          <span className="text-gray-800 mt-1.5 leading-relaxed">{lek.nazwa_powszechna}</span>
                        </div>
                      )}
                      
                      {lek.substancja && (
                        <>
                          <div className="border-t-2 border-gray-300 pt-4">
                            <span className="text-gray-600 font-bold text-xs uppercase tracking-wide">Substancja czynna</span>
                            <span className="text-gray-800 block mt-1.5 font-medium">{lek.substancja}</span>
                          </div>
                        </>
                      )}
                      
                      {lek.moc && (
                        <>
                          <div className="border-t-2 border-gray-300 pt-4">
                            <span className="text-gray-600 font-bold text-xs uppercase tracking-wide">Moc opakowania</span>
                            <span className="text-gray-800 block mt-1.5 font-medium">{lek.moc}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 rounded flex items-center justify-between font-semibold text-xs">
                      <span className="text-gray-700 truncate">Dostępna ilość:</span>
                      <span className="text-blue-700 font-bold ml-2">{lek.ilosc} szt.</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : selectedDrug ? (
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide px-2">
            Dostępny w {availablePharmacies.length} aptekach
          </h4>
          {availablePharmacies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Brak aptek z tym lekiem w bazie danych</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {availablePharmacies.map((apteka) => (
                <li 
                  key={apteka.id} 
                  className="bg-white border-2 border-green-400 rounded-xl p-4 hover:border-green-600 hover:shadow-md transition mx-2 cursor-pointer"
                  onClick={() => onSelectApteka(apteka)}
                >
                  <h3 className="text-base font-bold text-gray-900 break-words mb-1">
                    {apteka.nazwa || apteka.wlasciciel_nazwa || 'Apteka'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2">
                    {apteka.nazwa_ulicy}{apteka.nr_budynku ? `, ${apteka.nr_budynku}` : ''}
                  </p>
                  <p className="text-xs text-gray-600">
                    {apteka.kod_pocztowy} {apteka.miejscowosc}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Wybierz aptekę lub lek</h3>
            <p className="text-sm text-gray-500">
              Kliknij na pineskę na mapie lub wyszukaj lek
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
