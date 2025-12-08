import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import '../style/App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApteka, setSelectedApteka] = useState(null)

  return (
    <div className="flex flex-col h-screen">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar selectedApteka={selectedApteka} />
        <Map onSelectApteka={setSelectedApteka} />
      </div>
    </div>
  )
}

export default App
