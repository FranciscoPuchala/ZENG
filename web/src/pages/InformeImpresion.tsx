import * as React from "react"
import { API } from "@/lib/api"
import { createPortal } from "react-dom"
import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Tipos ────────────────────────────────────────────────────────────
interface Informe {
  id: number; numero_informe: string
  fecha_muestreo: string | null; fecha_recepcion: string | null
  fecha_analisis: string | null; fecha_emision: string | null
  cliente_nombre: string; numero_cliente: string
  direccion: string | null; telefono: string | null; fax: string | null
}
interface Resultado {
  descripcion: string; unidad: string | null
  valor: string | null; lectura_dilucion: string | null
}
interface Analisis {
  id: number; numero_interno: number; numero_cliente_secuencial: number
  descripcion: string; fecha_siembra: string | null; resultados: Resultado[]
}
interface Metodologia { codigo: string; descripcion: string }
interface ReporteData {
  informe: Informe
  ensayo: { codigo: string; nombre: string }
  analisis: Analisis[]
  metodologias: Metodologia[]
}

// ── Helpers de formato ───────────────────────────────────────────────
function ddmmaa(iso: string | null) {
  if (!iso) return "—"
  const [yyyy, mm, dd] = iso.split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

// Formato N° ANÁLISIS: cliente/nroClienteSecuencial/AA-MM-DD
function nroAnalisis(numeroCliente: string, nroClienteSecuencial: number, fechaSiembra: string | null) {
  if (!fechaSiembra) return `${numeroCliente}/${nroClienteSecuencial}/—`
  const [yyyy, mm, dd] = fechaSiembra.split("T")[0].split("-")
  return `${numeroCliente}/${nroClienteSecuencial}/${yyyy.slice(2)}-${mm}-${dd}`
}

// ── Componente principal ─────────────────────────────────────────────
export function InformeImpresion({
  informeId,
  onCerrar,
  modoConfirmacion = false,
}: {
  informeId: number
  onCerrar: (confirmado?: boolean) => void
  modoConfirmacion?: boolean
}) {
  const [data, setData] = React.useState<ReporteData | null>(null)
  const [cargando, setCargando] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch(`${API}/informes/${informeId}/reporte`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setCargando(false) })
      .catch(e => { setError(e.message); setCargando(false) })
  }, [informeId])

  // Crear el nodo del portal una sola vez
  const portalRoot = React.useMemo(() => {
    const el = document.createElement("div")
    el.id = "informe-print-root"
    return el
  }, [])
  React.useEffect(() => {
    document.body.appendChild(portalRoot)
    return () => { document.body.removeChild(portalRoot) }
  }, [portalRoot])

  const contenido = error
    ? (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white">
        <p className="text-sm font-semibold text-red-600">Error cargando informe: {error}</p>
        <p className="text-xs text-gray-500">Asegurate de que el servidor API esté corriendo con los endpoints nuevos (reiniciarlo).</p>
        <button onClick={() => onCerrar(false)} className="mt-2 rounded border px-4 py-1.5 text-sm hover:bg-gray-50">Cerrar</button>
      </div>
    )
    : cargando || !data
    ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Cargando informe…</p>
      </div>
    )
    : <InformeLayout data={data} onCerrar={onCerrar} modoConfirmacion={modoConfirmacion} />

  return createPortal(contenido, portalRoot)
}

// ── Layout del informe ───────────────────────────────────────────────
function InformeLayout({
  data, onCerrar, modoConfirmacion,
}: {
  data: ReporteData
  onCerrar: (confirmado?: boolean) => void
  modoConfirmacion: boolean
}) {
  const { informe, ensayo, analisis, metodologias } = data

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">

      {/* Barra de herramientas — se oculta al imprimir */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-2.5 shadow-sm">
        <div className="text-sm font-medium text-gray-700">
          Informe {informe.numero_informe}
          <span className="ml-2 text-gray-400">· {ensayo.nombre}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onCerrar(false)}>
            <X /> Cerrar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.print()
              onCerrar(modoConfirmacion)
            }}
          >
            <Printer /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Cuerpo del informe — A4 centrado */}
      <div
        className="mx-auto my-6 max-w-[170mm] bg-white px-0 text-black"
        style={{ fontFamily: "Times New Roman, serif", fontSize: "11pt", lineHeight: 1.35 }}
      >
        {/* ── Cabecera ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <img src="/logo.png" alt="ZENG" style={{ height: 52, objectFit: "contain" }} />
          <div style={{ textAlign: "right", fontSize: "8pt", color: "#555", lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700 }}>ORGANISMO URUGUAYO</div>
            <div style={{ fontWeight: 700 }}>DE ACREDITACIÓN</div>
            <div>Laboratorio de Ensayo</div>
            <div style={{ fontWeight: 700 }}>LE 006</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: "9pt", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#444", marginBottom: 4 }}>
          LABORATORIO MICROBIOLÓGICO
        </div>

        <div style={{ textAlign: "center", fontSize: "15pt", fontWeight: 700, marginBottom: 14 }}>
          Informe de Ensayo de<br />
          {ensayo.nombre}
        </div>

        {/* ── Bloque cliente / informe ─────────────────── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: 12 }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", border: "1px solid black", padding: "5px 7px", verticalAlign: "top", borderRight: "none" }}>
                <div><b>Cliente</b>{"  "}{informe.cliente_nombre}</div>
                {informe.direccion && <div><b>Dirección</b>{"  "}{informe.direccion}</div>}
                {informe.telefono  && <div><b>Teléfono</b>{"  "}{informe.telefono}</div>}
                {informe.fax       && <div><b>Fax</b>{"  "}{informe.fax}</div>}
              </td>
              <td style={{ width: "50%", border: "1px solid black", padding: "5px 7px", verticalAlign: "top" }}>
                <div><b>N° de INFORME</b>{"  "}{informe.numero_informe}</div>
                <div><b>Fecha de muestreo</b>{"  "}{ddmmaa(informe.fecha_muestreo)}</div>
                <div><b>Fecha de recepción</b>{"  "}{ddmmaa(informe.fecha_recepcion)}</div>
                <div><b>Fecha de análisis</b>{"  "}{ddmmaa(informe.fecha_analisis)}</div>
                <div><b>Fecha de emisión del informe</b>{"  "}{ddmmaa(informe.fecha_emision)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Bloques por análisis ─────────────────────── */}
        {analisis.map(a => (
          <table key={a.id} style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: 6 }}>
            <tbody>
              {/* Cabecera del análisis */}
              <tr>
                <td style={{ width: "42%", border: "1px solid black", borderRight: "none", padding: "4px 7px", fontWeight: 700, verticalAlign: "top" }}>
                  N° de ANÁLISIS{"  "}
                  {nroAnalisis(informe.numero_cliente, a.numero_cliente_secuencial, a.fecha_siembra)}
                </td>
                <td style={{ border: "1px solid black", padding: "4px 7px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700 }}>DESCRIPCION DE LA MUESTRA</div>
                  <div>{a.descripcion}</div>
                </td>
              </tr>

              {/* Filas de resultados */}
              {a.resultados.map((r, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid black", borderTop: "none", borderRight: "none", padding: "3px 7px" }}>
                    {r.descripcion}{r.unidad ? ` (${r.unidad})` : ""}
                  </td>
                  <td style={{ border: "1px solid black", borderTop: "none", padding: "3px 7px" }}>
                    {r.valor ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

        {/* ── Observaciones y firma ────────────────────── */}
        <div style={{ marginBottom: 14, fontSize: "10pt" }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>OBSERVACIONES:</span>
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>FIRMA</span><br />
            <span>por ZENG{"  "}Laboratorio Microbiológico</span>
          </div>
        </div>

        {/* ── Método analítico ─────────────────────────── */}
        {metodologias.length > 0 && (
          <div style={{ marginTop: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 3, fontSize: "10pt" }}>
              MÉTODO ANALÍTICO
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}>
              <tbody>
                {metodologias.map(m => (
                  <tr key={m.codigo}>
                    <td style={{ border: "1px solid black", padding: "4px 7px" }}>
                      {m.descripcion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Notas ────────────────────────────────────── */}
        <div style={{ marginBottom: 20, fontSize: "9.5pt" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>NOTAS</div>
          <div>1 - Muestra y datos de la misma proporcionada por el cliente.</div>
          <div>2 - Los resultados solo se refieren a los elementos sometidos a ensayo.</div>
          <div>3 - Este informe NO puede ser reproducido, excepto que sea íntegramente; sin la autorización escrita de la Dirección Técnica del Laboratorio.</div>
        </div>

        {/* ── Pie del timbre ───────────────────────────── */}
        <div style={{ fontSize: "8.5pt", fontStyle: "italic", textAlign: "center", marginBottom: 8, color: "#333" }}>
          El timbre profesional correspondiente a este documento se aplica en los registros de empresa de acuerdo a disposición de la Caja de Profesionales
        </div>

        {/* ── Pie de página ────────────────────────────── */}
        <div style={{ borderTop: "1px solid #888", paddingTop: 6, fontSize: "8pt", color: "#444" }}>
          <div>(–): Estos ensayos NO están comprendidos en el alcance de la acreditación O.U.A. LE NRO 006</div>
          <div>Ver: www.organismoruguayodeacreditacion.org</div>
          <div>Reg.MGAP N° 0018: Alcance: www.mgap.gub.uy/DGSG/DILAVE</div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            Mariano Moreno 2746 – Montevideo – Uruguay – Telefax: (598) 2486 46 63
          </div>
          <div style={{ textAlign: "center" }}>
            E-mail: zengsa@adinet.com.uy – zeng@zeng.com.uy – Web: http://www.zeng.com.uy
          </div>
        </div>
      </div>
    </div>
  )
}
