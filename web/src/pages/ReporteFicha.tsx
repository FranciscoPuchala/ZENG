import * as React from "react"
import { createPortal } from "react-dom"
import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Tipos ────────────────────────────────────────────────────────────
export interface FichaAnalisis {
  id: number
  numero_interno: number
  descripcion: string
  fecha_entrada: string
  hora_entrada: string | null
  numero_cliente: string
  cliente_nombre: string
}

export interface FichaParametro {
  id: number
  codigo: string
  descripcion: string
  unidad: string | null
}

// ── Componente ───────────────────────────────────────────────────────
export function ReporteFicha({
  ensayo,
  analisis,
  parametros,
  fechaSiembra,
  horaSiembra,
  onCerrar,
}: {
  ensayo: { codigo: string; nombre: string }
  analisis: FichaAnalisis[]
  parametros: FichaParametro[]
  fechaSiembra: string
  horaSiembra: string
  onCerrar: () => void
}) {
  const portalRoot = React.useMemo(() => {
    const el = document.createElement("div")
    el.id = "reporte-ficha-root"
    return el
  }, [])

  React.useEffect(() => {
    document.body.appendChild(portalRoot)
    return () => { document.body.removeChild(portalRoot) }
  }, [portalRoot])

  return createPortal(
    <Layout
      ensayo={ensayo}
      analisis={analisis}
      parametros={parametros}
      fechaSiembra={fechaSiembra}
      horaSiembra={horaSiembra}
      onCerrar={onCerrar}
    />,
    portalRoot
  )
}

// ── Helpers de formato ───────────────────────────────────────────────
function ddmmaa(iso: string) {
  const [yyyy, mm, dd] = iso.split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

// "19/06/26-14:00" — mismo formato que muestra el sistema actual
function recepFmt(fecha: string, hora: string | null) {
  return hora ? `${ddmmaa(fecha)}-${hora}` : ddmmaa(fecha)
}

// "19/06/26 17:00"
function siemFmt(fecha: string, hora: string) {
  return hora ? `${ddmmaa(fecha)} ${hora}` : ddmmaa(fecha)
}

// "439/11435/26-06-19"
function nroAnalisis(nroCliente: string, nroInterno: number, siembra: string) {
  const [yyyy, mm, dd] = siembra.split("-")
  return `${nroCliente}/${nroInterno}/${yyyy.slice(2)}-${mm}-${dd}`
}

function fechaHoyLarga() {
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date())
}

// ── Estilos de celda reutilizables ───────────────────────────────────
const TH: React.CSSProperties = {
  border: "1px solid #999",
  padding: "2px 4px",
  fontWeight: 700,
  fontSize: "6.8pt",
  backgroundColor: "#e8e8e8",
  textAlign: "center",
  verticalAlign: "middle",
}
const TD: React.CSSProperties = {
  border: "1px solid #999",
  padding: "3px 5px",
  fontSize: "7.5pt",
  height: 22,
  verticalAlign: "middle",
}

// ── Layout del documento ─────────────────────────────────────────────
function Layout({ ensayo, analisis, parametros, fechaSiembra, horaSiembra, onCerrar }: {
  ensayo: { codigo: string; nombre: string }
  analisis: FichaAnalisis[]
  parametros: FichaParametro[]
  fechaSiembra: string
  horaSiembra: string
  onCerrar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      {/* Barra — oculta al imprimir */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-2.5 shadow-sm">
        <span className="text-sm font-medium text-gray-700">
          Reporte de Ficha — {ensayo.nombre} ({analisis.length} muestras)
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCerrar}>
            <X /> Cerrar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
        </div>
      </div>

      {/* Cuerpo */}
      <div
        className="mx-auto my-6 max-w-[210mm] bg-white"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "8pt" }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
          <span style={{ fontStyle: "italic", fontWeight: 700, fontSize: "12pt" }}>
            {ensayo.nombre}
          </span>
          <div style={{ textAlign: "right", fontSize: "8pt" }}>
            <b>Ensayo: {ensayo.codigo}</b>
            {"    "}Página:{"  "}
            <span style={{ display: "inline-block", minWidth: 28, borderBottom: "1px solid #000" }}> </span>
          </div>
        </div>
        <div style={{ textAlign: "right", marginBottom: 10, fontSize: "8pt" }}>
          Emitido: {fechaHoyLarga()}
        </div>

        {/*
          Un bloque por muestra.
          Cada parámetro tiene su propio renglón con Resultado y Lectura/Dilución.
          Las celdas de muestra/recepción/siembra/N°A se fusionan verticalmente (rowspan)
          para no repetirlas en cada parámetro.
        */}
        {analisis.map(a => {
          return (
            <table key={a.id} style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "4%" }} />
              </colgroup>
              <tbody>
                {/* Fila de encabezados de columna */}
                <tr>
                  <th style={TH}>Muestra</th>
                  <th style={TH}>Recepcion</th>
                  <th style={TH}>Siembra</th>
                  <th style={TH}>Parámetro</th>
                  <th style={TH}>Resultado</th>
                  <th style={TH}>Lectura/<br/>Dilución</th>
                  <th style={TH}>Confirma</th>
                  <th style={TH}>N°Análisis</th>
                  <th style={TH}>Analista</th>
                  <th style={TH}>Revisado</th>
                </tr>

                {/* Sin parámetros: una fila vacía */}
                {parametros.length === 0 ? (
                  <tr>
                    <td style={TD}>{a.numero_interno}</td>
                    <td style={TD}>{recepFmt(a.fecha_entrada, a.hora_entrada)}</td>
                    <td style={TD}>{siemFmt(fechaSiembra, horaSiembra)}</td>
                    <td style={TD} colSpan={3}></td>
                    <td style={TD}></td>
                    <td style={{ ...TD, fontSize: "6.8pt" }}>
                      {nroAnalisis(a.numero_cliente, a.numero_interno, fechaSiembra)}
                    </td>
                    <td style={TD}></td>
                    <td style={TD}></td>
                  </tr>
                ) : (
                  /* Una fila completa por parámetro — muestra/recepción/siembra se repiten */
                  parametros.map(p => (
                    <tr key={p.id}>
                      <td style={TD}>{a.numero_interno}</td>
                      <td style={TD}>{recepFmt(a.fecha_entrada, a.hora_entrada)}</td>
                      <td style={TD}>{siemFmt(fechaSiembra, horaSiembra)}</td>
                      <td style={{ ...TD, fontWeight: 700, textTransform: "uppercase", fontSize: "7pt" }}>
                        {p.descripcion}{p.unidad ? ` (${p.unidad})` : ""}
                      </td>
                      <td style={TD}></td>
                      <td style={TD}></td>
                      <td style={TD}></td>
                      <td style={{ ...TD, fontSize: "6.8pt" }}>
                        {nroAnalisis(a.numero_cliente, a.numero_interno, fechaSiembra)}
                      </td>
                      <td style={TD}></td>
                      <td style={TD}></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )
        })}
      </div>
    </div>
  )
}
