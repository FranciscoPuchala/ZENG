import * as React from "react"
import { FileCheck2, CheckCircle2, Printer, Eye } from "lucide-react"
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

// Análisis ya con resultados cargados, listos para agrupar en informe (mock)
const ANALISIS_CARGADOS = [
  {
    id: 10,
    muestra: 229037,
    cliente: { numero: "297", nombre: "Frigorífico Norte" },
    descripcion: "Pico 1",
    ensayo: { codigo: "140", nombre: "Ensayo 140 (a confirmar)" },
    fechaSiembra: "11/07/2026",
    analista: "D.Q.",
  },
  {
    id: 11,
    muestra: 229034,
    cliente: { numero: "297", nombre: "Frigorífico Norte" },
    descripcion: "Pico 2",
    ensayo: { codigo: "141", nombre: "Ensayo 141 (a confirmar)" },
    fechaSiembra: "10/07/2026",
    analista: "S.V.",
  },
  {
    id: 12,
    muestra: 229033,
    cliente: { numero: "439", nombre: "CLAY" },
    descripcion: "Producto terminado",
    ensayo: { codigo: "138", nombre: "Enterobacterias" },
    fechaSiembra: "10/07/2026",
    analista: "F.R.",
  },
]

export function CuadernoAnalisis() {
  const [seleccionados, setSeleccionados] = React.useState<number[]>([])

  function toggleSeleccion(id: number) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (seleccionados.length === ANALISIS_CARGADOS.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(ANALISIS_CARGADOS.map((a) => a.id))
    }
  }

  const todosSeleccionados =
    seleccionados.length === ANALISIS_CARGADOS.length && ANALISIS_CARGADOS.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Tabla de análisis listos para agrupar */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis listos para informe</CardTitle>
          <CardDescription>
            Seleccioná los análisis del mismo cliente para agruparlos en un
            informe y publicarlos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ANALISIS_CARGADOS.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <CheckCircle2 className="size-8 opacity-25" />
              <p className="text-sm">No hay análisis pendientes de publicación.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleTodos}
                      aria-label="Seleccionar todos"
                      className="size-4 cursor-pointer accent-teal-700"
                    />
                  </TableHead>
                  <TableHead>N° Muestra</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ensayo</TableHead>
                  <TableHead>F. Siembra</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ANALISIS_CARGADOS.map((a) => {
                  const isSelected = seleccionados.includes(a.id)
                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => toggleSeleccion(a.id)}
                      className={`cursor-pointer ${
                        isSelected ? "bg-teal-50 hover:bg-teal-50" : ""
                      }`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSeleccion(a.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Seleccionar análisis ${a.muestra}`}
                          className="size-4 cursor-pointer accent-teal-700"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        #{a.muestra}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {a.cliente.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.cliente.numero}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.descripcion}
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-800">
                          {a.ensayo.codigo}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.fechaSiembra}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.analista}
                      </TableCell>
                      <TableCell>
                        <Badge variant="cargado">Cargado</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Panel de agrupación — aparece cuando hay análisis seleccionados */}
      {seleccionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crear informe</CardTitle>
            <CardDescription>
              {seleccionados.length} análisis seleccionados para agrupar en un
              informe de ensayo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="num-informe">
                N° de informe{" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="num-informe" placeholder="Ej. 2026-0042" />
              <p className="text-[11px] text-muted-foreground">
                Regla exacta a confirmar en la 2ª visita.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-recepcion">Fecha de recepción</Label>
              <Input id="fecha-recepcion" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-emision">
                Fecha de emisión{" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="fecha-emision" type="date" />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-[11px] text-muted-foreground">
              * Campos obligatorios
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSeleccionados([])}>
                Cancelar
              </Button>
              <Button variant="outline">
                <Eye />
                Vista previa
              </Button>
              <Button variant="secondary">
                <Printer />
                Publicar informe
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Placeholder vista previa del informe */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground/50">
            Vista previa — Informe de Ensayo
          </CardTitle>
          <CardDescription>
            El formato exacto se define después de la 2ª visita al laboratorio
            (ver docs/ZENG - Checklist 2a visita.pdf). Acá irá la reproducción
            fiel del documento que hoy genera el sistema Access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-28 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
            <FileCheck2 className="size-7" />
            <p className="text-xs">Formato pendiente — 2ª visita al lab</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
