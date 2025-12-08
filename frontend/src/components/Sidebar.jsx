function Sidebar() {
  return (
    <aside className="bg-gradient-to-b from-[#305669] to-[#B7E5CD] w-[250px] text-white p-5 box-border flex-shrink-0">
      <h3 className="text-xl font-semibold mb-4">Menu</h3>
      <ul className="space-y-2">
        <li className="cursor-pointer hover:opacity-80">Opcja 1</li>
        <li className="cursor-pointer hover:opacity-80">Opcja 2</li>
        <li className="cursor-pointer hover:opacity-80">Opcja 3</li>
      </ul>
    </aside>
  )
}

export default Sidebar
