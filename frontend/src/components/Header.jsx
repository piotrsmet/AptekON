function Header({ searchQuery, onSearchChange }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <img 
          src="/logo1.svg" 
          alt="Logo" 
          className="h-10 w-auto"
        />
      </div>
      <input
        type="text"
        placeholder="Szukaj apteki..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 max-w-md mx-auto px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm"
      />
      <div className="w-32"></div>
    </header>
  )
}

export default Header
