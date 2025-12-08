function Header({ searchQuery, onSearchChange }) {
  return (
    <header className="bg-gradient-to-r from-[#305669] to-[#B7E5CD] h-[60px] flex items-center justify-center relative shadow-md">
      <img 
        src="/logo1.svg" 
        alt="Logo" 
        className="absolute left-2.5 w-[200px] h-[60px] object-contain"
      />
      <input
        type="text"
        placeholder="Szukaj..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-2/5 px-3 py-2 border border-gray-300 rounded-full outline-none"
      />
    </header>
  )
}

export default Header
