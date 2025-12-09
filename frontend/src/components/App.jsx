import { useState, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import '../style/App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApteka, setSelectedApteka] = useState(null)
  const mapRef = useRef(null)

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

  return (
    <div className="flex flex-col h-screen">
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        onSelectApteka={handleSearchSelect}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar selectedApteka={selectedApteka} />
        <Map onSelectApteka={handleMarkerClick} ref={mapRef} />
      </div>
    </div>
  )
}

export default App
