import { useState } from 'react'

function AuthPanel({ isOpen, onClose, mode, onSwitchMode, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [haslo, setHaslo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        // Rejestracja
        const response = await fetch('http://localhost:5000/uzytkownicy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, haslo })
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Błąd rejestracji')
        }
        
        // Po udanej rejestracji, zaloguj automatycznie
        const loginResponse = await fetch('http://localhost:5000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, haslo })
        })
        const loginData = await loginResponse.json()
        
        if (loginResponse.ok) {
          onLoginSuccess(loginData.user)
          resetForm()
          onClose()
        }
      } else {
        // Logowanie
        const response = await fetch('http://localhost:5000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, haslo })
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Błąd logowania')
        }
        
        onLoginSuccess(data.user)
        resetForm()
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setHaslo('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSwitchMode = () => {
    resetForm()
    onSwitchMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity z-[9998] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-[9999] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'login' ? 'Logowanie' : 'Rejestracja'}
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="twoj@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasło
                </label>
                <input
                  type="password"
                  value={haslo}
                  onChange={(e) => setHaslo(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="••••••••"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Proszę czekać...' : (mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się')}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'login' ? 'Nie masz konta?' : 'Masz już konto?'}
                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  {mode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AuthPanel
