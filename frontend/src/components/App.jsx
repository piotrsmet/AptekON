import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import '../style/App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex flex-col h-screen">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Map />
      </div>
    </div>
  )
}

export default App
