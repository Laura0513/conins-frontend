import { useState } from "react"
import Image from "next/image"
import LoginForm from "@/components/auth/LoginForm"
import CreatePasswordForm from "@/components/auth/CreatePasswordForm"

export default function AuthPage() {
  const [pestanaActiva, setPestanaActiva] = useState("login")

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">

      {/* Logo y título */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logoSena.png"
          alt="Logo SENA"
          width={80}
          height={80}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido a CONINS</h1>
        <p className="text-gray-500 mt-1">Control de Instructores · CDMC SENA</p>
      </div>

      {/* Tarjeta */}
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md p-8">

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setPestanaActiva("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              pestanaActiva === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setPestanaActiva("crearPassword")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              pestanaActiva === "crearPassword"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Crear contraseña
          </button>
        </div>

        {/* Formularios */}
        {pestanaActiva === "login" && <LoginForm />}
        {pestanaActiva === "crearPassword" && <CreatePasswordForm />}
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-sm mt-8">© 2026 CONINS · CDMC SENA</p>
    </main>
  )
}
