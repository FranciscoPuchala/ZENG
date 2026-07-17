import * as React from "react"
import { Plus, X, Search } from "lucide-react"
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

const API = "http://localhost:3001"

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
  const [descripcion,  setDescripcion]  = React.useState("")
  const [fechaEntrada, setFechaEntrada] = React.useState(hoyISO())
  const [horaEntrada,  setHoraEntrada]  = React.useState(horaAhoraISO())
  const [fechaMuestreo,setFechaMuestreo]= React.useState("")
  const [recibidoPor,  setRecibidoPor]  = React.useState("")
  const [observaciones,setObservaciones]= React.useState("")
  const [ensayosSelec, setEnsayosSelec] = React.useState<number[]>([])
  const [guardando,    setGuardando]    = React.useState(false)
  const [busqueda,     setBusqueda]     = React.useState("")
  const [toastVisible, setToastVisible] = React.useState(false)

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
      // Valores por defecto del form
      if (cli.length > 0) setClienteId(String(cli[0].id))
      if (usu.length > 0) setRecibidoPor(String(usu[0].id))
      if (ens.length > 0) setEnsayosSelec([ens[0].id])
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
    setDescripcion(""); setFechaMuestreo(""); setObservaciones("")
    if (ensayos.length > 0) setEnsayosSelec([ensayos[0].id])
  }

  async function guardarMuestra() {
    if (!clienteId || !descripcion || ensayosSelec.length === 0) return
    setGuardando(true)
    try {
      const res = await fetch(`${API}/muestras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id:    Number(clienteId),
          descripcion,
          fecha_entrada: fechaEntrada,
          hora_entrada:  horaEntrada  || null,
          fecha_muestreo:fechaMuestreo|| null,
          recibido_por:  recibidoPor  ? Number(recibidoPor) : null,
          observaciones: observaciones|| null,
          ensayo_ids:    ensayosSelec,
        }),
      })
      if (res.ok) {
        // Refrescar la tabla
        const mu = await fetch(`${API}/muestras`)
        setMuestras(await mu.json())
        limpiarForm()
        setToastVisible(true)
      }
    } finally {
      setGuardando(false)
    }
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
            <Label htmlFor="cliente">
              Cliente <span className="text-red-500" aria-hidden>*</span>
            </Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger id="cliente"><SelectValue /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.numero_cliente} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500" aria-hidden>*</span>
            </Label>
            <Input
              id="descripcion"
              placeholder="Ej. 5 muestras de carne"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-entrada">
                Fecha entrada <span className="text-red-500" aria-hidden>*</span>
              </Label>
              <Input id="fecha-entrada" type="date" value={fechaEntrada}
                onChange={e => setFechaEntrada(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hora-entrada">Hora entrada</Label>
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
            <div className="flex flex-wrap gap-1.5">
              {ensayos.map(e => {
                const sel = ensayosSelec.includes(e.id)
                return (
                  <button key={e.id} type="button" onClick={() => toggleEnsayo(e.id)}
                    className={
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                      (sel
                        ? "border-teal-700 bg-teal-50 text-teal-700"
                        : "border-border bg-card text-muted-foreground hover:bg-muted")
                    }>
                    {e.codigo} · {e.nombre}
                    {sel ? <X className="size-3" /> : <Plus className="size-3" />}
                  </button>
                )
              })}
            </div>
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
        <CardFooter className="justify-between">
          <p className="text-[11px] text-muted-foreground">* Campos obligatorios</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={limpiarForm}>Limpiar</Button>
            <Button variant="secondary" onClick={guardarMuestra} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar muestra"}
            </Button>
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
                <TableHead>Entrada</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody className="[&_tr:last-child]:border-0">
              {muestrasFiltradas.length === 0 && (
                <tr>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                </motion.tr>
              ))}
            </motion.tbody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Toast
      message="Muestra guardada correctamente"
      visible={toastVisible}
      onClose={() => setToastVisible(false)}
    />
    </>
  )
}
