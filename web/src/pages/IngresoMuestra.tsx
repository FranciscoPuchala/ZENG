import * as React from "react"
import { API } from "@/lib/api"
import { X, Search, Check, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
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
  Table, TableHeader, TableRow, TableHead, TableCell,
} from "@/components/ui/table"

// --- Tipos ---
interface Cliente  { id: number; numero_cliente: string; nombre: string }
interface Usuario  { id: number; iniciales: string; nombre: string }
interface Ensayo   { id: number; codigo: string; nombre: string }
interface Muestra  {
  id: number; numero_interno: number; descripcion: string
  fecha_entrada: string; cliente_nombre: string; numero_cliente: string
  ensayo_codigos: string[]; estado: string
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente", cargado: "Cargado", publicado: "Publicado",
}

function hoyISO()      { return new Date().toISOString().slice(0, 10) }
function horaAhoraISO() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}

export function IngresoMuestra() {
  // --- Datos de la API ---
  const [clientes, setClientes]   = React.useState<Cliente[]>([])
  const [usuarios, setUsuarios]   = React.useState<Usuario[]>([])
  const [ensayos,  setEnsayos]    = React.useState<Ensayo[]>([])
  const [muestras, setMuestras]   = React.useState<Muestra[]>([])
  const [cargando, setCargando]   = React.useState(true)

  // --- Estado del formulario ---
  const [clienteId,    setClienteId]    = React.useState("")
  const [descripciones,setDescripciones]= React.useState<string[]>([""])
  const [fechaEntrada, setFechaEntrada] = React.useState(hoyISO())
  const [horaEntrada,  setHoraEntrada]  = React.useState(horaAhoraISO())
  const [fechaMuestreo,setFechaMuestreo]= React.useState("")
  const [recibidoPor,  setRecibidoPor]  = React.useState("")
  const [observaciones,setObservaciones]= React.useState("")
  const [ensayosSelec, setEnsayosSelec] = React.useState<number[]>([])
  const [guardando,       setGuardando]       = React.useState(false)
  const [intentoGuardar,  setIntentoGuardar]  = React.useState(false)
  const [confirmBorrarId, setConfirmBorrarId] = React.useState<number | null>(null)
  const [busqueda,        setBusqueda]        = React.useState("")
  const [busquedaCliente, setBusquedaCliente] = React.useState("")
  const [busquedaEnsayo,  setBusquedaEnsayo]  = React.useState("")
  const [toastVisible,    setToastVisible]    = React.useState(false)
  const [toastMsg,        setToastMsg]        = React.useState("")

  // --- Cargar datos al abrir la pantalla ---
  React.useEffect(() => {
    async function cargar() {
      const [cliRes, usuRes, ensRes, muRes] = await Promise.all([
        fetch(`${API}/clientes`),
        fetch(`${API}/usuarios`),
        fetch(`${API}/ensayos`),
        fetch(`${API}/muestras`),
      ])
      const cli = await cliRes.json()
      const usu = await usuRes.json()
      const ens = await ensRes.json()
      const mu  = await muRes.json()
      setClientes(cli)
      setUsuarios(usu)
      setEnsayos(ens)
      setMuestras(mu)
      if (usu.length > 0) setRecibidoPor(String(usu[0].id))
      setCargando(false)
    }
    cargar()
  }, [])

  function toggleEnsayo(id: number) {
    setEnsayosSelec(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  function limpiarForm() {
    setClienteId(""); setBusquedaCliente("")
    setDescripciones([""]); setFechaMuestreo(""); setObservaciones("")
    setEnsayosSelec([]); setBusquedaEnsayo(""); setIntentoGuardar(false)
  }

  function updateDesc(i: number, val: string) {
    setDescripciones(prev => { const next = [...prev]; next[i] = val; return next })
  }

  function removeDesc(i: number) {
    setDescripciones(prev => prev.filter((_, j) => j !== i))
  }

  async function guardarMuestra() {
    setIntentoGuardar(true)
    if (!clienteId || descripciones.some(d => !d.trim()) || ensayosSelec.length === 0) return
    setGuardando(true)
    try {
      for (const desc of descripciones) {
        await fetch(`${API}/muestras`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_id:     Number(clienteId),
            descripcion:    desc.trim(),
            fecha_entrada:  fechaEntrada,
            hora_entrada:   horaEntrada   || null,
            fecha_muestreo: fechaMuestreo || null,
            recibido_por:   recibidoPor   ? Number(recibidoPor) : null,
            observaciones:  observaciones || null,
            ensayo_ids:     ensayosSelec,
          }),
        })
      }
      const mu = await fetch(`${API}/muestras`)
      setMuestras(await mu.json())
      const n = descripciones.length
      setToastMsg(n === 1 ? "Muestra guardada correctamente" : `${n} muestras guardadas correctamente`)
      limpiarForm()
      setToastVisible(true)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarMuestra(id: number) {
    const res = await fetch(`${API}/muestras/${id}`, { method: "DELETE" })
    if (res.ok) {
      setMuestras(prev => prev.filter(m => m.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "No se pudo borrar la muestra.")
    }
    setConfirmBorrarId(null)
  }

  // Filtrar muestras por búsqueda
  const muestrasFiltradas = muestras.filter(m =>
    busqueda === "" ||
    String(m.numero_interno).includes(busqueda) ||
    m.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.numero_cliente.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (cargando) {
    return <p className="text-muted-foreground p-4">Cargando datos...</p>
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      {/* --- Formulario de ingreso --- */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nueva muestra</CardTitle>
          <CardDescription>
            Etapa 1 — Cuaderno de Entrada. Al guardar se genera el N° de
            muestra y pasa a carga de resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>
              Cliente <span className="text-red-500" aria-hidden>*</span>
            </Label>
            {intentoGuardar && !clienteId && (
              <p className="text-xs text-red-500">Seleccioná un cliente</p>
            )}

            {clienteId ? (
              /* Cliente seleccionado — chip con X para cambiar */
              (() => {
                const sel = clientes.find(c => String(c.id) === clienteId)
                return (
                  <span className="flex w-fit items-center gap-1.5 rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                    <span className="font-mono text-xs">{sel?.numero_cliente}</span>
                    <button
                      type="button"
                      onClick={() => { setClienteId(""); setBusquedaCliente("") }}
                      aria-label="Cambiar cliente"
                      className="ml-0.5 rounded-full p-0.5 hover:bg-teal-100"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })()
            ) : (
              /* Sin cliente — buscador + lista */
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código…"
                    className={["pl-8", intentoGuardar && !clienteId ? "border-red-400 ring-1 ring-red-400" : ""].join(" ")}
                    value={busquedaCliente}
                    onChange={e => setBusquedaCliente(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-md border border-border">
                  {(() => {
                    const filtrados = clientes.filter(c =>
                      busquedaCliente === "" ||
                      c.numero_cliente.toLowerCase().includes(busquedaCliente.toLowerCase())
                    )
                    return filtrados.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Sin resultados para "{busquedaCliente}"
                      </p>
                    ) : (
                      <ul>
                        {filtrados.map(c => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => { setClienteId(String(c.id)); setBusquedaCliente("") }}
                              className="flex w-full items-center border-b border-border px-3 py-2 text-left last:border-0 transition-colors hover:bg-muted/50"
                            >
                              <span className="font-mono text-sm font-semibold text-teal-700">
                                {c.numero_cliente}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Descripción <span className="text-red-500" aria-hidden>*</span>
            </Label>
            {intentoGuardar && descripciones.some(d => !d.trim()) && (
              <p className="text-xs text-red-500">Completá la descripción de todas las muestras</p>
            )}
            <div className="flex flex-col gap-2">
              {[...descripciones].reverse().map((desc, revIdx) => {
                const i = descripciones.length - 1 - revIdx
                return (
                  <div key={i} className="flex items-center gap-2">
                    {descripciones.length > 1 && (
                      <span className="flex h-6 min-w-[2rem] shrink-0 items-center justify-center rounded-full bg-navy-100 px-2 text-[11px] font-semibold text-navy-900">
                        M{i + 1}
                      </span>
                    )}
                    <Input
                      placeholder={i === 0 ? "Ej. 5 muestras de carne" : `Descripción muestra ${i + 1}`}
                      value={desc}
                      onChange={e => updateDesc(i, e.target.value)}
                      aria-invalid={intentoGuardar && !desc.trim()}
                      className={intentoGuardar && !desc.trim() ? "border-red-400 ring-1 ring-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeDesc(i)}
                        aria-label={`Quitar M${i + 1}`}
                        className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-entrada">
                Fecha de recepción <span className="text-red-500" aria-hidden>*</span>
              </Label>
              <Input id="fecha-entrada" type="date" value={fechaEntrada}
                onChange={e => setFechaEntrada(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hora-entrada">Hora de recepción</Label>
              <Input id="hora-entrada" type="time" value={horaEntrada}
                onChange={e => setHoraEntrada(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha-muestreo">
              Fecha muestreo{" "}
              <span className="font-normal text-muted-foreground/70">(la da el cliente)</span>
            </Label>
            <Input id="fecha-muestreo" type="date" value={fechaMuestreo}
              onChange={e => setFechaMuestreo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recibido">Recibido por</Label>
            <Select value={recibidoPor} onValueChange={setRecibidoPor}>
              <SelectTrigger id="recibido"><SelectValue /></SelectTrigger>
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
            <Label>
              Ensayos <span className="text-red-500" aria-hidden>*</span>
            </Label>
            {intentoGuardar && ensayosSelec.length === 0 && (
              <p className="text-xs text-red-500">Seleccioná al menos un ensayo</p>
            )}

            {/* Chips de seleccionados */}
            {ensayosSelec.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ensayosSelec.map(id => {
                  const e = ensayos.find(e => e.id === id)
                  if (!e) return null
                  return (
                    <span key={id} className="flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                      {e.codigo} · {e.nombre.length > 22 ? e.nombre.slice(0, 22) + "…" : e.nombre}
                      <button
                        type="button"
                        onClick={() => toggleEnsayo(id)}
                        aria-label={`Quitar ${e.nombre}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-teal-100"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre…"
                className="pl-8"
                value={busquedaEnsayo}
                onChange={e => setBusquedaEnsayo(e.target.value)}
              />
            </div>

            {/* Lista scrollable */}
            {(() => {
              const filtrados = ensayos.filter(e =>
                busquedaEnsayo === "" ||
                e.codigo.toLowerCase().includes(busquedaEnsayo.toLowerCase()) ||
                e.nombre.toLowerCase().includes(busquedaEnsayo.toLowerCase())
              )
              return (
                <div className="max-h-44 overflow-y-auto rounded-md border border-border">
                  {filtrados.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
                  ) : (
                    <ul>
                      {filtrados.map(e => {
                        const sel = ensayosSelec.includes(e.id)
                        return (
                          <li key={e.id}>
                            <button
                              type="button"
                              onClick={() => toggleEnsayo(e.id)}
                              className={[
                                "flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left text-sm last:border-0 transition-colors",
                                sel ? "bg-teal-50" : "hover:bg-muted/50",
                              ].join(" ")}
                            >
                              <span className={[
                                "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                                sel ? "border-teal-600 bg-teal-600" : "border-border bg-card",
                              ].join(" ")}>
                                {sel && <Check className="size-2.5 text-white" strokeWidth={3} />}
                              </span>
                              <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">
                                {e.codigo}
                              </span>
                              <span className={sel ? "text-teal-700 font-medium" : "text-foreground"}>
                                {e.nombre}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observaciones">Observaciones</Label>
            <textarea
              id="observaciones" rows={2} placeholder="Opcional"
              value={observaciones} onChange={e => setObservaciones(e.target.value)}
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              const n = descripciones.length + 1
              // Auto-reemplaza el número M al final: "... M1" → "... M2"
              const base = descripciones[0]
              const autoDesc = base.replace(/M\d+$/, `M${n}`)
              setDescripciones(prev => [...prev, autoDesc])
            }}
            className="w-full"
          >
            + Agregar M{descripciones.length + 1}
          </Button>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">* Campos obligatorios</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={limpiarForm}>Limpiar</Button>
              <Button variant="secondary" onClick={guardarMuestra} disabled={guardando}>
                {guardando
                  ? "Guardando…"
                  : descripciones.length > 1
                  ? `Guardar ${descripciones.length} muestras`
                  : "Guardar muestra"}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* --- Listado de muestras recientes --- */}
      <Card className="h-fit">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Muestras recientes</CardTitle>
            <CardDescription>Últimas 50 muestras ingresadas</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por N° o cliente…" className="w-56 pl-8"
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Muestra</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Ensayos</TableHead>
                <TableHead>Recepción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody className="[&_tr:last-child]:border-0">
              {muestrasFiltradas.length === 0 && (
                <tr>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay muestras todavía
                  </TableCell>
                </tr>
              )}
              {muestrasFiltradas.map((m, i) => (
                <motion.tr
                  key={m.id}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.16,
                    delay: Math.min(i * 0.035, 0.18),
                    ease: "easeOut",
                  }}
                >
                  <TableCell className="font-mono text-xs">{m.numero_interno}</TableCell>
                  <TableCell>
                    <div className="font-medium">{m.cliente_nombre}</div>
                    <div className="text-xs text-muted-foreground">{m.numero_cliente}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.descripcion}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(m.ensayo_codigos ?? []).map(code => (
                        <span key={code}
                          className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.fecha_entrada ? new Date(m.fecha_entrada).toLocaleDateString("es-AR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.estado as "pendiente"|"cargado"|"publicado"}>
                      {ESTADO_LABEL[m.estado] ?? m.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.estado === "pendiente" && (
                      confirmBorrarId === m.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => borrarMuestra(m.id)}
                            className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                          >
                            Sí, borrar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmBorrarId(null)}
                            className="rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Borrar muestra pendiente"
                          onClick={() => setConfirmBorrarId(m.id)}
                          className="flex size-6 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Toast
      message={toastMsg}
      visible={toastVisible}
      onClose={() => setToastVisible(false)}
    />
    </>
  )
}
