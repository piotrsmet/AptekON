import { useState } from 'react'

export const useAuth = () => {
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

	const login = userData => {
		setUser(userData)
		localStorage.setItem('user', JSON.stringify(userData))
	}

	const logout = () => {
		setUser(null)
		localStorage.removeItem('user')
	}

	return { user, login, logout }
}
