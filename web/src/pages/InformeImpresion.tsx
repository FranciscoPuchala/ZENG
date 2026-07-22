import * as React from "react"
import { apiFetch } from "@/lib/api"
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
  valor_referencia: string | null
}
interface Analisis {
  id: number; numero_interno: number; numero_cliente_secuencial: number
  descripcion: string; fecha_siembra: string | null; resultados: Resultado[]
}
interface Metodologia { codigo: string; descripcion: string; acreditado: boolean }
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
    apiFetch(`/informes/${informeId}/reporte`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setCargando(false) })
      .catch((e: Error) => { setError(e.message); setCargando(false) })
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

// El informe lleva sello OUA si al menos una metodología del ensayo
// está dentro del alcance de acreditación OUA LE 006.
function usaSellosOUA(metodologias: Metodologia[]): boolean {
  return metodologias.some(m => m.acreditado)
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
  const conSello = usaSellosOUA(metodologias)

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
              let listo = false
              const cerrar = () => {
                if (listo) return
                listo = true
                window.removeEventListener("afterprint", cerrar)
                mq.removeEventListener("change", mqHandler)
                onCerrar(modoConfirmacion)
              }
              const mq = window.matchMedia("print")
              const mqHandler = (e: MediaQueryListEvent) => { if (!e.matches) cerrar() }
              mq.addEventListener("change", mqHandler)
              window.addEventListener("afterprint", cerrar)
              window.print()
            }}
          >
            <Printer /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Cuerpo del informe — hoja A4 con membretado como fondo */}
      <div
        className="mx-auto my-6 text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          backgroundImage: `url('/membretado_${conSello ? "con" : "sin"}_sello.jpg')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
          fontFamily: "Times New Roman, serif",
          fontSize: "11pt",
          lineHeight: 1.35,
          boxSizing: "border-box",
          /* padding: top=zona header | right/left=márgenes laterales | bottom=zona footer */
          padding: "38mm 13mm 34mm 13mm",
        }}
      >

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
        {analisis.map(a => {
          const tieneReferencias = a.resultados.some(r => r.valor_referencia != null && r.valor_referencia !== "")
          return (
            <table key={a.id} style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: 6, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: tieneReferencias ? "48%" : "65%" }} />
                <col style={{ width: tieneReferencias ? "26%" : "35%" }} />
                {tieneReferencias && <col style={{ width: "26%" }} />}
              </colgroup>
              <tbody>
                {/* Cabecera del análisis */}
                <tr>
                  <td style={{ border: "1px solid black", borderRight: "none", padding: "4px 7px", fontWeight: 700, verticalAlign: "top" }}>
                    N° de ANÁLISIS{"  "}
                    {nroAnalisis(informe.numero_cliente, a.numero_cliente_secuencial, a.fecha_siembra)}
                  </td>
                  <td colSpan={tieneReferencias ? 2 : 1} style={{ border: "1px solid black", padding: "4px 7px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 700 }}>DESCRIPCION DE LA MUESTRA</div>
                    <div>{a.descripcion}</div>
                  </td>
                </tr>

                {/* Sub-cabecera de columnas */}
                <tr>
                  <td style={{ border: "1px solid black", borderTop: "none", borderRight: "none", padding: "3px 7px" }}></td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderRight: tieneReferencias ? "none" : "1px solid black", padding: "3px 7px", fontWeight: 700, textAlign: "center" }}>
                    Resultados
                  </td>
                  {tieneReferencias && (
                    <td style={{ border: "1px solid black", borderTop: "none", padding: "3px 7px", fontWeight: 700, textAlign: "center" }}>
                      Valores de Referencia
                    </td>
                  )}
                </tr>

                {/* Filas de resultados */}
                {a.resultados.map((r, i) => (
                  <tr key={i}>
                    <td style={{ border: "1px solid black", borderTop: "none", borderRight: "none", padding: "3px 7px" }}>
                      {r.descripcion}{r.unidad ? ` (${r.unidad})` : ""}
                    </td>
                    <td style={{ border: "1px solid black", borderTop: "none", borderRight: tieneReferencias ? "none" : "1px solid black", padding: "3px 7px", textAlign: "center" }}>
                      {r.valor ?? "—"}
                    </td>
                    {tieneReferencias && (
                      <td style={{ border: "1px solid black", borderTop: "none", padding: "3px 7px", textAlign: "center" }}>
                        {r.valor_referencia ?? ""}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })}

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
        <div style={{ fontSize: "8.5pt", fontStyle: "italic", textAlign: "center", color: "#333" }}>
          El timbre profesional correspondiente a este documento se aplica en los registros de empresa de acuerdo a disposición de la Caja de Profesionales
        </div>

      </div>
    </div>
  )
}
