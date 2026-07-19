import * as React from "react"
import { guardarToken, type UsuarioSesion } from "@/lib/auth"

const API = "http://localhost:3001"

export function Login({ onLogin }: { onLogin: (u: UsuarioSesion) => void }) {
  const [usuario,  setUsuario]  = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error,    setError]    = React.useState("")
  const [cargando, setCargando] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setCargando(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return }
      guardarToken(data.token)
      onLogin(data.usuario)
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950">
      <div className="w-full max-w-sm px-4">

        {/* Logo + nombre */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-2xl font-bold text-white"
            style={{ boxShadow: "0 4px 20px rgb(15 118 110 / 0.5)" }}
          >
            Z
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-widest text-white uppercase">ZENG</div>
            <div className="mt-0.5 text-xs uppercase tracking-wider text-navy-100/50">
              Laboratorio Microbiológico
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/8 bg-navy-900/80 p-8"
        >
          <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-navy-100/50">
            Iniciar sesión
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-navy-100/55">
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="tu usuario"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-navy-100/25 transition-all duration-150 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-navy-100/55">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-navy-100/25 transition-all duration-150 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !usuario || !password}
              className="mt-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-teal-500 active:scale-[0.97] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? "Verificando…" : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
