import * as React from "react"
import { API } from "@/lib/api"
import { Search, Beaker } from "lucide-react"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table"

interface Ensayo { id: number; codigo: string; nombre: string }
interface Parametro {
  id: number; codigo: string; descripcion: string
  unidad: string | null; tipo_valor: "numerico" | "presencia"
}
interface Metodologia { codigo: string; descripcion: string }
interface Plantilla {
  ensayo: Ensayo
  parametros: Parametro[]
  metodologias: Metodologia[]
}

export function EnsayosParametros() {
  const [ensayos, setEnsayos] = React.useState<Ensayo[]>([])
  const [busqueda, setBusqueda] = React.useState("")
  const [seleccionado, setSeleccionado] = React.useState<Ensayo | null>(null)
  const [plantilla, setPlantilla] = React.useState<Plantilla | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = React.useState(false)
  const [cargando, setCargando] = React.useState(true)

  React.useEffect(() => {
    fetch(`${API}/ensayos`)
      .then(r => r.json())
      .then(d => { setEnsayos(d); setCargando(false) })
  }, [])

  async function verEnsayo(e: Ensayo) {
    setSeleccionado(e)
    setPlantilla(null)
    setCargandoDetalle(true)
    const res = await fetch(`${API}/ensayos/${e.codigo}/plantilla`)
    const data = await res.json()
    setPlantilla(data)
    setCargandoDetalle(false)
  }

  const filtrados = ensayos.filter(e =>
    busqueda === "" ||
    e.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (cargando) return <p className="p-4 text-muted-foreground">Cargando catálogo…</p>

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">

      {/* Lista de ensayos */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Ensayos</CardTitle>
          <CardDescription>{ensayos.length} códigos registrados</CardDescription>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar ensayo"
              placeholder="Código o nombre…"
              className="pl-8"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[72vh] overflow-y-auto p-0">
          {filtrados.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para "{busqueda}"
            </p>
          ) : (
            <ul role="list">
              {filtrados.map(e => {
                const isActive = seleccionado?.id === e.id
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => verEnsayo(e)}
                      className={[
                        "flex w-full cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0",
                        isActive
                          ? "bg-teal-50 hover:bg-teal-50"
                          : "hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span className="w-10 shrink-0 font-mono text-xs font-semibold text-teal-700">
                        {e.codigo}
                      </span>
                      <span className="flex-1 text-sm leading-snug">{e.nombre}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detalle del ensayo */}
      {!seleccionado ? (
        <Card className="flex items-center justify-center" style={{ minHeight: 240 }}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Beaker className="size-8 opacity-25" />
            <p className="text-sm">Seleccioná un ensayo para ver sus parámetros y metodologías.</p>
          </div>
        </Card>
      ) : cargandoDetalle ? (
        <Card className="flex items-center justify-center" style={{ minHeight: 240 }}>
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </Card>
      ) : plantilla ? (
        <div className="flex flex-col gap-4">

          {/* Cabecera */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{plantilla.ensayo.nombre}</CardTitle>
                  <CardDescription>Código de ensayo: {plantilla.ensayo.codigo}</CardDescription>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <Badge variant="neutral">
                    {plantilla.parametros.length} parámetro{plantilla.parametros.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="neutral">
                    {plantilla.metodologias.length} metodología{plantilla.metodologias.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Parámetros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parámetros</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {plantilla.parametros.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">
                  Este ensayo no tiene parámetros registrados — el laboratorio carga los
                  resultados a mano fuera del sistema.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-28">Unidad</TableHead>
                      <TableHead className="w-24">Tipo de valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plantilla.parametros.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.codigo}
                        </TableCell>
                        <TableCell className="text-sm">{p.descripcion}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.unidad ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.tipo_valor === "presencia" ? "cargado" : "neutral"}>
                            {p.tipo_valor === "presencia" ? "− / +" : "numérico"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Metodologías */}
          {plantilla.metodologias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metodologías</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Código</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plantilla.metodologias.map(m => (
                      <TableRow key={m.codigo}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {m.codigo}
                        </TableCell>
                        <TableCell className="text-sm">{m.descripcion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
