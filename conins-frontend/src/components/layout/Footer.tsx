export default function Footer() {
  return (
    <footer 
      className="z-50 bg-white text-gray-600 py-3 px-6 text-center text-xs md:text-sm"
      style={{ 
        position: 'fixed', 
        bottom: '0', 
        left: '0', 
        right: '0', 
        borderTop: '2px solid #39A900' 
      }}
    >
      <p>© {new Date().getFullYear()} CONINS · CDMC SENA · Todos los derechos reservados</p>
    </footer>
  )
}
