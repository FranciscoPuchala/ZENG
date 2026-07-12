import * as React from "react"
import { Search, ChevronRight, Save, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

// Análisis pendientes de carga (mock)
const ANALISIS_PENDIENTES = [
  {
    id: 1,
    muestra: 229038,
    cliente: "439 — CLAY",
    descripcion: "5 muestras de carne",
    ensayo: { codigo: "138", nombre: "Enterobacterias" },
    fechaEntrada: "11/07/2026",
  },
  {
    id: 2,
    muestra: 229039,
    cliente: "297 — Frigorífico Norte",
    descripcion: "Agua de proceso",
    ensayo: { codigo: "140", nombre: "Ensayo 140 (a confirmar)" },
    fechaEntrada: "11/07/2026",
  },
  {
    id: 3,
    muestra: 229040,
    cliente: "245 — Lácteos del Sur",
    descripcion: "Leche pasteurizada",
    ensayo: { codigo: "121", nombre: "Ensayo 121 (a confirmar)" },
    fechaEntrada: "11/07/2026",
  },
]

// Parámetros placeholder — mapeo real ensayo→parámetros se confirma en la 2ª visita
const PARAMETROS_PLACEHOLDER = [
  { id: 1, nombre: "Parámetro A (a confirmar)", codigo: "P-01", unidad: "ufc/g" },
  { id: 2, nombre: "Parámetro B (a confirmar)", codigo: "P-02", unidad: "ufc/g" },
]

const USUARIOS = [
  { iniciales: "sv", nombre: "S.V." },
  { iniciales: "dq", nombre: "D.Q." },
  { iniciales: "fr", nombre: "F.R." },
]

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
function horaAhoraISO() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function CargaResultados() {
  const [seleccionado, setSeleccionado] = React.useState<number | null>(null)
  const [busqueda, setBusqueda] = React.useState("")

  const analisisVisto =
    seleccionado !== null
      ? ANALISIS_PENDIENTES.find((a) => a.id === seleccionado)
      : null

  const filtrados = ANALISIS_PENDIENTES.filter(
    (a) =>
      busqueda === "" ||
      a.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(a.muestra).includes(busqueda)
  )

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      {/* Lista de análisis pendientes */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Análisis pendientes</CardTitle>
          <CardDescription>
            Seleccioná uno para cargar sus resultados
          </CardDescription>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar análisis por N° o cliente"
              placeholder="N° muestra o cliente..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
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
              {filtrados.map((a) => {
                const isActive = seleccionado === a.id
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSeleccionado(a.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 border-b border-border px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-muted/50 ${
                        isActive ? "bg-teal-50 hover:bg-teal-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{a.muestra}
                          </span>
                          <Badge variant="pendiente">Pendiente</Badge>
                        </div>
                        <div className="mt-0.5 truncate text-sm font-medium">
                          {a.cliente}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.descripcion}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          Ensayo {a.ensayo.codigo} · {a.ensayo.nombre}
                        </div>
                      </div>
                      <ChevronRight
                        className={`size-4 shrink-0 transition-colors ${
                          isActive ? "text-teal-700" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Formulario de carga */}
      {analisisVisto ? (
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Carga de resultados</CardTitle>
                <CardDescription>
                  Muestra #{analisisVisto.muestra} · {analisisVisto.cliente} ·
                  Ensayo {analisisVisto.ensayo.codigo}
                </CardDescription>
              </div>
              <Badge variant="pendiente">Pendiente</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fecha-siembra">
                  Fecha de siembra{" "}
                  <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="fecha-siembra"
                  type="date"
                  defaultValue={hoyISO()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hora-siembra">Hora de siembra</Label>
                <Input
                  id="hora-siembra"
                  type="time"
                  defaultValue={horaAhoraISO()}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="analista">
                  Analista{" "}
                  <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Select defaultValue={USUARIOS[0].iniciales}>
                  <SelectTrigger id="analista">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USUARIOS.map((u) => (
                      <SelectItem key={u.iniciales} value={u.iniciales}>
                        {u.nombre} ({u.iniciales})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="revisor">Revisado por</Label>
                <Select>
                  <SelectTrigger id="revisor">
                    <SelectValue placeholder="Seleccioná..." />
                  </SelectTrigger>
                  <SelectContent>
                    {USUARIOS.map((u) => (
                      <SelectItem key={u.iniciales} value={u.iniciales}>
                        {u.nombre} ({u.iniciales})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de parámetros y valores */}
            <div className="flex flex-col gap-2">
              <Label>
                Parámetros y resultados{" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
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
                    {PARAMETROS_PLACEHOLDER.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="text-sm">{p.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.unidad}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.codigo}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Ej. <1.0*10(1)"
                            className="h-8 font-mono text-xs"
                            aria-label={`Valor para ${p.nombre}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Opcional"
                            className="h-8 text-xs"
                            aria-label={`Lectura dilución para ${p.nombre}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Parámetros placeholder — mapeo completo ensayo → parámetros se
                confirma en la 2ª visita al laboratorio.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-[11px] text-muted-foreground">
              * Campos obligatorios
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSeleccionado(null)}>
                Cancelar
              </Button>
              <Button variant="secondary">
                <Save />
                Guardar resultados
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="flex h-52 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <FlaskConical className="size-8 opacity-25" />
            <p className="text-sm">
              Seleccioná un análisis de la lista para cargar sus resultados.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
