import * as React from "react"
import { Search, ChevronRight, Save, FlaskConical } from "lucide-react"
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

// --- Tipos ---
interface Analisis {
  id: number; muestra_id: number; ensayo_id: number
  numero_interno: number; descripcion: string; fecha_entrada: string
  cliente_nombre: string; numero_cliente: string
  ensayo_codigo: string; ensayo_nombre: string
}
interface Parametro {
  id: number; nombre: string; codigo: string; unidad: string
}
interface Usuario { id: number; iniciales: string; nombre: string }

const API = "http://localhost:3001"

function hoyISO()      { return new Date().toISOString().slice(0, 10) }
function horaAhoraISO() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}

export function CargaResultados() {
  // --- Datos de la API ---
  const [pendientes, setPendientes] = React.useState<Analisis[]>([])
  const [parametros, setParametros] = React.useState<Parametro[]>([])
  const [usuarios,   setUsuarios]   = React.useState<Usuario[]>([])
  const [cargando,   setCargando]   = React.useState(true)

  // --- Estado de la pantalla ---
  const [seleccionado, setSeleccionado] = React.useState<Analisis | null>(null)
  const [busqueda,     setBusqueda]     = React.useState("")

  // --- Estado del formulario ---
  const [fechaSiembra, setFechaSiembra] = React.useState(hoyISO())
  const [horaSiembra,  setHoraSiembra]  = React.useState(horaAhoraISO())
  const [analistaId,   setAnalistaId]   = React.useState("")
  const [revisorId,    setRevisorId]    = React.useState("")
  const [valores, setValores] = React.useState<Record<number, { valor: string; lectura: string }>>({})
  const [guardando, setGuardando] = React.useState(false)

  // --- Cargar pendientes y usuarios al abrir ---
  React.useEffect(() => {
    async function cargar() {
      const [penRes, usuRes] = await Promise.all([
        fetch(`${API}/analisis/pendientes`),
        fetch(`${API}/usuarios`),
      ])
      const pen = await penRes.json()
      const usu = await usuRes.json()
      setPendientes(pen)
      setUsuarios(usu)
      if (usu.length > 0) setAnalistaId(String(usu[0].id))
      setCargando(false)
    }
    cargar()
  }, [])

  // --- Al seleccionar un análisis, cargar sus parámetros ---
  async function seleccionar(a: Analisis) {
    setSeleccionado(a)
    setValores({})
    const res = await fetch(`${API}/ensayos/${a.ensayo_id}/parametros`)
    const params: Parametro[] = await res.json()
    setParametros(params)
    // Inicializar valores vacíos para cada parámetro
    const init: Record<number, { valor: string; lectura: string }> = {}
    params.forEach(p => { init[p.id] = { valor: "", lectura: "" } })
    setValores(init)
  }

  // --- Guardar resultados ---
  async function guardar() {
    if (!seleccionado) return
    setGuardando(true)
    try {
      const res = await fetch(`${API}/analisis/${seleccionado.id}/resultados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_siembra: fechaSiembra,
          hora_siembra:  horaSiembra || null,
          analista_id:   analistaId  ? Number(analistaId)  : null,
          revisor_id:    revisorId   ? Number(revisorId)   : null,
          resultados: parametros.map(p => ({
            parametro_id:     p.id,
            valor:            valores[p.id]?.valor   ?? "",
            lectura_dilucion: valores[p.id]?.lectura ?? "",
          })),
        }),
      })
      if (res.ok) {
        // Quitar este análisis de la lista (pasó a 'cargado')
        setPendientes(prev => prev.filter(a => a.id !== seleccionado.id))
        setSeleccionado(null)
        setParametros([])
        setValores({})
      }
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

  return (
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
                        isActive ? "bg-teal-50 hover:bg-teal-50" : ""
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
                <p className="text-sm text-muted-foreground">Cargando parámetros...</p>
              ) : (
                <div className="overflow-hidden rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parámetro</TableHead>
                        <TableHead className="w-20">Cód.</TableHead>
                        <TableHead className="w-44">Valor</TableHead>
                        <TableHead className="w-36">Lect. dilución</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parametros.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="text-sm">{p.nombre}</div>
                            <div className="text-xs text-muted-foreground">{p.unidad}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.codigo}
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder='Ej. <1.0*10(1)'
                              className="h-8 font-mono text-xs"
                              value={valores[p.id]?.valor ?? ""}
                              onChange={e => setValores(prev => ({
                                ...prev, [p.id]: { ...prev[p.id], valor: e.target.value }
                              }))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Opcional"
                              className="h-8 text-xs"
                              value={valores[p.id]?.lectura ?? ""}
                              onChange={e => setValores(prev => ({
                                ...prev, [p.id]: { ...prev[p.id], lectura: e.target.value }
                              }))}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
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
  )
}
