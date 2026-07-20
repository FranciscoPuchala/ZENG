import * as React from "react"
import { API } from "@/lib/api"
import { ShieldCheck, ShieldAlert, Clock, RefreshCw, AlertTriangle, RotateCcw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { leerToken } from "@/lib/auth"

interface Entrada {
  fecha: string
  estado: "OK" | "OK-DIA" | "ERROR"
  detalle: string
}

interface BackupItem {
  archivo: string
  carpeta: "frecuentes" | "diarios"
  fecha_mod: string
  tamano: number
}

interface InformePreview {
  numero: string
  fecha: string | null
}

interface ClientePreview {
  numero_cliente: string
  nombre: string
  total_informes: number
  informes: InformePreview[]
}

function proximoBackup(): Date {
  const ahora = new Date()
  const prox = new Date(ahora)
  prox.setSeconds(0, 0)

  if (ahora.getMinutes() < 30) {
    prox.setMinutes(30)
  } else {
    prox.setMinutes(0)
    prox.setHours(ahora.getHours() + 1)
  }

  const h = prox.getHours()
  if (h < 8 || h >= 20) {
    const siguiente = new Date(prox)
    if (h >= 20) siguiente.setDate(siguiente.getDate() + 1)
    siguiente.setHours(8, 0, 0, 0)
    return siguiente
  }
  return prox
}

function formatCuenta(seg: number) {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function formatTamano(bytes: number) {
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function Respaldo() {
  // Estado del panel principal
  const [entradas,        setEntradas]        = React.useState<Entrada[]>([])
  const [sinLog,          setSinLog]          = React.useState(false)
  const [error,           setError]           = React.useState("")
  const [cargando,        setCargando]        = React.useState(true)
  const [segundos,        setSegundos]        = React.useState(0)
  const [ahora,           setAhora]           = React.useState(new Date())
  const [resultRest,      setResultRest]      = React.useState<{ ok: boolean; msg: string } | null>(null)

  // Estado del modal
  const [modal,           setModal]           = React.useState(false)
  const [backups,         setBackups]         = React.useState<BackupItem[]>([])
  const [cargandoLista,   setCargandoLista]   = React.useState(false)
  const [seleccionado,    setSeleccionado]    = React.useState<BackupItem | null>(null)
  const [preview,         setPreview]         = React.useState<ClientePreview[] | null>(null)
  const [cargandoPreview, setCargandoPreview] = React.useState(false)
  const [textoConfirmar,  setTextoConfirmar]  = React.useState("")
  const [restaurando,     setRestaurando]     = React.useState(false)

  async function abrirModal() {
    setModal(true)
    setSeleccionado(null)
    setPreview(null)
    setTextoConfirmar("")
    setCargandoLista(true)
    try {
      const res  = await fetch(`${API}/backup/lista`, { headers: { Authorization: `Bearer ${leerToken()}` } })
      const data = await res.json()
      setBackups(data.backups ?? [])
    } catch {
      setBackups([])
    } finally {
      setCargandoLista(false)
    }
  }

  async function seleccionar(backup: BackupItem) {
    setSeleccionado(backup)
    setPreview(null)
    setTextoConfirmar("")
    setCargandoPreview(true)
    try {
      const res  = await fetch(`${API}/backup/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${leerToken()}` },
        body: JSON.stringify({ archivo: backup.archivo, carpeta: backup.carpeta }),
      })
      const data = await res.json()
      setPreview(data.clientes ?? [])
    } catch {
      setPreview([])
    } finally {
      setCargandoPreview(false)
    }
  }

  async function restaurar() {
    if (!seleccionado) return
    setRestaurando(true)
    try {
      const res  = await fetch(`${API}/backup/restaurar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${leerToken()}` },
        body: JSON.stringify({ archivo: seleccionado.archivo, carpeta: seleccionado.carpeta }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultRest({ ok: true, msg: `Base restaurada desde: ${data.archivo}` })
        setModal(false)
        cargar()
      } else {
        setResultRest({ ok: false, msg: data.error || "Error al restaurar" })
      }
    } catch {
      setResultRest({ ok: false, msg: "No se pudo conectar con el servidor" })
    } finally {
      setRestaurando(false)
    }
  }

  async function cargar() {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/backup/status`, { headers: { Authorization: `Bearer ${leerToken()}` } })
      const data = await res.json()
      if (data.sin_log) { setSinLog(true); setEntradas([]) }
      else              { setSinLog(false); setEntradas(data.entradas ?? []) }
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setCargando(false)
    }
  }

  React.useEffect(() => { cargar() }, [])
  React.useEffect(() => {
    const t = setInterval(cargar, 60_000)
    return () => clearInterval(t)
  }, [])

  React.useEffect(() => {
    const tick = () => {
      const now  = new Date()
      setAhora(now)
      const diff = Math.max(0, Math.round((proximoBackup().getTime() - now.getTime()) / 1000))
      setSegundos(diff)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const ultimo   = entradas[0] ?? null
  const esOk     = ultimo?.estado === "OK" || ultimo?.estado === "OK-DIA"
  const enHorario = ahora.getHours() >= 8 && ahora.getHours() < 20

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Respaldo de datos</h1>
        <p className="text-sm text-muted-foreground">
          Backups automáticos de PostgreSQL — cada 30 min (08:00–20:00) y diario a las 23:00
        </p>
      </div>

      {/* Fila superior: estado + countdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            {ultimo === null ? (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Clock className="size-6 text-muted-foreground" />
              </div>
            ) : esOk ? (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <ShieldCheck className="size-6" />
              </div>
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ShieldAlert className="size-6" />
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Último backup</div>
              {cargando ? (
                <div className="text-sm text-muted-foreground">Cargando…</div>
              ) : sinLog ? (
                <div className="text-sm text-muted-foreground">Sin registros todavía</div>
              ) : ultimo ? (
                <>
                  <div className={`text-2xl font-bold ${esOk ? "text-teal-700" : "text-red-600"}`}>
                    {esOk ? "OK" : "ERROR"}
                  </div>
                  <div className="text-xs text-muted-foreground">{ultimo.fecha}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Sin datos</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Clock className="size-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {enHorario ? "Próximo backup en" : "Fuera de horario — próximo a las 08:00"}
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {formatCuenta(segundos)}
              </div>
              <div className="text-xs text-muted-foreground">
                {proximoBackup().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado de restauración */}
      {resultRest && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          resultRest.ok
            ? "border-teal-300 bg-teal-50 text-teal-800"
            : "border-red-300 bg-red-50 text-red-800"
        }`}>
          {resultRest.ok ? "✅ " : "❌ "}{resultRest.msg}
        </div>
      )}

      {/* Botón restaurar */}
      <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-red-700">Restaurar base desde un backup</div>
          <div className="mt-0.5 text-xs text-red-500">
            Seleccioná el backup, revisá el contenido y confirmá. No se puede deshacer.
          </div>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.97]"
        >
          <RotateCcw className="size-4" /> Restaurar
        </button>
      </div>

      {/* Historial del log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Historial reciente</CardTitle>
          <button
            onClick={cargar}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="size-3.5" /> Actualizar
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="px-5 py-4 text-sm text-red-500">{error}</p>
          ) : sinLog ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              Todavía no hay backups registrados. El primero correrá a las 08:00.
            </p>
          ) : entradas.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Sin registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Fecha y hora</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Archivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entradas.map((e, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{e.fecha}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          e.estado === "OK" || e.estado === "OK-DIA"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {e.estado === "OK-DIA" ? "OK diario" : e.estado}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-muted-foreground" title={e.detalle}>
                        {e.detalle.split("\\").pop()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal de restauración ───────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="flex w-full max-w-2xl flex-col rounded-2xl border border-red-300 bg-card shadow-2xl"
            style={{ maxHeight: "85vh" }}
          >
            {/* Cabecera */}
            <div className="flex shrink-0 items-center gap-3 rounded-t-2xl bg-red-600 px-6 py-4">
              <AlertTriangle className="size-6 shrink-0 text-white" />
              <h2 className="text-base font-bold text-white">Restaurar base de datos</h2>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">

              {/* Advertencia */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Esto va a:</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-red-700">
                  <li>Sobreescribir <strong>todos</strong> los datos actuales de la base</li>
                  <li>Perder todo lo cargado <strong>después</strong> del backup elegido</li>
                  <li>No hay forma de deshacer esta acción</li>
                </ul>
              </div>

              {/* Lista de backups */}
              <div>
                <div className="mb-2 text-sm font-medium text-foreground">
                  Seleccioná el backup a restaurar:
                </div>
                {cargandoLista ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin" /> Cargando lista…
                  </div>
                ) : backups.length === 0 ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    No hay backups disponibles.
                  </div>
                ) : (
                  <div className="flex max-h-44 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-1">
                    {backups.map((b) => {
                      const isSel  = seleccionado?.archivo === b.archivo && seleccionado?.carpeta === b.carpeta
                      const fecha  = new Date(b.fecha_mod).toLocaleString("es-UY", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                      return (
                        <button
                          key={`${b.carpeta}/${b.archivo}`}
                          onClick={() => seleccionar(b)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            isSel ? "bg-red-50 text-red-900" : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className={`size-3.5 shrink-0 rounded-full border-2 transition-colors ${
                            isSel ? "border-red-600 bg-red-600" : "border-muted-foreground"
                          }`} />
                          <span className="flex-1 font-mono text-xs">{fecha}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            b.carpeta === "diarios"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-teal-100 text-teal-700"
                          }`}>
                            {b.carpeta === "diarios" ? "Diario" : "Frecuente"}
                          </span>
                          <span className="w-14 text-right text-xs text-muted-foreground">
                            {formatTamano(b.tamano)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Vista previa del contenido */}
              {seleccionado && (
                <div>
                  <div className="mb-2 text-sm font-medium text-foreground">
                    Contenido del backup seleccionado:
                  </div>
                  {cargandoPreview ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      <RefreshCw className="size-4 animate-spin" />
                      Cargando vista previa… (puede tardar unos segundos)
                    </div>
                  ) : !preview ? null : preview.length === 0 ? (
                    <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      Sin datos de clientes en este backup.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nro.</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Informes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {preview.map((c) => (
                            <tr key={c.numero_cliente} className="hover:bg-muted/20">
                              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                {c.numero_cliente}
                              </td>
                              <td className="px-4 py-2.5 text-sm">{c.nombre}</td>
                              <td className="px-4 py-2.5">
                                {c.total_informes === 0 ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {c.informes.map((inf) => (
                                      <span
                                        key={inf.numero}
                                        title={inf.fecha ?? ""}
                                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]"
                                      >
                                        {inf.numero}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Input CONFIRMAR — aparece cuando la vista previa está lista */}
              {seleccionado && !cargandoPreview && preview !== null && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Para continuar, escribí exactamente:{" "}
                    <code className="rounded bg-muted px-1 font-bold">CONFIRMAR</code>
                  </label>
                  <input
                    type="text"
                    value={textoConfirmar}
                    onChange={(e) => setTextoConfirmar(e.target.value)}
                    placeholder="CONFIRMAR"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                disabled={!seleccionado || textoConfirmar !== "CONFIRMAR" || restaurando || cargandoPreview}
                onClick={restaurar}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {restaurando ? "Restaurando…" : "Restaurar base"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
