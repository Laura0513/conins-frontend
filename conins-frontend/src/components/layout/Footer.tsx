export default function Footer() {
  return (
    <footer 
      className="z-20 bg-green-500 text-white py-3 px-6 text-center text-xs md:text-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      style={{ position: 'fixed', bottom: '0', left: '0', right: '0' }}
    >
      <p>© {new Date().getFullYear()} CONINS · CDMC SENA · Todos los derechos reservados</p>
    </footer>
  )
}
