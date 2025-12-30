import { useEffect, useState, useRef } from 'react'

function Sidebar({ selectedApteka, selectedDrug, apteki, pharmaciesWithDrug, onSelectApteka, user, onReservationChange, onZaopatrzenieChange }) {
  const [zaopatrzenie, setZaopatrzenie] = useState([])
  const [loading, setLoading] = useState(false)
  const [drugSearchQuery, setDrugSearchQuery] = useState('')
  const [filteredZaopatrzenie, setFilteredZaopatrzenie] = useState([])
  const [showDrugSearch, setShowDrugSearch] = useState(false)
  const [userRezerwacje, setUserRezerwacje] = useState([])
  const [reservationModal, setReservationModal] = useState(null) // {lek, maxIlosc}
  const [reservationQty, setReservationQty] = useState(1)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const scrollContainerRef = useRef(null)
  
  // Właściciel apteki - stany
  const [editingLekId, setEditingLekId] = useState(null)
  const [editingQty, setEditingQty] = useState(0)
  const [showAddLekModal, setShowAddLekModal] = useState(false)
  const [lekSearchQuery, setLekSearchQuery] = useState('')
  const [lekSearchResults, setLekSearchResults] = useState([])
  const [lekSuggestions, setLekSuggestions] = useState([])
  const [selectedNewLek, setSelectedNewLek] = useState(null)
  const [newLekQty, setNewLekQty] = useState(1)

  // Sprawdź czy user jest właścicielem apteki
  const isOwner = user && selectedApteka && selectedApteka.wlasciciel_id === user.id

  // Pobierz sugestie leków przy otwarciu modalu
  useEffect(() => {
    if (!showAddLekModal) return
    
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/leki/suggestions')
        const data = await response.json()
        setLekSuggestions(data)
      } catch (err) {
        console.error('Błąd pobierania sugestii:', err)
      }
    }
    fetchSuggestions()
  }, [showAddLekModal])

  // Pobierz rezerwacje użytkownika dla tej apteki
  useEffect(() => {
    if (!selectedApteka || !user) {
      setUserRezerwacje([])
      return
    }

    const fetchUserRezerwacje = async () => {
      try {
        const response = await fetch(`http://localhost:5000/rezerwacje/apteka?apteka_id=${selectedApteka.id}&user_id=${user.id}`)
        const data = await response.json()
        setUserRezerwacje(data)
      } catch (err) {
        console.error('Błąd pobierania rezerwacji:', err)
        setUserRezerwacje([])
      }
    }

    fetchUserRezerwacje()
  }, [selectedApteka, user])

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
        const response = await fetch(`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`)
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

  // Sprawdź czy lek jest zarezerwowany przez użytkownika
  const getUserReservationForLek = (lekId) => {
    return userRezerwacje.find(r => r.lek_id === lekId)
  }

  // Otwórz modal rezerwacji
  const openReservationModal = (lek) => {
    setReservationModal({ lek, maxIlosc: lek.ilosc })
    setReservationQty(1)
  }

  // Potwierdź rezerwację
  const confirmReservation = async () => {
    if (!reservationModal || !user) return

    try {
      const response = await fetch('http://localhost:5000/rezerwacje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          apteka_id: selectedApteka.id,
          lek_id: reservationModal.lek.lek_id,
          ilosc: reservationQty
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd rezerwacji')
      }

      // Odśwież zaopatrzenie i rezerwacje
      const zaopatrzenieRes = await fetch(`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`)
      const zaopatrzenieData = await zaopatrzenieRes.json()
      setZaopatrzenie(zaopatrzenieData)
      setFilteredZaopatrzenie(zaopatrzenieData)

      const rezerwacjeRes = await fetch(`http://localhost:5000/rezerwacje/apteka?apteka_id=${selectedApteka.id}&user_id=${user.id}`)
      const rezerwacjeData = await rezerwacjeRes.json()
      setUserRezerwacje(rezerwacjeData)

      // Powiadom rodzica o zmianie rezerwacji
      if (onReservationChange) onReservationChange()

      setReservationModal(null)
    } catch (err) {
      console.error('Błąd rezerwacji:', err)
      alert(err.message)
    }
  }

  // ========== FUNKCJE DLA WŁAŚCICIELA APTEKI ==========
  
  // Wyszukaj leki do dodania
  const handleLekSearch = async (query) => {
    setLekSearchQuery(query)
    if (query.length < 2) {
      setLekSearchResults(lekSuggestions)
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/leki?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      setLekSearchResults(data)
    } catch (err) {
      console.error('Błąd wyszukiwania leków:', err)
    }
  }

  // Zapisz zmianę ilości leku
  const saveQtyChange = async (zaopatrzenieId) => {
    try {
      const response = await fetch(`http://localhost:5000/zaopatrzenie/${zaopatrzenieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ilosc: editingQty })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd aktualizacji')
      }

      // Odśwież zaopatrzenie
      const res = await fetch(`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`)
      const data = await res.json()
      setZaopatrzenie(data)
      setFilteredZaopatrzenie(data)
      setEditingLekId(null)
      
      if (onZaopatrzenieChange) onZaopatrzenieChange()
    } catch (err) {
      console.error('Błąd aktualizacji:', err)
      alert(err.message)
    }
  }

  // Dodaj nowy lek do apteki
  const addNewLek = async () => {
    if (!selectedNewLek || !selectedApteka) return

    try {
      const response = await fetch('http://localhost:5000/zaopatrzenie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apteka_id: selectedApteka.id,
          lek_id: selectedNewLek.id,
          ilosc: newLekQty
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd dodawania leku')
      }

      // Odśwież zaopatrzenie
      const res = await fetch(`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`)
      const data = await res.json()
      setZaopatrzenie(data)
      setFilteredZaopatrzenie(data)
      
      // Resetuj modal
      setShowAddLekModal(false)
      setSelectedNewLek(null)
      setNewLekQty(1)
      setLekSearchQuery('')
      setLekSearchResults([])
      
      if (onZaopatrzenieChange) onZaopatrzenieChange()
    } catch (err) {
      console.error('Błąd dodawania leku:', err)
      alert(err.message)
    }
  }

  // Obsługa scrollowania - pokaż przycisk scroll-to-top
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      // Pokaż przycisk gdy przewinięto więcej niż wysokość kontenera
      const scrollTop = scrollContainerRef.current.scrollTop
      const containerHeight = scrollContainerRef.current.clientHeight
      setShowScrollTop(scrollTop > containerHeight)
    }
  }

  // Scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
            {isOwner && (
              <p className="text-xs text-green-600 font-medium mt-2">✓ Jesteś właścicielem tej apteki</p>
            )}
          </div>
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-2 py-4 relative"
          >
            <div className="mb-4 px-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Leki ({zaopatrzenie.length})
                </h4>
                {isOwner && (
                  <button
                    onClick={() => {
                      setShowAddLekModal(true)
                      setLekSearchResults(lekSuggestions)
                    }}
                    className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition"
                    title="Dodaj lek"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
              
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
                {filteredZaopatrzenie.map((lek) => {
                  const userReservation = getUserReservationForLek(lek.lek_id)
                  return (
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
                    
                    {/* Panel dla właściciela - edycja ilości */}
                    {isOwner ? (
                      editingLekId === lek.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={editingQty}
                            onChange={(e) => setEditingQty(Math.max(0, parseInt(e.target.value) || 0))}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => saveQtyChange(lek.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingLekId(null)}
                            className="px-3 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50"
                          >
                            Anuluj
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLekId(lek.id)
                            setEditingQty(lek.ilosc)
                          }}
                          className="mt-2 w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
                        >
                          Zmień ilość
                        </button>
                      )
                    ) : (
                      /* Przycisk rezerwacji lub info o rezerwacji - dla klientów */
                      userReservation ? (
                        <div className="mt-2 px-3 py-2 bg-green-100 border border-green-300 rounded text-xs text-green-700 font-medium">
                          ✓ Zarezerwowano: {userReservation.ilosc} szt.
                        </div>
                      ) : user && lek.ilosc > 0 ? (
                        <button
                          onClick={() => openReservationModal(lek)}
                          className="mt-2 w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          Zarezerwuj lek
                        </button>
                      ) : !user && lek.ilosc > 0 ? (
                        <p className="mt-2 text-xs text-gray-500 text-center">Zaloguj się, aby zarezerwować</p>
                      ) : null
                    )}
                  </li>
                )})}
              </ul>
            )}
            
            {/* Przycisk scroll-to-top */}
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-6 left-6 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition z-50"
                title="Przewiń do góry"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
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
      
      {/* Modal rezerwacji */}
      {reservationModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setReservationModal(null)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[9999] w-80">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezerwacja leku</h3>
            <p className="text-sm text-gray-600 mb-4">{reservationModal.lek.nazwa}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ilość (max: {reservationModal.maxIlosc})
              </label>
              <input
                type="number"
                min="1"
                max={reservationModal.maxIlosc}
                value={reservationQty}
                onChange={(e) => setReservationQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), reservationModal.maxIlosc))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Rezerwacja ważna przez 24 godziny
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReservationModal(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Anuluj
              </button>
              <button
                onClick={confirmReservation}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Potwierdź
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Modal dodawania leku (dla właściciela) */}
      {showAddLekModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => {
              setShowAddLekModal(false)
              setSelectedNewLek(null)
              setLekSearchQuery('')
            }}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[9999] w-96 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dodaj lek do apteki</h3>
            
            {!selectedNewLek ? (
              <>
                <input
                  type="text"
                  placeholder="Szukaj leku..."
                  value={lekSearchQuery}
                  onChange={(e) => handleLekSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 mb-3"
                />
                
                <div className="flex-1 overflow-y-auto max-h-64">
                  {(lekSearchQuery.length >= 2 ? lekSearchResults : lekSuggestions).length > 0 ? (
                    <ul className="space-y-2">
                      {(lekSearchQuery.length >= 2 ? lekSearchResults : lekSuggestions).map((lek) => (
                        <li
                          key={lek.id}
                          onClick={() => setSelectedNewLek(lek)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition"
                        >
                          <p className="font-medium text-gray-900 text-sm">{lek.nazwa}</p>
                          {lek.moc && <p className="text-xs text-gray-500">{lek.moc}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Wpisz nazwę leku, aby wyszukać</p>
                  )}
                </div>
                
                <button
                  onClick={() => setShowAddLekModal(false)}
                  className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Anuluj
                </button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="font-medium text-gray-900">{selectedNewLek.nazwa}</p>
                  {selectedNewLek.moc && <p className="text-xs text-gray-500">{selectedNewLek.moc}</p>}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ilość (max: 100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newLekQty}
                    onChange={(e) => setNewLekQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), 100))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedNewLek(null)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Wróć
                  </button>
                  <button
                    onClick={addNewLek}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Dodaj lek
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

export default Sidebar
