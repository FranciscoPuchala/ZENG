import * as React from "react"
import { apiFetch } from "@/lib/api"
import { KeyRound, UserPlus, Trash2, ShieldCheck, User, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Toast } from "@/components/ui/toast"
import type { UsuarioSesion } from "@/lib/auth"

interface UsuarioRow {
  id: number
  usuario: string
  nombre: string | null
  iniciales: string
  rol: string
}

const ROL_LABEL: Record<string, string> = {
  admin:    "Administrador",
  analista: "Analista",
  tecnico:  "Técnico",
}

export function Configuracion({ usuario }: { usuario: UsuarioSesion }) {
  // ── Cambiar contraseña ────────────────────────────────────────────────
  const [passActual,  setPassActual]  = React.useState("")
  const [passNuevo,   setPassNuevo]   = React.useState("")
  const [passConfirm, setPassConfirm] = React.useState("")
  const [guardandoPass, setGuardandoPass] = React.useState(false)
  const [errPass, setErrPass] = React.useState<string | null>(null)

  // ── Usuarios (admin) ─────────────────────────────────────────────────
  const [usuarios, setUsuarios] = React.useState<UsuarioRow[]>([])
  const [nuevoUsuario,   setNuevoUsuario]   = React.useState("")
  const [nuevoPassword,  setNuevoPassword]  = React.useState("")
  const [nuevoNombre,    setNuevoNombre]    = React.useState("")
  const [nuevoIniciales, setNuevoIniciales] = React.useState("")
  const [nuevoRol,       setNuevoRol]       = React.useState("analista")
  const [creando, setCreando] = React.useState(false)
  const [errUsuario, setErrUsuario] = React.useState<string | null>(null)

  // ── Tema visual ───────────────────────────────────────────────────────
  const [tema, setTema] = React.useState<"light" | "dark">(() => {
    return (localStorage.getItem("zeng_tema") as "light" | "dark") || "light"
  })

  function aplicarTema(t: "light" | "dark") {
    setTema(t)
    localStorage.setItem("zeng_tema", t)
    document.documentElement.setAttribute("data-theme", t)
  }

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toastMsg,     setToastMsg]     = React.useState("")
  const [toastVisible, setToastVisible] = React.useState(false)

  function toast(msg: string) { setToastMsg(msg); setToastVisible(true) }

  const esAdmin = usuario.rol === "admin"

  React.useEffect(() => {
    if (!esAdmin) return
    apiFetch("/usuarios").then(r => r.ok ? r.json() : []).then(setUsuarios).catch(() => {})
  }, [esAdmin])

  // ── Cambiar contraseña ────────────────────────────────────────────────
  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setErrPass(null)
    if (passNuevo !== passConfirm) { setErrPass("Las contraseñas nuevas no coinciden"); return }
    if (passNuevo.length < 6) { setErrPass("La contraseña debe tener al menos 6 caracteres"); return }
    setGuardandoPass(true)
    try {
      const r = await apiFetch("/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_actual: passActual, password_nuevo: passNuevo }),
      })
      const data = await r.json()
      if (!r.ok) { setErrPass(data.error ?? "Error al cambiar la contraseña"); return }
      setPassActual(""); setPassNuevo(""); setPassConfirm("")
      toast("Contraseña cambiada correctamente.")
    } finally {
      setGuardandoPass(false)
    }
  }

  // ── Crear usuario (admin) ─────────────────────────────────────────────
  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setErrUsuario(null)
    setCreando(true)
    try {
      const r = await apiFetch("/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nuevoUsuario, password: nuevoPassword, nombre: nuevoNombre, iniciales: nuevoIniciales, rol: nuevoRol }),
      })
      const data = await r.json()
      if (!r.ok) { setErrUsuario(data.error ?? "Error al crear el usuario"); return }
      setUsuarios(prev => [...prev, data])
      setNuevoUsuario(""); setNuevoPassword(""); setNuevoNombre(""); setNuevoIniciales(""); setNuevoRol("analista")
      toast(`Usuario "${data.iniciales}" creado correctamente.`)
    } finally {
      setCreando(false)
    }
  }

  // ── Eliminar usuario (admin) ──────────────────────────────────────────
  async function eliminarUsuario(id: number, iniciales: string) {
    if (!confirm(`¿Eliminar al usuario ${iniciales}? Esta acción no se puede deshacer.`)) return
    const r = await apiFetch(`/usuarios/${id}`, { method: "DELETE" })
    if (r.ok) {
      setUsuarios(prev => prev.filter(u => u.id !== id))
      toast(`Usuario "${iniciales}" eliminado.`)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tema === "dark" ? <Moon className="size-4 text-teal-600" /> : <Sun className="size-4 text-teal-600" />}
            Apariencia
          </CardTitle>
          <CardDescription>Elegí el tema visual del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map(t => (
              <button
                key={t}
                onClick={() => aplicarTema(t)}
                className={[
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                  tema === t
                    ? "border-teal-600 text-teal-600 ring-1 ring-teal-600/40"
                    : "border-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {t === "light" ? "Claro" : "Oscuro"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mi cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-teal-600" />
            Mi cuenta
          </CardTitle>
          <CardDescription>
            {usuario.nombre ?? usuario.usuario}
            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              {ROL_LABEL[usuario.rol] ?? usuario.rol}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={cambiarPassword} className="flex flex-col gap-4">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <KeyRound className="size-3.5 text-teal-600" /> Cambiar contraseña
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pass-actual">Contraseña actual <span className="text-red-500">*</span></Label>
                <Input id="pass-actual" type="password" value={passActual} onChange={e => setPassActual(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pass-nuevo">Nueva contraseña <span className="text-red-500">*</span></Label>
                <Input id="pass-nuevo" type="password" value={passNuevo} onChange={e => setPassNuevo(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pass-confirm">Confirmar nueva <span className="text-red-500">*</span></Label>
                <Input id="pass-confirm" type="password" value={passConfirm} onChange={e => setPassConfirm(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            {errPass && <p className="text-sm text-red-600">{errPass}</p>}
            <div>
              <Button type="submit" variant="secondary" size="sm" disabled={guardandoPass || !passActual || !passNuevo || !passConfirm}>
                {guardandoPass ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Usuarios — solo admin */}
      {esAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-teal-600" />
              Usuarios del sistema
            </CardTitle>
            <CardDescription>Solo los administradores pueden ver y gestionar los usuarios.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">

            {/* Lista de usuarios */}
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Iniciales</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Usuario</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rol</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-semibold">{u.iniciales}</td>
                      <td className="px-3 py-2 text-muted-foreground">{u.nombre ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{u.usuario}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {ROL_LABEL[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        {u.id !== usuario.id && (
                          <button
                            onClick={() => eliminarUsuario(u.id, u.iniciales)}
                            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">No hay usuarios.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Crear usuario */}
            <form onSubmit={crearUsuario} className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <UserPlus className="size-3.5 text-teal-600" /> Crear usuario nuevo
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nu-iniciales">Iniciales <span className="text-red-500">*</span></Label>
                  <Input id="nu-iniciales" maxLength={4} value={nuevoIniciales} onChange={e => setNuevoIniciales(e.target.value.toUpperCase())} placeholder="MG" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nu-nombre">Nombre completo</Label>
                  <Input id="nu-nombre" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="María García" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nu-usuario">Usuario <span className="text-red-500">*</span></Label>
                  <Input id="nu-usuario" value={nuevoUsuario} onChange={e => setNuevoUsuario(e.target.value)} placeholder="mg" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nu-password">Contraseña <span className="text-red-500">*</span></Label>
                  <Input id="nu-password" type="password" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nu-rol">Rol</Label>
                  <select
                    id="nu-rol"
                    value={nuevoRol}
                    onChange={e => setNuevoRol(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="analista">Analista</option>
                    <option value="tecnico">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="mt-5">
                  <Button type="submit" variant="secondary" size="sm"
                    disabled={creando || !nuevoUsuario || !nuevoPassword || !nuevoIniciales}>
                    {creando ? "Creando…" : "Crear usuario"}
                  </Button>
                </div>
              </div>
              {errUsuario && <p className="text-sm text-red-600">{errUsuario}</p>}
            </form>

          </CardContent>
        </Card>
      )}

      <Toast message={toastMsg} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  )
}
