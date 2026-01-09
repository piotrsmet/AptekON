import { useState, useEffect } from 'react'
import { API_URL } from '../config'

function ProfilePanel({
	isOpen,
	onClose,
	user,
	onReservationChange,
	onAptekaAdded,
}) {
	const [activeTab, setActiveTab] = useState('zamowienia')
	const [rezerwacje, setRezerwacje] = useState([])
	const [loadingRezerwacje, setLoadingRezerwacje] = useState(false)
	const [zamowienia, setZamowienia] = useState([])
	const [loadingZamowienia, setLoadingZamowienia] = useState(false)
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
		email: '',
	})
	const [addingApteka, setAddingApteka] = useState(false)

	const [selectedAptekaForManage, setSelectedAptekaForManage] = useState(null)
	const [aptekaZamowienia, setAptekaZamowienia] = useState([])
	const [aptekaRezerwacje, setAptekaRezerwacje] = useState([])
	const [loadingAptekaData, setLoadingAptekaData] = useState(false)
	const [ownerSubTab, setOwnerSubTab] = useState('zamowienia')

	useEffect(() => {
		if (!isOpen || !user) {
			setRezerwacje([])
			setMojeApteki([])
			return
		}

		const fetchRezerwacje = async () => {
			setLoadingRezerwacje(true)
			try {
				const response = await fetch(
					`${API_URL}/rezerwacje?user_id=${user.id}`
				)
				const data = await response.json()
				setRezerwacje(data)
			} catch (err) {
				console.error('Błąd pobierania rezerwacji:', err)
				setRezerwacje([])
			} finally {
				setLoadingRezerwacje(false)
			}
		}

		const fetchZamowienia = async () => {
			setLoadingZamowienia(true)
			try {
				const response = await fetch(
					`${API_URL}/zamowienia?uzytkownik_id=${user.id}`
				)
				const data = await response.json()
				setZamowienia(data)
			} catch (err) {
				console.error('Błąd pobierania zamówień:', err)
				setZamowienia([])
			} finally {
				setLoadingZamowienia(false)
			}
		}

		const fetchMojeApteki = async () => {
			setLoadingApteki(true)
			try {
				const response = await fetch(`${API_URL}/apteki`)
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
		fetchZamowienia()
		fetchMojeApteki()
	}, [isOpen, user])

	const handleAddApteka = async e => {
		e.preventDefault()
		if (
			!aptekaForm.nazwa ||
			!aptekaForm.miejscowosc ||
			!aptekaForm.nazwa_ulicy
		) {
			alert('Wypełnij wymagane pola: nazwa, miejscowość, ulica')
			return
		}

		setAddingApteka(true)
		try {
			const response = await fetch(`${API_URL}/apteki`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...aptekaForm,
					wlasciciel_id: user.id,
					wlasciciel_nazwa: user.email,
				}),
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
				email: '',
			})

			const response2 = await fetch(`${API_URL}/apteki`)
			const data2 = await response2.json()
			setMojeApteki(data2.filter(a => a.wlasciciel_id === user.id))

			if (onAptekaAdded) onAptekaAdded()
		} catch (err) {
			console.error('Błąd dodawania apteki:', err)
			alert(err.message)
		} finally {
			setAddingApteka(false)
		}
	}

	const cancelRezerwacja = async rezerwacjaId => {
		if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) return

		try {
			const response = await fetch(
				`${API_URL}/rezerwacje/${rezerwacjaId}`,
				{
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ user_id: user.id }),
				}
			)

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd anulowania')
			}

			setRezerwacje(rezerwacje.filter(r => r.id !== rezerwacjaId))

			if (onReservationChange) onReservationChange()
		} catch (err) {
			console.error('Błąd anulowania:', err)
			alert(err.message)
		}
	}

	const deleteApteka = async (aptekaId, aptekaNazwa) => {
		const confirmation = window.prompt(
			`Aby usunąć aptekę "${aptekaNazwa}", przepisz jej nazwę poniżej:`
		)

		if (confirmation !== aptekaNazwa) {
			if (confirmation !== null) {
				alert('Niepoprawna nazwa apteki. Operacja anulowana.')
			}
			return
		}

		try {
			const response = await fetch(`${API_URL}/apteki/${aptekaId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Błąd usuwania apteki')
			}

			setMojeApteki(mojeApteki.filter(a => a.id !== aptekaId))

			if (onAptekaAdded) onAptekaAdded()
		} catch (err) {
			console.error('Błąd usuwania apteki:', err)
			alert(err.message)
		}
	}

	const formatDate = dateString => {
		const date = new Date(dateString)
		return date.toLocaleString('pl-PL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const fetchAptekaData = async aptekaId => {
		setLoadingAptekaData(true)
		try {
			const [zamRes, rezRes] = await Promise.all([
				fetch(`${API_URL}/zamowienia?apteka_id=${aptekaId}`),
				fetch(
					`${API_URL}/rezerwacje/apteka?apteka_id=${aptekaId}&owner=true`
				),
			])
			const zamData = await zamRes.json()
			const rezData = await rezRes.json()
			setAptekaZamowienia(zamData)
			setAptekaRezerwacje(rezData)
		} catch (err) {
			console.error('Błąd pobierania danych apteki:', err)
			setAptekaZamowienia([])
			setAptekaRezerwacje([])
		} finally {
			setLoadingAptekaData(false)
		}
	}

	const selectAptekaForManage = apteka => {
		setSelectedAptekaForManage(apteka)
		fetchAptekaData(apteka.id)
	}

	const updateZamowienieStatus = async (zamowienieId, newStatus) => {
		try {
			const response = await fetch(
				`${API_URL}/zamowienia/${zamowienieId}/status`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: newStatus }),
				}
			)

			if (!response.ok) {
				throw new Error('Błąd aktualizacji')
			}

			setAptekaZamowienia(
				aptekaZamowienia.map(z =>
					z.id === zamowienieId ? { ...z, status: newStatus } : z
				)
			)
		} catch (err) {
			console.error('Błąd zmiany statusu:', err)
			alert(err.message)
		}
	}

	return (
		<>
			{/* Overlay */}
			<div
				className={`fixed inset-0 bg-black/50 transition-opacity z-[9998] ${
					isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl transform transition-transform duration-300 z-[9999] ${
					isOpen ? 'translate-x-0' : 'translate-x-full'
				}`}
			>
				<div className='flex flex-col h-full'>
					{/* Header */}
					<div className='flex items-center justify-between p-6 bg-blue-600'>
						<div>
							<h2 className='text-xl font-semibold text-white'>
								Profil
							</h2>
							<p className='text-sm text-blue-100 mt-1'>
								{user?.email}
							</p>
						</div>
						<button
							onClick={onClose}
							className='p-2 hover:bg-blue-500 rounded-lg transition'
						>
							<svg
								className='w-5 h-5 text-white'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>

					{/* Tabs */}
					<div className='flex flex-col border-b border-gray-200 gap-3 px-6 mt-6 pb-6'>
						{mojeApteki.length > 0 && (
							<button
								onClick={() => setActiveTab('panelWlasciciela')}
								className={`w-full py-4 text-sm font-bold rounded-xl transition shadow-sm border-2 ${
									activeTab === 'panelWlasciciela'
										? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
										: 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
								}`}
							>
								Panel właściciela
							</button>
						)}
						<button
							onClick={() => setActiveTab('zamowienia')}
							className={`w-full py-4 text-sm font-bold rounded-xl transition shadow-sm border-2 ${
								activeTab === 'zamowienia'
									? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
									: 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
							}`}
						>
							Zamówienia
						</button>
						<button
							onClick={() => setActiveTab('rezerwacje')}
							className={`w-full py-4 text-sm font-bold rounded-xl transition shadow-sm border-2 ${
								activeTab === 'rezerwacje'
									? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
									: 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
							}`}
						>
							Rezerwacje
						</button>
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-6'>
						{/* PANEL WŁAŚCICIELA */}
						{activeTab === 'panelWlasciciela' && (
							<div>
								{!selectedAptekaForManage ? (
									<>
										<div className='mb-6'>
											<h3 className='text-lg font-bold text-gray-900 mb-1'>
												Twoje apteki
											</h3>
											<p className='text-sm text-gray-500'>
												Wybierz aptekę, którą chcesz
												zarządzać
											</p>
										</div>
										<ul className='space-y-3'>
											{mojeApteki.map(apteka => (
												<li
													key={apteka.id}
													onClick={() =>
														selectAptekaForManage(
															apteka
														)
													}
													className='p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl cursor-pointer hover:border-green-400 hover:shadow-md transition-all group'
												>
													<div className='flex items-center justify-between'>
														<div>
															<p className='font-bold text-gray-900 group-hover:text-green-700 transition'>
																{apteka.nazwa}
															</p>
															<p className='text-sm text-gray-600 mt-1'>
																{
																	apteka.nazwa_ulicy
																}
																{apteka.nr_budynku
																	? ` ${apteka.nr_budynku}`
																	: ''}
																,{' '}
																{
																	apteka.miejscowosc
																}
															</p>
														</div>
														<svg
															className='w-5 h-5 text-gray-400 group-hover:text-green-600 transition'
															fill='none'
															stroke='currentColor'
															viewBox='0 0 24 24'
														>
															<path
																strokeLinecap='round'
																strokeLinejoin='round'
																strokeWidth={2}
																d='M9 5l7 7-7 7'
															/>
														</svg>
													</div>
												</li>
											))}
										</ul>
									</>
								) : (
									<>
										{/* Header wybranej apteki */}
										<div className='flex items-center gap-3 mb-6 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl'>
											<button
												onClick={() =>
													setSelectedAptekaForManage(
														null
													)
												}
												className='p-2 bg-white hover:bg-gray-50 rounded-lg transition shadow-sm'
											>
												<svg
													className='w-5 h-5 text-gray-600'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M15 19l-7-7 7-7'
													/>
												</svg>
											</button>
											<div className='flex-1'>
												<h3 className='text-lg font-bold text-green-800'>
													{
														selectedAptekaForManage.nazwa
													}
												</h3>
												<p className='text-sm text-green-600'>
													{
														selectedAptekaForManage.nazwa_ulicy
													}
													{selectedAptekaForManage.nr_budynku
														? ` ${selectedAptekaForManage.nr_budynku}`
														: ''}
													,{' '}
													{
														selectedAptekaForManage.miejscowosc
													}
												</p>
											</div>
										</div>

										{/* Sub-tabs */}
										<div className='flex gap-2 mb-5'>
											<button
												onClick={() =>
													setOwnerSubTab('zamowienia')
												}
												className={`flex-1 py-3 text-sm font-bold rounded-xl transition shadow-sm ${
													ownerSubTab === 'zamowienia'
														? 'bg-green-600 text-white shadow-green-200'
														: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
												}`}
											>
												📦 Zamówienia (
												{aptekaZamowienia.length})
											</button>
											<button
												onClick={() =>
													setOwnerSubTab('rezerwacje')
												}
												className={`flex-1 py-3 text-sm font-bold rounded-xl transition shadow-sm ${
													ownerSubTab === 'rezerwacje'
														? 'bg-green-600 text-white shadow-green-200'
														: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
												}`}
											>
												📋 Rezerwacje (
												{aptekaRezerwacje.length})
											</button>
										</div>

										{loadingAptekaData && (
											<p className='text-sm text-gray-500'>
												Ładowanie...
											</p>
										)}

										{/* Zamówienia w aptece */}
										{!loadingAptekaData &&
											ownerSubTab === 'zamowienia' && (
												<div>
													{aptekaZamowienia.length ===
													0 ? (
														<div className='text-center py-12'>
															<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
																<span className='text-3xl'>
																	📦
																</span>
															</div>
															<p className='text-gray-500 font-medium'>
																Brak zamówień
															</p>
															<p className='text-sm text-gray-400 mt-1'>
																Zamówienia
																klientów pojawią
																się tutaj
															</p>
														</div>
													) : (
														<ul className='space-y-4'>
															{aptekaZamowienia.map(
																zam => (
																	<li
																		key={
																			zam.id
																		}
																		className='bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition'
																	>
																		<div className='flex justify-between items-start'>
																			<div>
																				<p className='font-bold text-gray-900 text-lg'>
																					{
																						zam.lek_nazwa
																					}
																				</p>
																				{zam.lek_moc && (
																					<p className='text-sm text-gray-500'>
																						{
																							zam.lek_moc
																						}
																					</p>
																				)}
																			</div>
																			<span
																				className={`px-3 py-1 text-xs font-bold rounded-full ${
																					zam.status ===
																					'zrealizowane'
																						? 'bg-green-100 text-green-700'
																						: zam.status ===
																						  'anulowane'
																						? 'bg-red-100 text-red-700'
																						: zam.status ===
																						  'w_realizacji'
																						? 'bg-yellow-100 text-yellow-700'
																						: 'bg-blue-100 text-blue-700'
																				}`}
																			>
																				{zam.status ===
																				'w_realizacji'
																					? 'W realizacji'
																					: zam.status ||
																					  'nowe'}
																			</span>
																		</div>

																		<div className='mt-3 p-3 bg-gray-50 rounded-lg'>
																			<p className='text-sm text-gray-700'>
																				<span className='font-semibold'>
																					👤
																					Klient:
																				</span>{' '}
																				{
																					zam.uzytkownik_email
																				}
																			</p>
																			<p className='text-xs text-gray-400 mt-1'>
																				🕐{' '}
																				{formatDate(
																					zam.data_zamowienia
																				)}
																			</p>
																		</div>

																		{zam.status !==
																			'zrealizowane' &&
																			zam.status !==
																				'anulowane' && (
																				<div className='flex gap-3 mt-4'>
																					{zam.status ===
																						'nowe' && (
																						<button
																							onClick={() =>
																								updateZamowienieStatus(
																									zam.id,
																									'w_realizacji'
																								)
																							}
																							className='flex-1 py-2 text-sm font-bold bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition hover:shadow-md active:scale-95 transform duration-150'
																						>
																							✓
																							Przyjmij
																						</button>
																					)}
																					{zam.status ===
																						'w_realizacji' && (
																						<button
																							onClick={() =>
																								updateZamowienieStatus(
																									zam.id,
																									'zrealizowane'
																								)
																							}
																							className='flex-1 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition hover:shadow-md active:scale-95 transform duration-150'
																						>
																							✓
																							Zrealizowano
																						</button>
																					)}
																					<button
																						onClick={() =>
																							updateZamowienieStatus(
																								zam.id,
																								'anulowane'
																							)
																						}
																						className='flex-1 py-2 text-sm font-bold border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition hover:shadow-sm active:scale-95 transform duration-150'
																					>
																						✕
																						Anuluj
																					</button>
																				</div>
																			)}
																	</li>
																)
															)}
														</ul>
													)}
												</div>
											)}

										{/* Rezerwacje w aptece */}
										{!loadingAptekaData &&
											ownerSubTab === 'rezerwacje' && (
												<div>
													{aptekaRezerwacje.length ===
													0 ? (
														<div className='text-center py-12'>
															<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
																<span className='text-3xl'>
																	📋
																</span>
															</div>
															<p className='text-gray-500 font-medium'>
																Brak aktywnych
																rezerwacji
															</p>
															<p className='text-sm text-gray-400 mt-1'>
																Rezerwacje
																klientów pojawią
																się tutaj
															</p>
														</div>
													) : (
														<ul className='space-y-4'>
															{aptekaRezerwacje.map(
																rez => (
																	<li
																		key={
																			rez.id
																		}
																		className='bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition'
																	>
																		<div className='flex justify-between items-start'>
																			<div>
																				<p className='font-bold text-gray-900 text-lg'>
																					{
																						rez.lek_nazwa
																					}
																				</p>
																				{rez.lek_moc && (
																					<p className='text-sm text-gray-500'>
																						{
																							rez.lek_moc
																						}
																					</p>
																				)}
																			</div>
																			<span className='px-3 py-1.5 text-sm font-bold rounded-full bg-blue-100 text-blue-700'>
																				{
																					rez.ilosc
																				}{' '}
																				szt.
																			</span>
																		</div>

																		<div className='mt-3 p-3 bg-gray-50 rounded-lg'>
																			<p className='text-sm text-gray-700'>
																				<span className='font-semibold'>
																					👤
																					Klient:
																				</span>{' '}
																				{
																					rez.uzytkownik_email
																				}
																			</p>
																			<p className='text-xs text-orange-600 font-medium mt-1'>
																				⏰
																				Wygasa:{' '}
																				{formatDate(
																					rez.data_wygasniecia
																				)}
																			</p>
																		</div>
																	</li>
																)
															)}
														</ul>
													)}
												</div>
											)}
									</>
								)}
							</div>
						)}

						{activeTab === 'zamowienia' && (
							<div>
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Twoje zamówienia
								</h3>

								{loadingZamowienia && (
									<p className='text-sm text-gray-500'>
										Ładowanie...
									</p>
								)}

								{!loadingZamowienia &&
									zamowienia.length === 0 && (
										<div className='text-center py-12'>
											<svg
												className='w-16 h-16 text-gray-300 mx-auto mb-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={1.5}
													d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
												/>
											</svg>
											<p className='text-gray-500'>
												Brak zamówień
											</p>
											<p className='text-sm text-gray-400 mt-1'>
												Gdy zamówisz lek, pojawi się on
												tutaj
											</p>
										</div>
									)}

								{!loadingZamowienia &&
									zamowienia.length > 0 && (
										<ul className='space-y-4'>
											{zamowienia.map(zam => (
												<li
													key={zam.id}
													className='bg-gray-50 border border-gray-200 rounded-lg p-4'
												>
													<p className='font-semibold text-gray-900'>
														{zam.lek_nazwa ||
															'Nieznany lek'}
													</p>
													{zam.lek_moc && (
														<p className='text-xs text-gray-500'>
															{zam.lek_moc}
														</p>
													)}

													<div className='mt-2 text-sm text-gray-600'>
														<p>
															<span className='font-medium'>
																Apteka:
															</span>{' '}
															{zam.apteka_nazwa ||
																'Nieznana apteka'}
														</p>
														<p className='text-xs text-gray-500'>
															{zam.nazwa_ulicy}
															{zam.nr_budynku
																? ` ${zam.nr_budynku}`
																: ''}
															, {zam.miejscowosc}
														</p>
													</div>

													<div className='mt-2 flex items-center gap-2'>
														<span
															className={`px-2 py-1 text-xs font-medium rounded-full ${
																zam.status ===
																'zrealizowane'
																	? 'bg-green-100 text-green-700'
																	: zam.status ===
																	  'anulowane'
																	? 'bg-red-100 text-red-700'
																	: 'bg-blue-100 text-blue-700'
															}`}
														>
															{zam.status ||
																'nowe'}
														</span>
													</div>
												</li>
											))}
										</ul>
									)}
							</div>
						)}

						{activeTab === 'rezerwacje' && (
							<div>
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Twoje rezerwacje
								</h3>

								{loadingRezerwacje && (
									<p className='text-sm text-gray-500'>
										Ładowanie...
									</p>
								)}

								{!loadingRezerwacje &&
									rezerwacje.length === 0 && (
										<div className='text-center py-12'>
											<svg
												className='w-16 h-16 text-gray-300 mx-auto mb-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={1.5}
													d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
												/>
											</svg>
											<p className='text-gray-500'>
												Brak rezerwacji
											</p>
											<p className='text-sm text-gray-400 mt-1'>
												Twoje rezerwacje pojawią się
												tutaj
											</p>
										</div>
									)}

								{!loadingRezerwacje &&
									rezerwacje.length > 0 && (
										<ul className='space-y-4'>
											{rezerwacje.map(rez => (
												<li
													key={rez.id}
													className='bg-gray-50 border border-gray-200 rounded-lg p-4'
												>
													<p className='font-semibold text-gray-900'>
														{rez.lek_nazwa}
													</p>
													{rez.lek_moc && (
														<p className='text-xs text-gray-500'>
															{rez.lek_moc}
														</p>
													)}

													<div className='mt-2 text-sm text-gray-600'>
														<p>
															<span className='font-medium'>
																Ilość:
															</span>{' '}
															{rez.ilosc} szt.
														</p>
														<p>
															<span className='font-medium'>
																Apteka:
															</span>{' '}
															{rez.apteka_nazwa}
														</p>
														<p className='text-xs text-gray-500'>
															{rez.nazwa_ulicy}
															{rez.nr_budynku
																? `, ${rez.nr_budynku}`
																: ''}
															, {rez.miejscowosc}
														</p>
													</div>

													<p className='mt-2 text-xs text-orange-600'>
														Wygasa:{' '}
														{formatDate(
															rez.data_wygasniecia
														)}
													</p>

													<button
														onClick={() =>
															cancelRezerwacja(
																rez.id
															)
														}
														className='mt-3 w-full py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition'
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
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Twoje apteki
								</h3>

								{loadingApteki && (
									<p className='text-sm text-gray-500'>
										Ładowanie...
									</p>
								)}

								{!loadingApteki && mojeApteki.length === 0 && (
									<div className='text-center py-12'>
										<svg
											className='w-16 h-16 text-gray-300 mx-auto mb-4'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={1.5}
												d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
											/>
										</svg>
										<p className='text-gray-500'>
											Nie masz jeszcze aptek
										</p>
										<p className='text-sm text-gray-400 mt-1'>
											Dodaj aptekę poniżej
										</p>
									</div>
								)}

								{!loadingApteki && mojeApteki.length > 0 && (
									<ul className='space-y-4'>
										{mojeApteki.map(apteka => (
											<li
												key={apteka.id}
												className='bg-gray-50 border border-gray-200 rounded-lg p-4'
											>
												<div className='flex justify-between items-start'>
													<div>
														<p className='font-semibold text-gray-900'>
															{apteka.nazwa}
														</p>
														<p className='text-sm text-gray-600 mt-1'>
															{apteka.nazwa_ulicy}
															{apteka.nr_budynku
																? ` ${apteka.nr_budynku}`
																: ''}
														</p>
														<p className='text-sm text-gray-500'>
															{apteka.kod_pocztowy &&
																`${apteka.kod_pocztowy} `}
															{apteka.miejscowosc}
														</p>
														{apteka.telefon && (
															<p className='text-sm text-gray-500 mt-1'>
																Tel:{' '}
																{apteka.telefon}
															</p>
														)}
													</div>
													<div className='flex items-center gap-2'>
														<button
															onClick={() =>
																selectAptekaForManage(
																	apteka
																)
															}
															className='px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200 transition'
														>
															Zarządzaj
														</button>
														<button
															onClick={() =>
																deleteApteka(
																	apteka.id,
																	apteka.nazwa
																)
															}
															className='p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition'
															title='Usuń aptekę'
														>
															<svg
																className='w-5 h-5'
																fill='none'
																stroke='currentColor'
																viewBox='0 0 24 24'
															>
																<path
																	strokeLinecap='round'
																	strokeLinejoin='round'
																	strokeWidth={
																		2
																	}
																	d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
																/>
															</svg>
														</button>
													</div>
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						)}
					</div>

					{/* Przycisk dodawania apteki */}
					<div className='p-4 border-t border-gray-200'>
						<button
							onClick={() => setShowAddApteka(true)}
							className='w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2'
						>
							<svg
								className='w-5 h-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 4v16m8-8H4'
								/>
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
						className='fixed inset-0 bg-black/50 z-[10000]'
						onClick={() => setShowAddApteka(false)}
					/>
					<div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[10001] w-96 max-h-[90vh] overflow-y-auto'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-semibold text-gray-900'>
								Dodaj własną aptekę
							</h3>
							<button
								onClick={() => setShowAddApteka(false)}
								className='p-1 hover:bg-gray-100 rounded-lg transition'
							>
								<svg
									className='w-5 h-5 text-gray-500'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>

						<form onSubmit={handleAddApteka} className='space-y-3'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Nazwa apteki *
								</label>
								<input
									type='text'
									value={aptekaForm.nazwa}
									onChange={e =>
										setAptekaForm({
											...aptekaForm,
											nazwa: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
									placeholder='Apteka Pod Orłem'
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Miejscowość *
								</label>
								<input
									type='text'
									value={aptekaForm.miejscowosc}
									onChange={e =>
										setAptekaForm({
											...aptekaForm,
											miejscowosc: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
									placeholder='Warszawa'
									required
								/>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Ulica *
									</label>
									<input
										type='text'
										value={aptekaForm.nazwa_ulicy}
										onChange={e =>
											setAptekaForm({
												...aptekaForm,
												nazwa_ulicy: e.target.value,
											})
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
										placeholder='Marszałkowska'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Nr budynku
									</label>
									<input
										type='text'
										value={aptekaForm.nr_budynku}
										onChange={e =>
											setAptekaForm({
												...aptekaForm,
												nr_budynku: e.target.value,
											})
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
										placeholder='10'
									/>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Kod pocztowy
								</label>
								<input
									type='text'
									value={aptekaForm.kod_pocztowy}
									onChange={e =>
										setAptekaForm({
											...aptekaForm,
											kod_pocztowy: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
									placeholder='00-001'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Telefon
								</label>
								<input
									type='tel'
									value={aptekaForm.telefon}
									onChange={e =>
										setAptekaForm({
											...aptekaForm,
											telefon: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
									placeholder='123 456 789'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Email apteki
								</label>
								<input
									type='email'
									value={aptekaForm.email}
									onChange={e =>
										setAptekaForm({
											...aptekaForm,
											email: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100'
									placeholder='apteka@example.com'
								/>
							</div>

							<div className='flex gap-3 pt-2'>
								<button
									type='button'
									onClick={() => setShowAddApteka(false)}
									className='flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
								>
									Anuluj
								</button>
								<button
									type='submit'
									disabled={addingApteka}
									className='flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50'
								>
									{addingApteka
										? 'Dodawanie...'
										: 'Dodaj aptekę'}
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
