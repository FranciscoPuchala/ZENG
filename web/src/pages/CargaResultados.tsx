import * as React from "react"
import { apiFetch } from "@/lib/api"
import {
  Search, ChevronRight, Save, FlaskConical, X, Printer,
  FileText, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table"
import { ReporteFicha } from "@/pages/ReporteFicha"
import type { FichaParametro } from "@/pages/ReporteFicha"
import { cn } from "@/lib/utils"

// ── Tipos ────────────────────────────────────────────────────────────
interface Analisis {
  id: number; muestra_id: number; ensayo_id: number
  numero_interno: number; descripcion: string
  fecha_entrada: string; hora_entrada: string | null
  cliente_nombre: string; numero_cliente: string
  ensayo_codigo: string; ensayo_nombre: string
}
interface Parametro {
  id: number; codigo: string; descripcion: string
  unidad: string | null
  tipo_campo: "texto" | "ausencia" | "negativo" | "no_detectado"
  valor_predeterminado: string | null
  orden: number
}
interface Metodologia { codigo: string; descripcion: string }
interface Usuario { id: number; iniciales: string; nombre: string }

function hoyISO() { return new Date().toISOString().slice(0, 10) }
function horaAhoraISO() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const OPCIONES_CAMPO: Record<string, string[]> = {
  ausencia:     ["Ausencia", "No Detectado"],
  negativo:     ["Negativo", "Presuntivo Positivo"],
  no_detectado: ["No Detectado", "Detectado"],
}

function SelectorBoton({
  opciones,
  value,
  onChange,
}: { opciones: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {opciones.map(op => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={[
            "flex h-8 flex-1 items-center justify-center rounded-md border px-1.5 text-[11px] font-medium transition-colors",
            value === op
              ? "border-green-500/50 bg-green-500/15 text-green-600"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          ].join(" ")}
        >
          {op}
        </button>
      ))}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────
export function CargaResultados() {
  // Datos de la API
  const [pendientes,   setPendientes]   = React.useState<Analisis[]>([])
  const [parametros,   setParametros]   = React.useState<Parametro[]>([])
  const [metodologias, setMetodologias] = React.useState<Metodologia[]>([])
  const [usuarios,     setUsuarios]     = React.useState<Usuario[]>([])
  const [cargando,     setCargando]     = React.useState(true)

  // Sección de carga de resultados
  const [seleccionado, setSeleccionado] = React.useState<Analisis | null>(null)
  const [busqueda,     setBusqueda]     = React.useState("")
  const [fechaSiembra, setFechaSiembra] = React.useState(hoyISO())
  const [horaSiembra,  setHoraSiembra]  = React.useState(horaAhoraISO())
  const [analistaId,   setAnalistaId]   = React.useState("")
  const [revisorId,    setRevisorId]    = React.useState("")
  const [valores,       setValores]       = React.useState<Record<number, string>>({})
  const [guardando,     setGuardando]     = React.useState(false)
  const [errorValores,  setErrorValores]  = React.useState<number[]>([])

  // Sección Reporte de Ficha
  const [fichaAbierta,    setFichaAbierta]    = React.useState(false)
  const [fichaEnsayo,     setFichaEnsayo]     = React.useState<string | null>(null)
  const [fichaIds,        setFichaIds]        = React.useState<number[]>([])
  const [fichaFecha,      setFichaFecha]      = React.useState(hoyISO())
  const [fichaHora,       setFichaHora]       = React.useState(horaAhoraISO())
  const [fichaVisible,    setFichaVisible]    = React.useState(false)
  const [fichaParametros, setFichaParametros] = React.useState<FichaParametro[]>([])

  // AbortController para cancelar fetch de plantilla cuando el usuario cambia de análisis
  const abortRef = React.useRef<AbortController | null>(null)

  // Cargar pendientes y usuarios al abrir
  React.useEffect(() => {
    async function cargar() {
      try {
        const [penRes, usuRes] = await Promise.all([
          apiFetch('/analisis/pendientes'),
          apiFetch('/usuarios'),
        ])
        const pen = await penRes.json()
        const usu = await usuRes.json()
        setPendientes(pen)
        setUsuarios(usu)
        if (usu.length > 0) setAnalistaId(String(usu[0].id))
      } catch {
        // falla silenciosamente
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // Agrupar pendientes por ensayo (para la sección de ficha)
  const grupos = React.useMemo(() => {
    const map: Record<string, { codigo: string; nombre: string; analisis: Analisis[] }> = {}
    for (const a of pendientes) {
      if (!map[a.ensayo_codigo]) {
        map[a.ensayo_codigo] = { codigo: a.ensayo_codigo, nombre: a.ensayo_nombre, analisis: [] }
      }
      map[a.ensayo_codigo].analisis.push(a)
    }
    return Object.values(map).sort((a, b) => a.codigo.localeCompare(b.codigo))
  }, [pendientes])

  // Si el grupo activo de la ficha queda vacío (todas sus muestras ya cargaron), lo limpia
  React.useEffect(() => {
    if (fichaEnsayo && !grupos.find(g => g.codigo === fichaEnsayo)) {
      setFichaEnsayo(null)
      setFichaIds([])
    }
  }, [grupos, fichaEnsayo])

  // Seleccionar un ensayo en la sección de ficha (pre-selecciona todas sus muestras)
  function toggleFichaEnsayo(codigo: string) {
    if (fichaEnsayo === codigo) {
      setFichaEnsayo(null)
      setFichaIds([])
    } else {
      const grupo = grupos.find(g => g.codigo === codigo)
      setFichaEnsayo(codigo)
      setFichaIds(grupo ? grupo.analisis.map(a => a.id) : [])
    }
  }

  function toggleFichaId(id: number) {
    setFichaIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function imprimirFicha() {
    if (!fichaEnsayo || fichaIds.length === 0) return
    try {
      const res = await apiFetch(`/ensayos/${fichaEnsayo}/plantilla`)
      if (!res.ok) return
      const data = await res.json()
      setFichaParametros(data.parametros)
      setFichaVisible(true)
    } catch { /* sin conexión */ }
  }

  // Seleccionar un análisis para cargar resultados
  async function seleccionar(a: Analisis) {
    // Cancela la fetch anterior si el usuario cambia de análisis rápido
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setSeleccionado(a)
    setParametros([])
    setMetodologias([])
    setValores({})
    try {
      const res = await apiFetch(`/ensayos/${a.ensayo_codigo}/plantilla`, { signal: ctrl.signal })
      if (!res.ok) return
      const data = await res.json()
      setParametros(data.parametros)
      setMetodologias(data.metodologias)
      const init: Record<number, string> = {}
      data.parametros.forEach((p: Parametro) => { init[p.id] = p.valor_predeterminado ?? "" })
      setValores(init)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
    }
  }

  function eliminarParametro(id: number) {
    setParametros(prev => prev.filter(p => p.id !== id))
  }

  async function guardar() {
    if (!seleccionado) return
    const vacios = parametros.filter(p => !(valores[p.id] ?? "").trim())
    if (vacios.length > 0) {
      setErrorValores(vacios.map(p => p.id))
      return
    }
    setErrorValores([])
    setGuardando(true)
    try {
      const res = await apiFetch(`/analisis/${seleccionado.id}/resultados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_siembra: fechaSiembra,
          hora_siembra:  horaSiembra  || null,
          analista_id:   analistaId   ? Number(analistaId) : null,
          revisor_id:    revisorId    ? Number(revisorId)  : null,
          resultados: parametros.map(p => ({
            parametro_id: p.id,
            valor:        valores[p.id] ?? "",
          })),
        }),
      })
      if (res.ok) {
        const idGuardado = seleccionado.id
        setPendientes(prev => prev.filter(a => a.id !== idGuardado))
        setFichaIds(prev => prev.filter(id => id !== idGuardado))
        setSeleccionado(null)
        setParametros([])
        setMetodologias([])
        setValores({})
      } else {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? "Error al guardar los resultados")
      }
    } catch {
      alert("Error de conexión con el servidor")
    } finally {
      setGuardando(false)
    }
  }

  const filtrados = pendientes.filter(a =>
    busqueda === "" ||
    String(a.numero_interno).includes(busqueda) ||
    a.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.numero_cliente.includes(busqueda)
  )

  if (cargando) return <p className="p-4 text-muted-foreground">Cargando...</p>

  const grupoActivo = grupos.find(g => g.codigo === fichaEnsayo)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Sección: Reporte de Ficha ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setFichaAbierta(p => !p)}
            className="flex w-full cursor-pointer items-center gap-2 text-left"
          >
            <FileText className="size-4 shrink-0 text-teal-700" />
            <div className="flex-1">
              <div className="text-sm font-semibold leading-tight">Reporte de Ficha</div>
              <div className="text-xs text-muted-foreground">
                Imprimí la hoja de trabajo antes de cargar los resultados al sistema.
              </div>
            </div>
            {fichaAbierta
              ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
              : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
          </button>
        </CardHeader>

        {fichaAbierta && (
          <CardContent className="pt-0">
            {grupos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay análisis pendientes para imprimir.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {grupos.map(g => {
                  const abierto = fichaEnsayo === g.codigo
                  return (
                    <div
                      key={g.codigo}
                      className={cn(
                        "rounded-md border transition-colors",
                        abierto ? "border-teal-500/40 bg-teal-500/10" : "border-border"
                      )}
                    >
                      {/* Cabecera del grupo */}
                      <button
                        type="button"
                        onClick={() => toggleFichaEnsayo(g.codigo)}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left"
                      >
                        <ChevronRight
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            abierto && "rotate-90"
                          )}
                        />
                        <span className="font-mono text-xs font-semibold text-teal-700 w-8">
                          {g.codigo}
                        </span>
                        <span className="flex-1 text-sm">{g.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {g.analisis.length} muestra{g.analisis.length !== 1 ? "s" : ""}
                        </span>
                      </button>

                      {/* Detalle del grupo — muestras + controles */}
                      {abierto && (
                        <div className="border-t border-teal-200 px-4 py-3">
                          {/* Lista de muestras con checkboxes */}
                          <div className="mb-3 flex max-h-44 flex-col gap-1 overflow-y-auto">
                            {g.analisis.map(a => (
                              <label
                                key={a.id}
                                className="flex cursor-pointer items-center gap-2.5 rounded py-0.5 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={fichaIds.includes(a.id)}
                                  onChange={() => toggleFichaId(a.id)}
                                  className="size-4 accent-teal-700"
                                />
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{a.numero_interno}
                                </span>
                                <span className="font-medium">{a.numero_cliente}</span>
                                <span className="text-muted-foreground">—</span>
                                <span className="truncate text-muted-foreground">{a.descripcion}</span>
                              </label>
                            ))}
                          </div>

                          {/* Fecha y hora de siembra + botón imprimir */}
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="ficha-fecha" className="text-xs">Fecha de siembra</Label>
                              <Input
                                id="ficha-fecha"
                                type="date"
                                value={fichaFecha}
                                onChange={e => setFichaFecha(e.target.value)}
                                className="h-8 w-40 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="ficha-hora" className="text-xs">Hora</Label>
                              <Input
                                id="ficha-hora"
                                type="time"
                                value={fichaHora}
                                onChange={e => setFichaHora(e.target.value)}
                                className="h-8 w-28 text-sm"
                              />
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={imprimirFicha}
                              disabled={fichaIds.length === 0}
                            >
                              <Printer />
                              Imprimir Ficha ({fichaIds.length})
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Sección: Carga de resultados ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">

        {/* Lista de análisis pendientes */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Análisis pendientes</CardTitle>
            <CardDescription>Seleccioná uno para cargar sus resultados</CardDescription>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar análisis"
                placeholder="N° muestra o cliente..."
                className="pl-8"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtrados.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No hay análisis pendientes.
              </p>
            ) : (
              <ul role="list">
                {filtrados.map(a => {
                  const isActive = seleccionado?.id === a.id
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => seleccionar(a)}
                        className={`flex w-full cursor-pointer items-center gap-3 border-b border-border px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-muted/50 ${
                          isActive ? "bg-teal-500/10 hover:bg-teal-500/10" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{a.numero_interno}
                            </span>
                            <Badge variant="pendiente">Pendiente</Badge>
                          </div>
                          <div className="mt-0.5 truncate text-sm font-medium">
                            {a.numero_cliente} — {a.cliente_nombre}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {a.descripcion}
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            Ensayo {a.ensayo_codigo} · {a.ensayo_nombre}
                          </div>
                        </div>
                        <ChevronRight className={`size-4 shrink-0 transition-colors ${
                          isActive ? "text-teal-700" : "text-muted-foreground"
                        }`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Formulario de carga */}
        {seleccionado ? (
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Carga de resultados</CardTitle>
                  <CardDescription>
                    Muestra #{seleccionado.numero_interno} · {seleccionado.numero_cliente} — {seleccionado.cliente_nombre} · Ensayo {seleccionado.ensayo_codigo}
                  </CardDescription>
                </div>
                <Badge variant="pendiente">Pendiente</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Fecha y hora de siembra */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fecha-siembra">
                    Fecha de siembra <span className="text-red-500" aria-hidden>*</span>
                  </Label>
                  <Input id="fecha-siembra" type="date" value={fechaSiembra}
                    onChange={e => setFechaSiembra(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="hora-siembra">Hora de siembra</Label>
                  <Input id="hora-siembra" type="time" value={horaSiembra}
                    onChange={e => setHoraSiembra(e.target.value)} />
                </div>
              </div>

              {/* Analista y revisor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="analista">
                    Analista <span className="text-red-500" aria-hidden>*</span>
                  </Label>
                  <Select value={analistaId} onValueChange={setAnalistaId}>
                    <SelectTrigger id="analista"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nombre} ({u.iniciales})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="revisor">Revisado por</Label>
                  <Select value={revisorId} onValueChange={setRevisorId}>
                    <SelectTrigger id="revisor">
                      <SelectValue placeholder="Seleccioná..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nombre} ({u.iniciales})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla de parámetros */}
              <div className="flex flex-col gap-2">
                <Label>
                  Parámetros y resultados <span className="text-red-500" aria-hidden>*</span>
                </Label>
                {parametros.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {seleccionado
                      ? "Este ensayo no tiene parámetros en la base — los resultados se cargan a mano."
                      : "Cargando parámetros..."}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parámetro</TableHead>
                          <TableHead className="w-20">Cód.</TableHead>
                          <TableHead className="w-64">Valor</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parametros.map(p => {
                          const conError = errorValores.includes(p.id)
                          return (
                          <TableRow
                            key={p.id}
                            className={conError ? "bg-red-500/10" : ""}
                          >
                            <TableCell>
                              <div className="text-sm">{p.descripcion}</div>
                              {p.unidad && (
                                <div className="text-xs text-muted-foreground">{p.unidad}</div>
                              )}
                              {conError && (
                                <div className="text-[11px] text-red-500">Completá este campo o eliminalo</div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {p.codigo}
                            </TableCell>
                            <TableCell>
                              {OPCIONES_CAMPO[p.tipo_campo] ? (
                                <SelectorBoton
                                  opciones={OPCIONES_CAMPO[p.tipo_campo]}
                                  value={valores[p.id] ?? p.valor_predeterminado ?? ""}
                                  onChange={v => {
                                    setValores(prev => ({ ...prev, [p.id]: v }))
                                    setErrorValores(prev => prev.filter(id => id !== p.id))
                                  }}
                                />
                              ) : (
                                <Input
                                  placeholder={p.valor_predeterminado ?? ""}
                                  className={["h-8 font-mono text-xs", conError ? "border-red-400 ring-1 ring-red-400" : ""].join(" ")}
                                  value={valores[p.id] ?? ""}
                                  onChange={e => {
                                    setValores(prev => ({ ...prev, [p.id]: e.target.value }))
                                    if (e.target.value.trim()) setErrorValores(prev => prev.filter(id => id !== p.id))
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                title="Quitar parámetro de este análisis"
                                onClick={() => {
                                  eliminarParametro(p.id)
                                  setErrorValores(prev => prev.filter(id => id !== p.id))
                                }}
                                className="flex size-7 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                              >
                                <X className="size-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Metodologías */}
              {metodologias.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>Metodologías</Label>
                  <ul className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 px-3 py-2">
                    {metodologias.map(m => (
                      <li key={m.codigo} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="shrink-0 font-mono font-medium text-foreground/70">
                          {m.codigo}
                        </span>
                        <span>{m.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <p className="text-[11px] text-muted-foreground">* Campos obligatorios</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSeleccionado(null)}>Cancelar</Button>
                <Button variant="secondary" onClick={guardar} disabled={guardando}>
                  <Save />
                  {guardando ? "Guardando…" : "Guardar resultados"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="flex h-52 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
              <FlaskConical className="size-8 opacity-25" />
              <p className="text-sm">Seleccioná un análisis de la lista para cargar sus resultados.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Reporte de Ficha — portal de impresión */}
      {fichaVisible && grupoActivo && (
        <ReporteFicha
          ensayo={{ codigo: grupoActivo.codigo, nombre: grupoActivo.nombre }}
          analisis={pendientes.filter(a => fichaIds.includes(a.id))}
          parametros={fichaParametros}
          fechaSiembra={fichaFecha}
          horaSiembra={fichaHora}
          onCerrar={() => setFichaVisible(false)}
        />
      )}
    </div>
  )
}
