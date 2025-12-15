import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import '../style/App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApteka, setSelectedApteka] = useState(null)
  const [apteki, setApteki] = useState([])
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [pharmaciesWithDrug, setPharmaciesWithDrug] = useState([])
  const mapRef = useRef(null)

  // Pobierz wszystkie apteki
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

  // Klik na markera na mapie - bez zoom'u
  const handleMarkerClick = (apteka) => {
    setSelectedApteka(apteka)
  }

  // Klik w searchbarze - z zoom'em
  const handleSearchSelect = (apteka) => {
    setSelectedApteka(apteka)
    if (mapRef.current) {
      mapRef.current.zoomToApteka(apteka)
    }
  }

  // Obsługa wyboru leku
  // UWAGA: drug.ids to tablica wszystkich ID dla leków o tej samej nazwie
  // (w bazie mogą być duplikaty nazw z różnymi ID dla różnych mocy/opakowań)
  const handleDrugSelect = async (drug) => {
    setSelectedDrug(drug)
    setSelectedApteka(null) // Clear selected apteka
    
    if (!drug) {
      setPharmaciesWithDrug([])
      return
    }

    try {
      // Pobierz apteki dla wszystkich ID tego leku (jeśli drug.ids istnieje)
      const drugIds = drug.ids || [drug.id]
      const allPharmacyIds = new Set()
      
      // Pobierz apteki dla każdego wariantu leku
      for (const lekId of drugIds) {
        const response = await fetch(`http://localhost:5000/zaopatrzenie/apteki/lek/${lekId}`)
        const data = await response.json()
        // Dodaj apteki z ilością > 0 do zbioru (automatyczna deduplikacja)
        data
          .filter(item => item.ilosc > 0)
          .forEach(item => allPharmacyIds.add(item.apteka_id))
      }
      
      setPharmaciesWithDrug(Array.from(allPharmacyIds))
    } catch (err) {
      console.error('Błąd pobierania dostępności leku:', err)
      setPharmaciesWithDrug([])
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        onSelectApteka={handleSearchSelect}
        onDrugSelect={handleDrugSelect}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          selectedApteka={selectedApteka}
          selectedDrug={selectedDrug}
          apteki={apteki}
          pharmaciesWithDrug={pharmaciesWithDrug}
          onSelectApteka={handleSearchSelect}
        />
        <Map 
          onSelectApteka={handleMarkerClick} 
          ref={mapRef}
          apteki={apteki}
          selectedDrug={selectedDrug}
          pharmaciesWithDrug={pharmaciesWithDrug}
        />
      </div>
    </div>
  )
}

export default App
