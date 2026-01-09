import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import AuthPanel from './AuthPanel'
import ProfilePanel from './ProfilePanel'
import '../style/App.css'

function App() {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedApteka, setSelectedApteka] = useState(null)
	const [apteki, setApteki] = useState([])
	const [selectedDrug, setSelectedDrug] = useState(null)
	const [pharmaciesWithDrug, setPharmaciesWithDrug] = useState([])
	const [userLocation, setUserLocation] = useState(null)
	const mapRef = useRef(null)

	// Auth state
	const [user, setUser] = useState(() => {
		const saved = localStorage.getItem('user')
		if (saved) {
			try {
				return JSON.parse(saved)
			} catch (e) {
				return null
			}
		}
		return null
	})
	const [authPanelOpen, setAuthPanelOpen] = useState(false)
	const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
	const [profilePanelOpen, setProfilePanelOpen] = useState(false)
	const [reservationRefresh, setReservationRefresh] = useState(0)

	// Pobierz lokalizację użytkownika
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				position => {
					setUserLocation({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					})
				},
				error => {
					console.error('Błąd pobierania lokalizacji:', error)
				}
			)
		}
	}, [])

	// Pobierz wszystkie apteki
	const fetchApteki = async () => {
		try {
			const response = await fetch('http://localhost:5000/apteki')
			const data = await response.json()
			setApteki(data)
		} catch (err) {
			console.error('Błąd pobierania aptek:', err)
		}
	}

	useEffect(() => {
		fetchApteki()
	}, [])

	// Auth handlers
	const handleOpenAuth = mode => {
		setAuthMode(mode)
		setAuthPanelOpen(true)
	}

	const handleLoginSuccess = userData => {
		setUser(userData)
		localStorage.setItem('user', JSON.stringify(userData))
	}

	const handleLogout = () => {
		setUser(null)
		localStorage.removeItem('user')
	}

	// Po dodaniu apteki odśwież listę
	const handleAptekaAdded = () => {
		fetchApteki()
	}

	// Odśwież rezerwacje
	const handleReservationChange = () => {
		setReservationRefresh(prev => prev + 1)
	}

	// Klik na markera na mapie - bez zoom'u
	const handleMarkerClick = apteka => {
		setSelectedApteka(apteka)
	}

	// Klik w searchbarze - z zoom'em
	const handleSearchSelect = apteka => {
		setSelectedApteka(apteka)
		if (mapRef.current) {
			mapRef.current.zoomToApteka(apteka)
		}
	}

	// Obsługa wyboru leku
	// UWAGA: drug.ids to tablica wszystkich ID dla leków o tej samej nazwie
	// (w bazie mogą być duplikaty nazw z różnymi ID dla różnych mocy/opakowań)
	const handleDrugSelect = async drug => {
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
				const response = await fetch(
					`http://localhost:5000/zaopatrzenie?lek_id=${lekId}`
				)
				const data = await response.json()
				// Dodaj apteki z ilością > 0 do zbioru (automatyczna deduplikacja)
				data.filter(item => item.ilosc > 0).forEach(item =>
					allPharmacyIds.add(item.apteka_id)
				)
			}

			setPharmaciesWithDrug(Array.from(allPharmacyIds))
		} catch (err) {
			console.error('Błąd pobierania dostępności leku:', err)
			setPharmaciesWithDrug([])
		}
	}

	return (
		<div className='flex flex-col h-screen'>
			<Header
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onSelectApteka={handleSearchSelect}
				onDrugSelect={handleDrugSelect}
				user={user}
				onOpenAuth={handleOpenAuth}
				onLogout={handleLogout}
				onOpenProfile={() => setProfilePanelOpen(true)}
			/>
			<div className='flex flex-1 overflow-hidden'>
				<Sidebar
					selectedApteka={selectedApteka}
					selectedDrug={selectedDrug}
					apteki={apteki}
					pharmaciesWithDrug={pharmaciesWithDrug}
					onSelectApteka={handleSearchSelect}
					user={user}
					userLocation={userLocation}
					onReservationChange={handleReservationChange}
					onZaopatrzenieChange={handleReservationChange}
				/>
				<Map
					onSelectApteka={handleMarkerClick}
					ref={mapRef}
					apteki={apteki}
					selectedDrug={selectedDrug}
					pharmaciesWithDrug={pharmaciesWithDrug}
					user={user}
				/>
			</div>

			{/* Panel logowania/rejestracji */}
			<AuthPanel
				isOpen={authPanelOpen}
				onClose={() => setAuthPanelOpen(false)}
				mode={authMode}
				onSwitchMode={setAuthMode}
				onLoginSuccess={handleLoginSuccess}
			/>

			{/* Panel profilu */}
			<ProfilePanel
				isOpen={profilePanelOpen}
				onClose={() => setProfilePanelOpen(false)}
				user={user}
				onReservationChange={handleReservationChange}
				onAptekaAdded={handleAptekaAdded}
				key={reservationRefresh}
			/>
		</div>
	)
}

export default App
