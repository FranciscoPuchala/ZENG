import * as React from "react"
import { API } from "@/lib/api"
import { Search, Users, ChevronRight, Printer } from "lucide-react"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table"
import { InformeImpresion } from "@/pages/InformeImpresion"

interface Cliente {
  id: number
  numero_cliente: string
  nombre: string
  direccion: string | null
  telefono: string | null
}

interface AnalisisCliente {
  id: number
  estado: "pendiente" | "cargado" | "publicado"
  fecha_siembra: string | null
  numero_interno: number
  descripcion: string
  fecha_entrada: string
  numero_cliente: string
  ensayo_codigo: string
  ensayo_nombre: string
  informe_id: number | null
  numero_informe: string | null
  fecha_emision: string | null
  numero_cliente_secuencial: number
}

function ddmmaa(iso: string | null) {
  if (!iso) return "—"
  const [yyyy, mm, dd] = iso.split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

function nroAnalisis(nroCliente: string, seq: number, siembra: string | null) {
  if (!siembra) return `${nroCliente}/${seq}/—`
  const [yyyy, mm, dd] = siembra.split("T")[0].split("-")
  return `${nroCliente}/${seq}/${yyyy.slice(2)}-${mm}-${dd}`
}

const ESTADO_BADGE: Record<string, { label: string; variant: "pendiente" | "cargado" | "publicado" }> = {
  pendiente: { label: "Pendiente", variant: "pendiente" },
  cargado:   { label: "Cargado",   variant: "cargado"   },
  publicado: { label: "Publicado", variant: "publicado" },
}

export function Clientes() {
  const [clientes, setClientes]           = React.useState<Cliente[]>([])
  const [busqCliente, setBusqCliente]     = React.useState("")
  const [selCliente, setSelCliente]       = React.useState<Cliente | null>(null)
  const [analisis, setAnalisis]           = React.useState<AnalisisCliente[]>([])
  const [cargandoAn, setCargandoAn]       = React.useState(false)
  const [busqAnalisis, setBusqAnalisis]   = React.useState("")
  const [informeId, setInformeId]         = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch(`${API}/clientes`)
      .then(r => r.json())
      .then(setClientes)
  }, [])

  async function verCliente(c: Cliente) {
    setSelCliente(c)
    setAnalisis([])
    setBusqAnalisis("")
    setCargandoAn(true)
    const res = await fetch(`${API}/clientes/${c.id}/analisis`)
    const data = await res.json()
    setAnalisis(data)
    setCargandoAn(false)
  }

  // Filtro de clientes
  const clientesFiltrados = clientes.filter(c =>
    busqCliente === "" ||
    c.nombre.toLowerCase().includes(busqCliente.toLowerCase()) ||
    c.numero_cliente.toLowerCase().includes(busqCliente.toLowerCase())
  )

  // Filtro de análisis — busca en todos los campos visibles
  const analisisFiltrados = React.useMemo(() => {
    if (!busqAnalisis.trim()) return analisis
    const q = busqAnalisis.toLowerCase()
    return analisis.filter(a => {
      const nroA = nroAnalisis(a.numero_cliente, a.numero_cliente_secuencial, a.fecha_siembra).toLowerCase()
      return (
        String(a.numero_interno).includes(q) ||
        a.ensayo_codigo.toLowerCase().includes(q) ||
        a.ensayo_nombre.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        (a.numero_informe ?? "").toLowerCase().includes(q) ||
        ddmmaa(a.fecha_entrada).includes(q) ||
        ddmmaa(a.fecha_siembra).includes(q) ||
        ddmmaa(a.fecha_emision).includes(q) ||
        nroA.includes(q)
      )
    })
  }, [analisis, busqAnalisis])

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">

      {/* ── Lista de clientes ── */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>{clientes.length} registrados</CardDescription>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar cliente"
              placeholder="Nombre o número…"
              className="pl-8"
              value={busqCliente}
              onChange={e => setBusqCliente(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[72vh] overflow-y-auto p-0">
          {clientesFiltrados.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para "{busqCliente}"
            </p>
          ) : (
            <ul role="list">
              {clientesFiltrados.map(c => {
                const isActive = selCliente?.id === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => verCliente(c)}
                      className={[
                        "flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0",
                        isActive ? "bg-teal-50" : "hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span className="w-12 shrink-0 font-mono text-xs font-semibold text-teal-700">
                        {c.numero_cliente}
                      </span>
                      <span className="flex-1 text-sm leading-snug">{c.nombre}</span>
                      {isActive && <ChevronRight className="size-3.5 shrink-0 text-teal-600" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Panel derecho ── */}
      {!selCliente ? (
        <Card className="flex items-center justify-center" style={{ minHeight: 240 }}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Users className="size-8 opacity-25" />
            <p className="text-sm">Seleccioná un cliente para ver su historial.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">

          {/* Encabezado del cliente */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{selCliente.nombre}</CardTitle>
                  <CardDescription>
                    Nº {selCliente.numero_cliente}
                    {selCliente.direccion && ` · ${selCliente.direccion}`}
                    {selCliente.telefono  && ` · ${selCliente.telefono}`}
                  </CardDescription>
                </div>
                <Badge variant="neutral">
                  {analisis.length} análisis
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Buscador de análisis */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar en análisis"
              placeholder="Buscar por ensayo, N° informe, N° análisis, fecha, descripción…"
              className="pl-9"
              value={busqAnalisis}
              onChange={e => setBusqAnalisis(e.target.value)}
            />
          </div>

          {/* Tabla de análisis */}
          <Card>
            <CardContent className="p-0">
              {cargandoAn ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando…</p>
              ) : analisisFiltrados.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {busqAnalisis ? `Sin resultados para "${busqAnalisis}"` : "Este cliente no tiene análisis registrados."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Análisis</TableHead>
                        <TableHead>N° Muestra</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Ensayo</TableHead>
                        <TableHead>F. Recepción</TableHead>
                        <TableHead>F. Siembra</TableHead>
                        <TableHead>N° Informe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analisisFiltrados.map(a => {
                        const est = ESTADO_BADGE[a.estado] ?? ESTADO_BADGE.pendiente
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono text-xs">
                              {nroAnalisis(a.numero_cliente, a.numero_cliente_secuencial, a.fecha_siembra)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              #{a.numero_interno}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-sm" title={a.descripcion}>
                              {a.descripcion}
                            </TableCell>
                            <TableCell>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                {a.ensayo_codigo}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {ddmmaa(a.fecha_entrada)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {ddmmaa(a.fecha_siembra)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {a.numero_informe ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={est.variant}>{est.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {a.informe_id !== null && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ver informe"
                                  onClick={() => setInformeId(a.informe_id!)}
                                >
                                  <Printer className="size-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vista de impresión del informe */}
      {informeId !== null && (
        <InformeImpresion
          informeId={informeId}
          onCerrar={() => setInformeId(null)}
          modoConfirmacion={false}
        />
      )}
    </div>
  )
}
