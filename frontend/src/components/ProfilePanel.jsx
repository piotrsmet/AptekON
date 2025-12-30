import { useState, useEffect } from 'react'

function ProfilePanel({ isOpen, onClose, user, onReservationChange, onAptekaAdded }) {
  const [activeTab, setActiveTab] = useState('zamowienia')
  const [rezerwacje, setRezerwacje] = useState([])
  const [loadingRezerwacje, setLoadingRezerwacje] = useState(false)
  const [mojeApteki, setMojeApteki] = useState([])
  const [loadingApteki, setLoadingApteki] = useState(false)
  const [showAddApteka, setShowAddApteka] = useState(false)
  const [aptekaForm, setAptekaForm] = useState({
    nazwa: '',
    miejscowosc: '',
    nazwa_ulicy: '',
    nr_budynku: '',
    kod_pocztowy: '',
    telefon: '',
    email: ''
  })
  const [addingApteka, setAddingApteka] = useState(false)

  // Pobierz rezerwacje użytkownika
  useEffect(() => {
    if (!isOpen || !user) {
      setRezerwacje([])
      setMojeApteki([])
      return
    }

    const fetchRezerwacje = async () => {
      setLoadingRezerwacje(true)
      try {
        const response = await fetch(`http://localhost:5000/rezerwacje?user_id=${user.id}`)
        const data = await response.json()
        setRezerwacje(data)
      } catch (err) {
        console.error('Błąd pobierania rezerwacji:', err)
        setRezerwacje([])
      } finally {
        setLoadingRezerwacje(false)
      }
    }

    const fetchMojeApteki = async () => {
      setLoadingApteki(true)
      try {
        const response = await fetch('http://localhost:5000/apteki')
        const data = await response.json()
        const userApteki = data.filter(a => a.wlasciciel_id === user.id)
        setMojeApteki(userApteki)
      } catch (err) {
        console.error('Błąd pobierania aptek:', err)
        setMojeApteki([])
      } finally {
        setLoadingApteki(false)
      }
    }

    fetchRezerwacje()
    fetchMojeApteki()
  }, [isOpen, user])

  // Dodaj aptekę
  const handleAddApteka = async (e) => {
    e.preventDefault()
    if (!aptekaForm.nazwa || !aptekaForm.miejscowosc || !aptekaForm.nazwa_ulicy) {
      alert('Wypełnij wymagane pola: nazwa, miejscowość, ulica')
      return
    }

    setAddingApteka(true)
    try {
      const response = await fetch('http://localhost:5000/apteki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aptekaForm,
          wlasciciel_id: user.id,
          wlasciciel_nazwa: user.email
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd dodawania apteki')
      }

      alert('Apteka została dodana!')
      setShowAddApteka(false)
      setAptekaForm({
        nazwa: '',
        miejscowosc: '',
        nazwa_ulicy: '',
        nr_budynku: '',
        kod_pocztowy: '',
        telefon: '',
        email: ''
      })
      
      // Odśwież listę moich aptek
      const response2 = await fetch('http://localhost:5000/apteki')
      const data2 = await response2.json()
      setMojeApteki(data2.filter(a => a.wlasciciel_id === user.id))
      
      // Powiadom rodzica o nowej aptece
      if (onAptekaAdded) onAptekaAdded()
    } catch (err) {
      console.error('Błąd dodawania apteki:', err)
      alert(err.message)
    } finally {
      setAddingApteka(false)
    }
  }

  // Anuluj rezerwację
  const cancelRezerwacja = async (rezerwacjaId) => {
    if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) return

    try {
      const response = await fetch(`http://localhost:5000/rezerwacje/${rezerwacjaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd anulowania')
      }

      // Odśwież listę rezerwacji
      setRezerwacje(rezerwacje.filter(r => r.id !== rezerwacjaId))
      
      // Powiadom rodzica o zmianie
      if (onReservationChange) onReservationChange()
    } catch (err) {
      console.error('Błąd anulowania:', err)
      alert(err.message)
    }
  }

  // Usuń aptekę
  const deleteApteka = async (aptekaId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę aptekę? Wszystkie leki i dane zostaną usunięte.')) return

    try {
      const response = await fetch(`http://localhost:5000/apteki/${aptekaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd usuwania apteki')
      }

      // Odśwież listę aptek
      setMojeApteki(mojeApteki.filter(a => a.id !== aptekaId))
      
      // Powiadom rodzica
      if (onAptekaAdded) onAptekaAdded()
    } catch (err) {
      console.error('Błąd usuwania apteki:', err)
      alert(err.message)
    }
  }

  // Formatuj datę wygaśnięcia
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity z-[9998] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-[9999] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-blue-600">
            <div>
              <h2 className="text-xl font-semibold text-white">Profil</h2>
              <p className="text-sm text-blue-100 mt-1">{user?.email}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('zamowienia')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'zamowienia' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Zamówienia
            </button>
            <button
              onClick={() => setActiveTab('rezerwacje')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'rezerwacje' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rezerwacje
            </button>
            <button
              onClick={() => setActiveTab('mojeApteki')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'mojeApteki' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Moje apteki
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'zamowienia' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje zamówienia</h3>
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-500">Brak zamówień</p>
                  <p className="text-sm text-gray-400 mt-1">Twoje zamówienia pojawią się tutaj</p>
                </div>
              </div>
            )}
            
            {activeTab === 'rezerwacje' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje rezerwacje</h3>
                
                {loadingRezerwacje && (
                  <p className="text-sm text-gray-500">Ładowanie...</p>
                )}
                
                {!loadingRezerwacje && rezerwacje.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Brak rezerwacji</p>
                    <p className="text-sm text-gray-400 mt-1">Twoje rezerwacje pojawią się tutaj</p>
                  </div>
                )}
                
                {!loadingRezerwacje && rezerwacje.length > 0 && (
                  <ul className="space-y-4">
                    {rezerwacje.map((rez) => (
                      <li key={rez.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-900">{rez.lek_nazwa}</p>
                        {rez.lek_moc && <p className="text-xs text-gray-500">{rez.lek_moc}</p>}
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <p><span className="font-medium">Ilość:</span> {rez.ilosc} szt.</p>
                          <p><span className="font-medium">Apteka:</span> {rez.apteka_nazwa}</p>
                          <p className="text-xs text-gray-500">
                            {rez.nazwa_ulicy}{rez.nr_budynku ? `, ${rez.nr_budynku}` : ''}, {rez.miejscowosc}
                          </p>
                        </div>
                        
                        <p className="mt-2 text-xs text-orange-600">
                          Wygasa: {formatDate(rez.data_wygasniecia)}
                        </p>
                        
                        <button
                          onClick={() => cancelRezerwacja(rez.id)}
                          className="mt-3 w-full py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                        >
                          Anuluj rezerwację
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {activeTab === 'mojeApteki' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje apteki</h3>
                
                {loadingApteki && (
                  <p className="text-sm text-gray-500">Ładowanie...</p>
                )}
                
                {!loadingApteki && mojeApteki.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500">Nie masz jeszcze aptek</p>
                    <p className="text-sm text-gray-400 mt-1">Dodaj aptekę poniżej</p>
                  </div>
                )}
                
                {!loadingApteki && mojeApteki.length > 0 && (
                  <ul className="space-y-4">
                    {mojeApteki.map((apteka) => (
                      <li key={apteka.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{apteka.nazwa}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {apteka.nazwa_ulicy}{apteka.nr_budynku ? ` ${apteka.nr_budynku}` : ''}
                            </p>
                            <p className="text-sm text-gray-500">
                              {apteka.kod_pocztowy && `${apteka.kod_pocztowy} `}{apteka.miejscowosc}
                            </p>
                            {apteka.telefon && (
                              <p className="text-sm text-gray-500 mt-1">Tel: {apteka.telefon}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteApteka(apteka.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Usuń aptekę"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          {/* Przycisk dodawania apteki */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowAddApteka(true)}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj własną aptekę
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal dodawania apteki */}
      {showAddApteka && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[10000]"
            onClick={() => setShowAddApteka(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[10001] w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dodaj własną aptekę</h3>
              <button
                onClick={() => setShowAddApteka(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddApteka} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa apteki *</label>
                <input
                  type="text"
                  value={aptekaForm.nazwa}
                  onChange={(e) => setAptekaForm({...aptekaForm, nazwa: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="Apteka Pod Orłem"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowość *</label>
                <input
                  type="text"
                  value={aptekaForm.miejscowosc}
                  onChange={(e) => setAptekaForm({...aptekaForm, miejscowosc: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="Warszawa"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ulica *</label>
                  <input
                    type="text"
                    value={aptekaForm.nazwa_ulicy}
                    onChange={(e) => setAptekaForm({...aptekaForm, nazwa_ulicy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="Marszałkowska"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nr budynku</label>
                  <input
                    type="text"
                    value={aptekaForm.nr_budynku}
                    onChange={(e) => setAptekaForm({...aptekaForm, nr_budynku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kod pocztowy</label>
                <input
                  type="text"
                  value={aptekaForm.kod_pocztowy}
                  onChange={(e) => setAptekaForm({...aptekaForm, kod_pocztowy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="00-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={aptekaForm.telefon}
                  onChange={(e) => setAptekaForm({...aptekaForm, telefon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="123 456 789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email apteki</label>
                <input
                  type="email"
                  value={aptekaForm.email}
                  onChange={(e) => setAptekaForm({...aptekaForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="apteka@example.com"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddApteka(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={addingApteka}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {addingApteka ? 'Dodawanie...' : 'Dodaj aptekę'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}

export default ProfilePanel
