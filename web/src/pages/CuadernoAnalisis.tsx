import * as React from "react"
import { apiFetch } from "@/lib/api"
import { FileCheck2, CheckCircle2, Printer, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
import { InformeImpresion } from "@/pages/InformeImpresion"
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

interface InformePublicado {
  id: number
  numero_informe: string
  fecha_emision: string | null
  cliente_nombre: string
  numero_cliente: string
  ensayo_codigo: string | null
  ensayo_nombre: string | null
  cantidad_analisis: number
}

function formatFecha(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function CuadernoAnalisis() {
  const [cargados, setCargados]                   = React.useState<Analisis[]>([])
  const [cargando, setCargando]                   = React.useState(true)
  const [seleccionados, setSeleccionados]         = React.useState<number[]>([])
  const [publicando, setPublicando]               = React.useState(false)
  const [informeId, setInformeId]                 = React.useState<number | null>(null)
  const [toastVisible, setToastVisible]           = React.useState(false)
  const [toastMsg, setToastMsg]                   = React.useState("")
  const [informesPublicados, setInformesPublicados] = React.useState<InformePublicado[]>([])
  const [idsRecienPublicados, setIdsRecienPublicados] = React.useState<number[]>([])
  const refInformesPublicados = React.useRef<HTMLDivElement>(null)

  // Formulario — fechaEmision arranca con hoy para que el N° se genere al toque
  const [numeroInforme,  setNumeroInforme]  = React.useState("")
  const [fechaRecepcion, setFechaRecepcion] = React.useState("")
  const [fechaEmision,   setFechaEmision]   = React.useState(
    () => new Date().toISOString().split("T")[0]
  )

  function cargarInformes() {
    apiFetch('/informes')
      .then(r => r.ok ? r.json() : [])
      .then(setInformesPublicados)
      .catch(() => {})
  }

  async function marcarImpreso(id: number) {
    await apiFetch(`/informes/${id}/impreso`, { method: "PUT" })
    setInformesPublicados(prev => prev.filter(i => i.id !== id))
  }

  React.useEffect(() => {
    apiFetch('/analisis/cargados')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCargados(data); setCargando(false) })
      .catch(() => setCargando(false))
    cargarInformes()
  }, [])

  // Auto-genera N° de INFORME y pre-rellena fecha de recepción desde la muestra
  React.useEffect(() => {
    if (seleccionados.length === 0 || !fechaEmision) { setNumeroInforme(""); return }
    const primero = cargados.find(a => a.id === seleccionados[0])
    if (!primero) return
    const [yyyy, mm, dd] = fechaEmision.split("-")
    setNumeroInforme(`${primero.numero_cliente}/${primero.ensayo_codigo}/${yyyy.slice(2)}-${mm}-${dd}`)
    setFechaRecepcion(primero.fecha_entrada.split("T")[0])
  }, [seleccionados, fechaEmision, cargados])

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
      const res = await apiFetch('/informes', {
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
        const creado = await res.json()
        const idsPublicados = seleccionados
        // Sacar inmediatamente los análisis de la lista — evita doble publicación
        setCargados(prev => prev.filter(a => !idsPublicados.includes(a.id)))
        setIdsRecienPublicados(idsPublicados)
        setSeleccionados([])
        setNumeroInforme("")
        setFechaRecepcion("")
        setFechaEmision(new Date().toISOString().split("T")[0])
        cargarInformes()
        setInformeId(creado.id)
      } else {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? "Error al publicar el informe")
      }
    } catch {
      alert("Error de conexión con el servidor")
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
                placeholder="Se genera al elegir fecha de emisión"
                value={numeroInforme}
                onChange={e => setNumeroInforme(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Auto-generado como cliente/ensayo/AA-MM-DD. Podés agregar el número de secuencia al final si es necesario (ej. -2).
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

      {/* Informes publicados — para reimprimir en cualquier momento */}
      <div ref={refInformesPublicados}>
      <Card>
        <CardHeader>
          <CardTitle>Informes publicados</CardTitle>
          <CardDescription>Hacé click en "Imprimir" para volver a ver cualquier informe.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {informesPublicados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <FileCheck2 className="size-7 opacity-25" />
              <p className="text-sm">Todavía no hay informes publicados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° de informe</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ensayo</TableHead>
                  <TableHead>F. emisión</TableHead>
                  <TableHead className="w-10 text-center">Muestras</TableHead>
                  <TableHead className="w-44"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {informesPublicados.map(inf => (
                  <TableRow key={inf.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {inf.numero_informe}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{inf.cliente_nombre}</div>
                      <div className="text-xs text-muted-foreground">{inf.numero_cliente}</div>
                    </TableCell>
                    <TableCell>
                      {inf.ensayo_codigo ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {inf.ensayo_codigo}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFecha(inf.fecha_emision)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {inf.cantidad_analisis}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInformeId(inf.id)}
                        >
                          <Printer className="mr-1 size-3.5" />
                          Imprimir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 hover:bg-green-50 hover:text-green-800 border-green-200"
                          onClick={() => marcarImpreso(inf.id)}
                          title="Marcar como entregado y sacar de la lista"
                        >
                          <CheckCheck className="mr-1 size-3.5" />
                          Impreso
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Vista de impresión — aparece tras publicar */}
      {informeId !== null && (
        <InformeImpresion
          informeId={informeId}
          modoConfirmacion={idsRecienPublicados.length > 0}
          onCerrar={(confirmado) => {
            setInformeId(null)
            if (confirmado && idsRecienPublicados.length > 0) {
              setIdsRecienPublicados([])
              setToastMsg("Informe publicado correctamente.")
              setToastVisible(true)
            }
            setTimeout(() => {
              refInformesPublicados.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 50)
          }}
        />
      )}
    </div>
  )
}
