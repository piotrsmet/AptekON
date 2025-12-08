import { useEffect, useState } from 'react'

function Sidebar({ selectedApteka }) {
  const [zaopatrzenie, setZaopatrzenie] = useState([])
  const [loading, setLoading] = useState(false)

  // Pobierz zaopatrzenie gdy zmieni się wybrana apteka
  useEffect(() => {
    if (!selectedApteka || !selectedApteka.id) {
      setZaopatrzenie([])
      return
    }

    const fetchZaopatrzenie = async () => {
      setLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/zaopatrzenie/apteka/${selectedApteka.id}`)
        const data = await response.json()
        setZaopatrzenie(data)
      } catch (err) {
        console.error('Błąd pobierania zaopatrzenia:', err)
        setZaopatrzenie([])
      } finally {
        setLoading(false)
      }
    }

    fetchZaopatrzenie()
  }, [selectedApteka])

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
              {selectedApteka.nazwa_ulicy} {selectedApteka.numer_budynku}
            </p>
            <p className="text-xs text-gray-400">
              {selectedApteka.kod_pocztowy} {selectedApteka.miejscowosc}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Leki ({zaopatrzenie.length})
            </h4>
            
            {loading && <p className="text-sm text-gray-500">Ładowanie...</p>}
            
            {!loading && zaopatrzenie.length === 0 && (
              <p className="text-sm text-gray-400">Brak leków w zaopatrzeniu</p>
            )}
            
            {!loading && zaopatrzenie.length > 0 && (
              <ul className="space-y-4">
                {zaopatrzenie.map((lek) => (
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
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Wybierz aptekę</h3>
            <p className="text-sm text-gray-500">
              Kliknij na pineskę na mapie, aby wyświetlić zaopatrzenie
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
