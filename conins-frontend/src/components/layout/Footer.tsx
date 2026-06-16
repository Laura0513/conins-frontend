export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-sena text-white py-3 px-6 text-center text-xs md:text-sm border-t border-white/10 shadow-lg">
      <p>© {new Date().getFullYear()} CONINS · CDMC SENA · Todos los derechos reservados</p>
    </footer>
  )
}
