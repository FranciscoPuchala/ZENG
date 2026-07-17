import * as React from "react"
import { FileCheck2, CheckCircle2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table"

interface Analisis {
  id: number
  muestra_id: number
  ensayo_id: number
  numero_interno: number
  descripcion: string
  fecha_entrada: string
  cliente_id: number
  cliente_nombre: string
  numero_cliente: string
  ensayo_codigo: string
  ensayo_nombre: string
  fecha_siembra: string | null
}

const API = "http://localhost:3001"

function formatFecha(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function CuadernoAnalisis() {
  const [cargados, setCargados]           = React.useState<Analisis[]>([])
  const [cargando, setCargando]           = React.useState(true)
  const [seleccionados, setSeleccionados] = React.useState<number[]>([])
  const [publicando, setPublicando]       = React.useState(false)
  const [toastVisible, setToastVisible]   = React.useState(false)
  const [toastMsg, setToastMsg]           = React.useState("")

  // Formulario
  const [numeroInforme,  setNumeroInforme]  = React.useState("")
  const [fechaRecepcion, setFechaRecepcion] = React.useState("")
  const [fechaEmision,   setFechaEmision]   = React.useState("")

  React.useEffect(() => {
    fetch(`${API}/analisis/cargados`)
      .then(r => r.json())
      .then(data => { setCargados(data); setCargando(false) })
  }, [])

  // Cliente "bloqueado" — el del primer seleccionado
  const clienteId = seleccionados.length > 0
    ? (cargados.find(a => a.id === seleccionados[0])?.cliente_id ?? null)
    : null

  function toggleSeleccion(a: Analisis) {
    if (clienteId !== null && a.cliente_id !== clienteId) return
    setSeleccionados(prev =>
      prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]
    )
  }

  function toggleTodos() {
    const elegibles = clienteId !== null
      ? cargados.filter(a => a.cliente_id === clienteId)
      : cargados
    setSeleccionados(
      seleccionados.length === elegibles.length ? [] : elegibles.map(a => a.id)
    )
  }

  async function publicar() {
    if (!seleccionados.length || !numeroInforme || !fechaEmision) return
    const primero = cargados.find(a => a.id === seleccionados[0])!
    setPublicando(true)
    try {
      const res = await fetch(`${API}/informes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id:      primero.cliente_id,
          numero_informe:  numeroInforme,
          fecha_recepcion: fechaRecepcion || null,
          fecha_emision:   fechaEmision,
          analisis_ids:    seleccionados,
        }),
      })
      if (res.ok) {
        setCargados(prev => prev.filter(a => !seleccionados.includes(a.id)))
        setSeleccionados([])
        setNumeroInforme("")
        setFechaRecepcion("")
        setFechaEmision("")
        setToastMsg(`Informe ${numeroInforme} publicado correctamente.`)
        setToastVisible(true)
      }
    } finally {
      setPublicando(false)
    }
  }

  const primerSel = cargados.find(a => a.id === seleccionados[0])
  const elegibles = clienteId !== null
    ? cargados.filter(a => a.cliente_id === clienteId)
    : cargados
  const todosSeleccionados = seleccionados.length > 0 && seleccionados.length === elegibles.length

  if (cargando) return <p className="p-4 text-muted-foreground">Cargando...</p>

  return (
    <div className="flex flex-col gap-6">

      {/* Tabla de análisis cargados */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis listos para informe</CardTitle>
          <CardDescription>
            Seleccioná los análisis del mismo cliente para agruparlos en un informe y publicarlos.
            {clienteId !== null && (
              <span className="ml-1 font-medium text-teal-700">
                {" "}Sólo podés combinar análisis de {primerSel?.cliente_nombre} ({primerSel?.numero_cliente}).
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {cargados.length === 0 ? (
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
                      aria-label="Seleccionar todos del cliente activo"
                      className="size-4 cursor-pointer accent-teal-700"
                    />
                  </TableHead>
                  <TableHead>N° Muestra</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ensayo</TableHead>
                  <TableHead>F. Siembra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargados.map(a => {
                  const isSel      = seleccionados.includes(a.id)
                  const isDisabled = clienteId !== null && a.cliente_id !== clienteId
                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => !isDisabled && toggleSeleccion(a)}
                      className={[
                        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                        isSel ? "bg-teal-50 hover:bg-teal-50" : !isDisabled ? "hover:bg-muted/40" : "",
                      ].join(" ")}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSel}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && toggleSeleccion(a)}
                          onClick={e => e.stopPropagation()}
                          aria-label={`Seleccionar análisis ${a.numero_interno}`}
                          className="size-4 cursor-pointer accent-teal-700 disabled:cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{a.numero_interno}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{a.cliente_nombre}</div>
                        <div className="text-xs text-muted-foreground">{a.numero_cliente}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.descripcion}</TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {a.ensayo_codigo}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFecha(a.fecha_siembra)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulario de informe — aparece al seleccionar */}
      {seleccionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crear informe</CardTitle>
            <CardDescription>
              {seleccionados.length} análisis de{" "}
              <span className="font-medium text-foreground">{primerSel?.cliente_nombre}</span>{" "}
              ({primerSel?.numero_cliente}) seleccionados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="num-informe">
                N° de informe <span className="text-red-500" aria-hidden>*</span>
              </Label>
              <Input
                id="num-informe"
                placeholder="Ej. 2026-0042"
                value={numeroInforme}
                onChange={e => setNumeroInforme(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Regla exacta a confirmar en la 2ª visita.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-recepcion">Fecha de recepción</Label>
              <Input
                id="fecha-recepcion"
                type="date"
                value={fechaRecepcion}
                onChange={e => setFechaRecepcion(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-emision">
                Fecha de emisión <span className="text-red-500" aria-hidden>*</span>
              </Label>
              <Input
                id="fecha-emision"
                type="date"
                value={fechaEmision}
                onChange={e => setFechaEmision(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-[11px] text-muted-foreground">* Campos obligatorios</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSeleccionados([])}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={publicar}
                disabled={publicando || !numeroInforme || !fechaEmision}
              >
                <Printer />
                {publicando ? "Publicando…" : "Publicar informe"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Placeholder PDF */}
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

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}
