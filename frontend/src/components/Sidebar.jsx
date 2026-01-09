import { useEffect, useState, useRef } from 'react'

// Funkcja do obliczania odległości (wzór Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371 // Promień Ziemi w km
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c // Odległość w km
}

// Funkcja pomocnicza do formatowania odległości
const formatDistance = distanceInKm => {
	if (distanceInKm < 1) {
		return `${Math.round(distanceInKm * 1000)} m`
	} else {
		return `${distanceInKm.toFixed(1)} km`
	}
}

function Sidebar({
	selectedApteka,
	selectedDrug,
	apteki,
	pharmaciesWithDrug,
	onSelectApteka,
	user,
	userLocation,
	onReservationChange,
	onZaopatrzenieChange,
}) {
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
	const [editingPrice, setEditingPrice] = useState('')
	const [showAddLekModal, setShowAddLekModal] = useState(false)
	const [lekSearchQuery, setLekSearchQuery] = useState('')
	const [lekSearchResults, setLekSearchResults] = useState([])
	const [lekSuggestions, setLekSuggestions] = useState([])
	const [selectedNewLek, setSelectedNewLek] = useState(null)
	const [newLekQty, setNewLekQty] = useState(1)
	const [newLekPrice, setNewLekPrice] = useState('')
	const [ordering, setOrdering] = useState(false)
	const [globalSearchResults, setGlobalSearchResults] = useState([])
	const [searchingGlobal, setSearchingGlobal] = useState(false)

	// Sprawdź czy user jest właścicielem apteki
	const isOwner =
		user && selectedApteka && selectedApteka.wlasciciel_id === user.id

	// Zamów lek do apteki
	const handleOrderToPharmacy = async (
		drugToOrder,
		fromGlobalSearch = false
	) => {
		// Jeśli fromGlobalSearch=true, drugToOrder ma strukturę z tabeli 'leki' (id, nazwa...),
		// jeśli false, może mieć strukturę z 'zaopatrzenie' (lek_id, nazwa...).
		// Ustal lekId
		const lekId = fromGlobalSearch ? drugToOrder.id : drugToOrder.lek_id

		if (!user || !selectedApteka || !lekId) return

		setOrdering(true)
		try {
			const response = await fetch('http://localhost:5000/zamowienia', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apteka_id: selectedApteka.id,
					uzytkownik_id: user.id,
					lek_id: lekId,
					status: 'nowe',
				}),
			})

			if (!response.ok) {
				throw new Error('Błąd zamawiania')
			}

			alert('Pomyślnie złożono zapotrzebowanie na lek w tej aptece!')
		} catch (err) {
			console.error(err)
			alert('Nie udało się zamówić leku: ' + err.message)
		} finally {
			setOrdering(false)
		}
	}

	// Wyszukiwanie globalne w Sidebar, gdy brak wyników (lub w tle)
	useEffect(() => {
		// Wyczyść jeśli za krótki query
		if (drugSearchQuery.length < 2) {
			setGlobalSearchResults([])
			setSearchingGlobal(false)
			return
		}

		const timer = setTimeout(async () => {
			setSearchingGlobal(true)
			try {
				const res = await fetch(
					`http://localhost:5000/leki?search=${encodeURIComponent(
						drugSearchQuery
					)}`
				)
				const data = await res.json()
				setGlobalSearchResults(data)
			} catch (err) {
				console.error('Błąd wyszukiwania globalnego:', err)
				setGlobalSearchResults([])
			} finally {
				setSearchingGlobal(false)
			}
		}, 500) // Debounce 500ms

		return () => clearTimeout(timer)
	}, [drugSearchQuery])

	// Pobierz sugestie leków przy otwarciu modalu
	useEffect(() => {
		if (!showAddLekModal) return

		const fetchSuggestions = async () => {
			try {
				const response = await fetch(
					'http://localhost:5000/leki/suggestions'
				)
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
				const response = await fetch(
					`http://localhost:5000/rezerwacje/apteka?apteka_id=${selectedApteka.id}&user_id=${user.id}`
				)
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
				const response = await fetch(
					`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`
				)
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
	const getUserReservationForLek = lekId => {
		return userRezerwacje.find(r => r.lek_id === lekId)
	}

	// Otwórz modal rezerwacji
	const openReservationModal = lek => {
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
					ilosc: reservationQty,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd rezerwacji')
			}

			// Odśwież zaopatrzenie i rezerwacje
			const zaopatrzenieRes = await fetch(
				`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`
			)
			const zaopatrzenieData = await zaopatrzenieRes.json()
			setZaopatrzenie(zaopatrzenieData)
			setFilteredZaopatrzenie(zaopatrzenieData)

			const rezerwacjeRes = await fetch(
				`http://localhost:5000/rezerwacje/apteka?apteka_id=${selectedApteka.id}&user_id=${user.id}`
			)
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
	const handleLekSearch = async query => {
		setLekSearchQuery(query)
		if (query.length < 2) {
			setLekSearchResults(lekSuggestions)
			return
		}

		try {
			const response = await fetch(
				`http://localhost:5000/leki?search=${encodeURIComponent(query)}`
			)
			const data = await response.json()
			setLekSearchResults(data)
		} catch (err) {
			console.error('Błąd wyszukiwania leków:', err)
		}
	}

	// Zapisz zmianę ilości i ceny leku
	const saveLekChanges = async zaopatrzenieId => {
		try {
			const bodyData = { ilosc: editingQty }
			if (editingPrice !== '') {
				bodyData.cena = parseFloat(editingPrice)
			}

			const response = await fetch(
				`http://localhost:5000/zaopatrzenie/${zaopatrzenieId}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(bodyData),
				}
			)

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd aktualizacji')
			}

			// Odśwież zaopatrzenie
			const res = await fetch(
				`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`
			)
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

	// Usuń lek z apteki
	const deleteLek = async zaopatrzenieId => {
		if (!window.confirm('Czy na pewno chcesz usunąć ten lek z apteki?'))
			return

		try {
			const response = await fetch(
				`http://localhost:5000/zaopatrzenie/${zaopatrzenieId}`,
				{
					method: 'DELETE',
				}
			)

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd usuwania')
			}

			// Odśwież zaopatrzenie
			const res = await fetch(
				`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`
			)
			const data = await res.json()
			setZaopatrzenie(data)
			setFilteredZaopatrzenie(data)
			setEditingLekId(null)

			if (onZaopatrzenieChange) onZaopatrzenieChange()
		} catch (err) {
			console.error('Błąd usuwania:', err)
			alert(err.message)
		}
	}

	// Dodaj nowy lek do apteki
	const addNewLek = async () => {
		if (!selectedNewLek || !selectedApteka) return
		if (!newLekPrice || isNaN(parseFloat(newLekPrice))) {
			alert('Podaj poprawną cenę leku')
			return
		}

		try {
			const response = await fetch('http://localhost:5000/zaopatrzenie', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apteka_id: selectedApteka.id,
					lek_id: selectedNewLek.id,
					ilosc: newLekQty,
					cena: parseFloat(newLekPrice),
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd dodawania leku')
			}

			// Odśwież zaopatrzenie
			const res = await fetch(
				`http://localhost:5000/zaopatrzenie?apteka_id=${selectedApteka.id}`
			)
			const data = await res.json()
			setZaopatrzenie(data)
			setFilteredZaopatrzenie(data)

			// Resetuj modal
			setShowAddLekModal(false)
			setSelectedNewLek(null)
			setNewLekQty(1)
			setNewLekPrice('')
			setLekSearchQuery('')
			setLekSearchResults([])

			if (onZaopatrzenieChange) onZaopatrzenieChange()
			alert('Lek został dodany do oferty apteki!')
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
	// Usuń aptekę
	const deletePharmacy = async () => {
		const confirmation = window.prompt(
			`Aby usunąć aptekę "${selectedApteka.nazwa}", przepisz jej nazwę poniżej:`
		)

		if (confirmation !== selectedApteka.nazwa) {
			if (confirmation !== null) {
				alert('Niepoprawna nazwa apteki. Operacja anulowana.')
			}
			return
		}

		try {
			const response = await fetch(
				`http://localhost:5000/apteki/${selectedApteka.id}`,
				{
					method: 'DELETE',
				}
			)

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd usuwania apteki')
			}

			alert('Apteka została usunięta')
			window.location.reload()
		} catch (err) {
			console.error(err)
			alert(err.message)
		}
	}

	const handleDrugSearch = query => {
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
			return (
				nazwa.includes(lowerQuery) ||
				nazwaPowszechna.includes(lowerQuery) ||
				substancja.includes(lowerQuery)
			)
		})

		setFilteredZaopatrzenie(filtered)
		setShowDrugSearch(query.length >= 2)
	}

	// Obsługa Enter - pokaż pierwszy wynik
	const handleDrugSearchKeyDown = e => {
		if (e.key === 'Enter' && filteredZaopatrzenie.length > 0) {
			setShowDrugSearch(false)
		}
	}

	// Wybierz lek z sugestii
	const selectDrugFromSuggestion = lek => {
		setDrugSearchQuery(lek.nazwa)
		setFilteredZaopatrzenie([lek])
		setShowDrugSearch(false)
	}

	// Filtruj apteki które mają wybrany lek i oblicz odległość
	const availablePharmacies = selectedDrug
		? apteki
				.filter(a => pharmaciesWithDrug.includes(a.id))
				.map(apteka => {
					if (userLocation && apteka.lat && apteka.lon) {
						const distance = calculateDistance(
							userLocation.lat,
							userLocation.lon,
							apteka.lat,
							apteka.lon
						)
						return { ...apteka, distance }
					}
					return { ...apteka, distance: null }
				})
				.sort((a, b) => {
					if (a.distance === null && b.distance === null) return 0
					if (a.distance === null) return 1
					if (b.distance === null) return -1
					return a.distance - b.distance
				})
		: []

	return (
		<aside className='w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden'>
			{selectedApteka ? (
				<>
					<div className='sticky top-0 bg-white border-b border-gray-200 p-6 z-10'>
						<h3 className='text-lg font-semibold text-gray-900 break-words mb-1'>
							{selectedApteka.nazwa ||
								selectedApteka.wlasciciel_nazwa ||
								'Apteka'}
						</h3>
						<p className='text-sm text-gray-500 break-words'>
							{selectedApteka.wlasciciel_nazwa}
						</p>
						<p className='text-xs text-gray-400 mt-2'>
							{selectedApteka.nazwa_ulicy}
							{selectedApteka.nr_budynku
								? `, ${selectedApteka.nr_budynku}`
								: ''}
						</p>
						<p className='text-xs text-gray-400'>
							{selectedApteka.kod_pocztowy}{' '}
							{selectedApteka.miejscowosc}
						</p>
						{isOwner && (
							<div className='mt-2 flex items-center justify-between'>
								<p className='text-xs text-green-600 font-medium'>
									✓ Jesteś właścicielem tej apteki
								</p>
								<button
									onClick={deletePharmacy}
									className='text-xs text-gray-400 hover:text-red-600 transition'
									title="Usuń tę aptekę"
								>
									Usuń aptekę
								</button>
							</div>
						)}
					</div>

					<div
						ref={scrollContainerRef}
						onScroll={handleScroll}
						className='flex-1 overflow-y-auto px-2 py-4 relative'
					>
						<div className='mb-4 px-2'>
							<div className='flex items-center justify-between mb-2'>
								<h4 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
									Leki ({zaopatrzenie.length})
								</h4>
								{isOwner && (
									<button
										onClick={() => {
											setShowAddLekModal(true)
											setLekSearchResults(lekSuggestions)
										}}
										className='w-10 h-10 bg-green-600 text-green-50 rounded-full flex items-center justify-center hover:bg-green-700 transition shadow-sm'
										title='Dodaj lek'
									>
										<span className="text-2xl font-bold leading-none pb-1">+</span>
									</button>
								)}
							</div>

							{/* Searchbar dla leków w aptece */}
							<div className='relative'>
								<input
									type='text'
									placeholder='Szukaj leku w tej aptece...'
									value={drugSearchQuery}
									onChange={e =>
										handleDrugSearch(e.target.value)
									}
									onKeyDown={handleDrugSearchKeyDown}
									className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
								/>

								{/* Sugestie leków z apteki */}
								{showDrugSearch &&
									filteredZaopatrzenie.length > 0 && (
										<div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto'>
											<ul>
												{filteredZaopatrzenie
													.slice(0, 5)
													.map(lek => (
														<li
															key={lek.id}
															onClick={() =>
																selectDrugFromSuggestion(
																	lek
																)
															}
															className='px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition'
														>
															<p className='font-semibold text-gray-900 text-sm'>
																{lek.nazwa}
															</p>
															{lek.ilosc && (
																<p className='text-xs text-blue-600 mt-0.5'>
																	Dostępne:{' '}
																	{lek.ilosc}{' '}
																	szt.
																</p>
															)}
														</li>
													))}
											</ul>
										</div>
									)}
							</div>
						</div>

						{/* Panel informujący o dostępności wybranego leku (globalnego z nagłówka) - opcjonalne, skoro mamy wyszukiwarkę boczną */}
						{/* Usunięto na rzecz logiki z wyszukiwarki bocznej */}

						{loading && (
							<p className='text-sm text-gray-500 px-2'>
								Ładowanie...
							</p>
						)}

						{!loading &&
							zaopatrzenie.length === 0 &&
							!drugSearchQuery && (
								<p className='text-sm text-gray-400 px-2'>
									Brak leków w zaopatrzeniu
								</p>
							)}

						{!loading &&
							filteredZaopatrzenie.length === 0 &&
							drugSearchQuery && (
								<div className='mb-4'>
									<p className='text-sm text-red-500 px-2 mb-2 font-medium'>
										Brak wyników w magazynie apteki.
									</p>

									{searchingGlobal ? (
										<p className='text-xs text-gray-500 px-2 animate-pulse'>
											Szukam w bazie ogólnej...
										</p>
									) : (
										globalSearchResults.length > 0 && (
											<div className='mx-2 border-t pt-2'>
												<p className='text-xs text-gray-500 mb-2 font-semibold'>
													Możesz zamówić lek spoza
													apteki:
												</p>
												<ul className='space-y-3'>
													{globalSearchResults.map(
														lek => (
															<li
																key={lek.id}
																className='bg-red-50 border border-red-200 rounded-lg p-3'
															>
																<p className='font-bold text-gray-800 text-sm'>
																	{lek.nazwa}
																</p>
																<div className='text-xs text-gray-600 mt-1'>
																	{lek.substancja && (
																		<span>
																			{
																				lek.substancja
																			}
																		</span>
																	)}
																	{lek.moc && (
																		<span>
																			,{' '}
																			{
																				lek.moc
																			}
																		</span>
																	)}
																</div>

																{user ? (
																	!isOwner && (
																		<button
																			onClick={() =>
																				handleOrderToPharmacy(
																					lek,
																					true
																				)
																			}
																			disabled={
																				ordering
																			}
																			className='mt-2 w-full py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition'
																		>
																			{ordering
																				? 'Zamawianie...'
																				: 'Zamów do tej apteki'}
																		</button>
																	)
																) : (
																	<p className='text-xs text-red-400 italic mt-2'>
																		Zaloguj
																		się, aby
																		zamówić
																	</p>
																)}
															</li>
														)
													)}
												</ul>
											</div>
										)
									)}

									{!searchingGlobal &&
										globalSearchResults.length === 0 &&
										drugSearchQuery.length >= 2 && (
											<p className='text-xs text-gray-400 px-2 italic'>
												Brak leków w bazie ogólnej dla "
												{drugSearchQuery}"
											</p>
										)}
								</div>
							)}

						{!loading && filteredZaopatrzenie.length > 0 && (
							<ul className='space-y-4'>
								{filteredZaopatrzenie.map(lek => {
									const userReservation =
										getUserReservationForLek(lek.lek_id)
									return (
										<li
											key={lek.id}
											className={`bg-white border-2 rounded-xl p-4 transition mx-2 shadow-sm ${
												lek.ilosc === 0
													? 'border-red-500'
													: 'border-gray-400 hover:border-blue-400 hover:shadow-md'
											}`}
										>
											<p className='font-bold text-gray-900 text-base break-words leading-snug'>
												{lek.nazwa || 'Nieznany lek'}
											</p>

											<div className='mt-2 space-y-2 text-sm'>
												{lek.nazwa_powszechna && (
													<div className='flex flex-col'>
														<span className='text-gray-600 font-bold text-xs uppercase tracking-wide'>
															Nazwa powszechna
														</span>
														<span className='text-gray-800 mt-1.5 leading-relaxed'>
															{
																lek.nazwa_powszechna
															}
														</span>
													</div>
												)}

												{lek.substancja && (
													<>
														<div className='border-t-2 border-gray-300 pt-4'>
															<span className='text-gray-600 font-bold text-xs uppercase tracking-wide'>
																Substancja
																czynna
															</span>
															<span className='text-gray-800 block mt-1.5 font-medium'>
																{lek.substancja}
															</span>
														</div>
													</>
												)}

												{lek.moc && (
													<>
														<div className='border-t-2 border-gray-300 pt-4'>
															<span className='text-gray-600 font-bold text-xs uppercase tracking-wide'>
																Moc opakowania
															</span>
															<span className='text-gray-800 block mt-1.5 font-medium'>
																{lek.moc}
															</span>
														</div>
													</>
												)}
											</div>

											<div className='mt-2 pt-2 border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 rounded flex items-center justify-between font-semibold text-xs'>
												<span className='text-gray-700 truncate'>
													Dostępna ilość:
												</span>
												<div className='flex flex-col items-end'>
													<span className='text-blue-700 font-bold'>
														{lek.ilosc} szt.
													</span>
													{lek.cena && (
														<span className='text-green-700 font-bold text-sm'>
															{parseFloat(
																lek.cena
															).toFixed(2)}{' '}
															PLN
														</span>
													)}
												</div>
											</div>

											{/* Panel dla właściciela - edycja ilości i ceny */}
											{isOwner ? (
												editingLekId === lek.id ? (
													<div className='mt-2 flex flex-col gap-2'>
														<label className='text-xs font-bold text-gray-600'>
															Ilość:
														</label>
														<input
															type='number'
															min='0'
															max='9999'
															value={editingQty}
															onChange={e =>
																setEditingQty(
																	Math.max(
																		0,
																		parseInt(
																			e
																				.target
																				.value
																		) || 0
																	)
																)
															}
															className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
														/>
														<label className='text-xs font-bold text-gray-600'>
															Cena (PLN):
														</label>
														<input
															type='number'
															min='0'
															step='0.01'
															value={editingPrice}
															onChange={e =>
																setEditingPrice(
																	e.target
																		.value
																)
															}
															className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
															placeholder='0.00'
														/>
														<div className='flex flex-col gap-2 w-full mt-2'>
															<button
																onClick={() =>
																	saveLekChanges(
																		lek.id
																	)
																}
																className='w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700'
															>
																Zapisz
															</button>
															<button
																onClick={() =>
																	setEditingLekId(
																		null
																	)
																}
																className='w-full px-3 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50'
															>
																Anuluj
															</button>
															<button
																onClick={() =>
																	deleteLek(
																		lek.id
																	)
																}
																className='w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 mt-1'
															>
																Usuń lek
															</button>
														</div>
													</div>
												) : (
													<button
														onClick={() => {
															setEditingLekId(
																lek.id
															)
															setEditingQty(
																lek.ilosc
															)
															setEditingPrice(
																lek.cena || ''
															)
														}}
														className='mt-2 w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition'
													>
														Edytuj
													</button>
												)
											) : /* Przycisk rezerwacji lub info o rezerwacji - dla klientów */
											userReservation ? (
												<div className='mt-2 px-3 py-2 bg-green-100 border border-green-300 rounded text-xs text-green-700 font-medium'>
													✓ Zarezerwowano:{' '}
													{userReservation.ilosc} szt.
												</div>
											) : user && lek.ilosc > 0 ? (
												<button
													onClick={() =>
														openReservationModal(
															lek
														)
													}
													className='mt-2 w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition'
												>
													Zarezerwuj lek
												</button>
											) : !user && lek.ilosc > 0 ? (
												<p className='mt-2 text-xs text-gray-500 text-center'>
													Zaloguj się, aby
													zarezerwować
												</p>
											) : null}
										</li>
									)
								})}
							</ul>
						)}

						{/* Przycisk scroll-to-top */}
						{showScrollTop && (
							<button
								onClick={scrollToTop}
								className='fixed bottom-6 left-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition z-50 hover:scale-105 transform'
								title='Przewiń do góry'
							>
								<span className="text-2xl font-bold mb-1">↑</span>
							</button>
						)}
					</div>
				</>
			) : selectedDrug ? (
				<div className='flex-1 overflow-y-auto px-2 py-4'>
					<h4 className='text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide px-2'>
						Dostępny w {availablePharmacies.length} aptekach
					</h4>
					{availablePharmacies.length === 0 ? (
						<div className='p-4 text-center text-gray-500'>
							<p className='text-sm'>
								Brak aptek z tym lekiem w bazie danych
							</p>
						</div>
					) : (
						<ul className='space-y-3'>
							{availablePharmacies.map(apteka => (
								<li
									key={apteka.id}
									className='bg-white border-2 border-green-400 rounded-xl p-4 hover:border-green-600 hover:shadow-md transition mx-2 cursor-pointer'
									onClick={() => onSelectApteka(apteka)}
								>
									<div className='flex justify-between items-start'>
										<h3 className='text-base font-bold text-gray-900 break-words mb-1'>
											{apteka.nazwa ||
												apteka.wlasciciel_nazwa ||
												'Apteka'}
										</h3>
										{apteka.distance !== null && (
											<span className='text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2 flex-shrink-0'>
												{formatDistance(
													apteka.distance
												)}
											</span>
										)}
									</div>
									<p className='text-xs text-gray-600 mt-2'>
										{apteka.nazwa_ulicy}
										{apteka.nr_budynku
											? `, ${apteka.nr_budynku}`
											: ''}
									</p>
									<p className='text-xs text-gray-600'>
										{apteka.kod_pocztowy}{' '}
										{apteka.miejscowosc}
									</p>
								</li>
							))}
						</ul>
					)}
				</div>
			) : (
				<div className='flex-1 flex items-center justify-center p-6'>
					<div className='text-center'>
						<svg
							className='w-12 h-12 text-gray-300 mx-auto mb-3'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
							/>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
							/>
						</svg>
						<h3 className='text-base font-semibold text-gray-900 mb-2'>
							Wybierz aptekę lub lek
						</h3>
						<p className='text-sm text-gray-500'>
							Kliknij na pineskę na mapie lub wyszukaj lek
						</p>
					</div>
				</div>
			)}

			{/* Modal rezerwacji */}
			{reservationModal && (
				<>
					<div
						className='fixed inset-0 bg-black/50 z-[9998]'
						onClick={() => setReservationModal(null)}
					/>
					<div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[9999] w-80'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Rezerwacja leku
						</h3>
						<p className='text-sm text-gray-600 mb-4'>
							{reservationModal.lek.nazwa}
						</p>

						<div className='mb-4'>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Ilość (max: {reservationModal.maxIlosc})
							</label>
							<input
								type='number'
								min='1'
								max={reservationModal.maxIlosc}
								value={reservationQty}
								onChange={e =>
									setReservationQty(
										Math.min(
											Math.max(
												1,
												parseInt(e.target.value) || 1
											),
											reservationModal.maxIlosc
										)
									)
								}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
							/>
						</div>

						<p className='text-xs text-gray-500 mb-4'>
							Rezerwacja ważna przez 24 godziny
						</p>

						<div className='flex gap-3'>
							<button
								onClick={() => setReservationModal(null)}
								className='flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
							>
								Anuluj
							</button>
							<button
								onClick={confirmReservation}
								className='flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
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
						className='fixed inset-0 bg-black/50 z-[9998]'
						onClick={() => {
							setShowAddLekModal(false)
							setSelectedNewLek(null)
							setLekSearchQuery('')
						}}
					/>
					<div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[9999] w-96 max-h-[80vh] overflow-hidden flex flex-col'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Dodaj lek do apteki
						</h3>

						{!selectedNewLek ? (
							<>
								<input
									type='text'
									placeholder='Szukaj leku...'
									value={lekSearchQuery}
									onChange={e =>
										handleLekSearch(e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 mb-3'
								/>

								<div className='flex-1 overflow-y-auto max-h-64'>
									{(lekSearchQuery.length >= 2
										? lekSearchResults
										: lekSuggestions
									).length > 0 ? (
										<ul className='space-y-2'>
											{(lekSearchQuery.length >= 2
												? lekSearchResults
												: lekSuggestions
											).map(lek => (
												<li
													key={lek.id}
													onClick={() =>
														setSelectedNewLek(lek)
													}
													className='p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition'
												>
													<p className='font-medium text-gray-900 text-sm'>
														{lek.nazwa}
													</p>
													{lek.moc && (
														<p className='text-xs text-gray-500'>
															{lek.moc}
														</p>
													)}
												</li>
											))}
										</ul>
									) : (
										<p className='text-sm text-gray-500 text-center py-4'>
											Wpisz nazwę leku, aby wyszukać
										</p>
									)}
								</div>

								<button
									onClick={() => setShowAddLekModal(false)}
									className='mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
								>
									Anuluj
								</button>
							</>
						) : (
							<>
								<div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
									<p className='font-medium text-gray-900'>
										{selectedNewLek.nazwa}
									</p>
									{selectedNewLek.moc && (
										<p className='text-xs text-gray-500'>
											{selectedNewLek.moc}
										</p>
									)}
								</div>

								<div className='mb-4 flex gap-4'>
									<div className='flex-1'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Ilość (max: 100)
										</label>
										<input
											type='number'
											min='1'
											max='100'
											value={newLekQty}
											onChange={e =>
												setNewLekQty(
													Math.min(
														Math.max(
															1,
															parseInt(
																e.target.value
															) || 1
														),
														100
													)
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
										/>
									</div>
									<div className='flex-1'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Cena (PLN)
										</label>
										<input
											type='number'
											min='0'
											step='0.01'
											placeholder='0.00'
											value={newLekPrice}
											onChange={e =>
												setNewLekPrice(e.target.value)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
										/>
									</div>
								</div>

								<div className='flex gap-3'>
									<button
										onClick={() => setSelectedNewLek(null)}
										className='flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
									>
										Wróć
									</button>
									<button
										onClick={addNewLek}
										className='flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition'
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
