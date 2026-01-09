import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Map from './Map'
import AuthPanel from './AuthPanel'
import ProfilePanel from './ProfilePanel'
import '../style/App.css'
import { API_URL } from '../config'
import { useUserLocation } from '../hooks/useUserLocation'
import { useApteki } from '../hooks/useApteki'
import { useAuth } from '../hooks/useAuth'
import { useDrugAvailability } from '../hooks/useDrugAvailability'

function App() {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedApteka, setSelectedApteka] = useState(null)
	const [selectedDrug, setSelectedDrug] = useState(null)
	const mapRef = useRef(null)

	const { apteki, fetchApteki } = useApteki()
	const userLocation = useUserLocation()
	const { user, login, logout } = useAuth()
	const { pharmaciesWithDrug, checkDrugAvailability, clearAvailability } =
		useDrugAvailability()

	const [authPanelOpen, setAuthPanelOpen] = useState(false)
	const [authMode, setAuthMode] = useState('login')
	const [profilePanelOpen, setProfilePanelOpen] = useState(false)
	const [reservationRefresh, setReservationRefresh] = useState(0)
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

	const handleOpenAuth = mode => {
		setAuthMode(mode)
		setAuthPanelOpen(true)
	}

	const handleLoginSuccess = userData => {
		login(userData)
	}

	const handleLogout = () => {
		logout()
	}

	const handleAptekaAdded = () => {
		fetchApteki()
	}

	const handleReservationChange = () => {
		setReservationRefresh(prev => prev + 1)
	}

	const handleMarkerClick = apteka => {
		setSelectedApteka(apteka)
		setMobileSidebarOpen(true)
	}

	const handleSearchSelect = apteka => {
		setSelectedApteka(apteka)
		setMobileSidebarOpen(true)
		if (mapRef.current) {
			mapRef.current.zoomToApteka(apteka)
		}
	}

	const handleDrugSelect = async drug => {
		setSelectedDrug(drug)
		setSelectedApteka(null)

		if (!drug) {
			clearAvailability()
			return
		}

		checkDrugAvailability(drug)
	}

	return (
		<div className='flex flex-col h-screen overflow-hidden'>
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
			<div className='flex flex-1 overflow-hidden relative flex-col md:flex-row'>
				<div
					className={`
						absolute inset-0 z-20 bg-white 
						transform transition-transform duration-300 ease-in-out
						${mobileSidebarOpen ? 'translate-y-0' : 'translate-y-full'}
						md:relative md:translate-y-0 md:w-[450px] md:block md:flex-shrink-0
					`}
				>
					<div
						className='md:hidden w-full h-8 flex items-center justify-center bg-gray-50 border-t border-gray-200 absolute top-0 left-0 -mt-8 rounded-t-xl cursor-pointer shadow-lg z-30'
						onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
					>
						<div className='w-12 h-1.5 bg-gray-300 rounded-full' />
					</div>

					<button
						onClick={() => setMobileSidebarOpen(false)}
						className='md:hidden absolute top-2 right-3 z-50 p-1.5 text-gray-400 hover:text-gray-600 transition'
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-5 w-5'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={1.5}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>

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
				</div>

				<div className='flex-1 relative z-0 h-full w-full'>
					<Map
						onSelectApteka={handleMarkerClick}
						ref={mapRef}
						apteki={apteki}
						selectedDrug={selectedDrug}
						pharmaciesWithDrug={pharmaciesWithDrug}
						user={user}
					/>

					{!mobileSidebarOpen && (
						<button
							onClick={() => setMobileSidebarOpen(true)}
							className='md:hidden absolute bottom-6 right-6 z-[1000] bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-6 w-6'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M4 6h16M4 12h16M4 18h16'
								/>
							</svg>
						</button>
					)}
				</div>
			</div>

			<AuthPanel
				isOpen={authPanelOpen}
				onClose={() => setAuthPanelOpen(false)}
				mode={authMode}
				onSwitchMode={setAuthMode}
				onLoginSuccess={handleLoginSuccess}
			/>

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
