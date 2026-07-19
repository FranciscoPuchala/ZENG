import * as React from "react"
import { ClipboardList, FlaskConical, FileCheck2, CalendarCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const API = "http://localhost:3001"

interface Stats {
  pendientes: number
  cargados: number
  informes_total: number
  muestras_hoy: number
  top_ensayos: { codigo: string; nombre: string; total: number }[]
  actividad_14d: { fecha: string; total: number }[]
  ultimos_informes: {
    numero_informe: string
    fecha_emision: string | null
    cliente_nombre: string
    cantidad_analisis: number
  }[]
}

// Rellena días sin datos con 0 para los últimos N días
function rellenarDias(data: { fecha: string; total: number }[], dias: number) {
  const result: { fecha: string; total: number }[] = []
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split("T")[0]
    const found = data.find(x => x.fecha === iso)
    result.push({ fecha: iso, total: found ? found.total : 0 })
  }
  return result
}

function ddmmaa(iso: string | null) {
  if (!iso) return "—"
  const [yyyy, mm, dd] = iso.split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

function diaSemana(iso: string) {
  const d = new Date(iso + "T12:00:00")
  return new Intl.DateTimeFormat("es-UY", { weekday: "short" }).format(d)
}

// ── Gráfico de barras verticales (actividad 14d) ─────────────────────
function ActivityChart({ dias }: { dias: { fecha: string; total: number }[] }) {
  const max = Math.max(...dias.map(d => d.total), 1)
  const H = 72

  return (
    <div className="flex items-end gap-1.5 px-1" style={{ height: H + 24 }}>
      {dias.map(d => {
        const barH = max > 0 ? Math.max((d.total / max) * H, d.total > 0 ? 4 : 0) : 0
        const esHoy = d.fecha === new Date().toISOString().split("T")[0]
        return (
          <div key={d.fecha} className="group relative flex flex-1 flex-col items-center">
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-1.5 hidden -translate-x-1/2 left-1/2 rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap group-hover:block z-10">
              {ddmmaa(d.fecha)}: {d.total} muestra{d.total !== 1 ? "s" : ""}
            </div>
            {/* Barra */}
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: barH,
                backgroundColor: esHoy ? "var(--color-teal-500, #0f766e)" : "#0f766e66",
              }}
            />
            {/* Etiqueta día */}
            <span className="mt-1 text-[8px] leading-none text-muted-foreground capitalize">
              {diaSemana(d.fecha).replace(".", "")}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Barras horizontales (top ensayos) ───────────────────────────────
function BarraEnsayo({
  codigo, nombre, total, maxTotal,
}: {
  codigo: string; nombre: string; total: number; maxTotal: number
}) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 font-mono text-[10px] font-semibold text-teal-700">
        {codigo}
      </span>
      <div className="flex-1">
        <div className="mb-0.5 truncate text-xs leading-none text-foreground" title={nombre}>
          {nombre}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {total}
      </span>
    </div>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────
function StatTile({
  label, value, icon: Icon, tone, glow,
}: {
  label: string; value: number | string; icon: React.ElementType; tone: string; glow: string
}) {
  return (
    <Card
      className="cursor-default transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 3px rgb(0 0 0 / 0.07)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px -4px ${glow}, 0 2px 8px -2px rgb(0 0 0 / 0.07)`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgb(0 0 0 / 0.07)"
      }}
    >
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="size-6" />
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Panel principal ──────────────────────────────────────────────────
export function Panel() {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [hora, setHora]   = React.useState(new Date())

  React.useEffect(() => {
    fetch(`${API}/stats/panel`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {}) // falla en silencio si la API no está lista
  }, [])

  // Reloj en tiempo real
  React.useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dias = stats ? rellenarDias(stats.actividad_14d, 14) : []
  const maxEnsayo = stats ? Math.max(...stats.top_ensayos.map(e => e.total), 1) : 1

  const fechaHoy = new Intl.DateTimeFormat("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(hora)
  const horaStr = hora.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <div className="flex flex-col gap-6">

      {/* Fecha y hora */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold capitalize">{fechaHoy}</h1>
          <p className="text-sm text-muted-foreground">Panel de control — ZENG Laboratorio Microbiológico</p>
        </div>
        <div className="font-mono text-2xl font-light tabular-nums text-muted-foreground">
          {horaStr}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Muestras pendientes"
          value={stats?.pendientes ?? "—"}
          icon={ClipboardList}
          tone="text-amber-600 bg-amber-100"
          glow="rgb(217 119 6 / 0.18)"
        />
        <StatTile
          label="Listos para informe"
          value={stats?.cargados ?? "—"}
          icon={FlaskConical}
          tone="text-blue-600 bg-blue-100"
          glow="rgb(37 99 235 / 0.18)"
        />
        <StatTile
          label="Informes emitidos"
          value={stats?.informes_total ?? "—"}
          icon={FileCheck2}
          tone="text-teal-700 bg-teal-100"
          glow="rgb(15 118 110 / 0.18)"
        />
        <StatTile
          label="Muestras recibidas hoy"
          value={stats?.muestras_hoy ?? "—"}
          icon={CalendarCheck}
          tone="text-navy-800 bg-slate-100"
          glow="rgb(22 50 79 / 0.15)"
        />
      </div>

      {/* Fila central: top ensayos + últimos informes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

        {/* Top ensayos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ensayos más solicitados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!stats || stats.top_ensayos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin datos todavía.
              </p>
            ) : stats.top_ensayos.map(e => (
              <BarraEnsayo
                key={e.codigo}
                codigo={e.codigo}
                nombre={e.nombre}
                total={e.total}
                maxTotal={maxEnsayo}
              />
            ))}
          </CardContent>
        </Card>

        {/* Últimos informes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Últimos informes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {!stats || stats.ultimos_informes.length === 0 ? (
              <p className="px-5 py-4 text-center text-sm text-muted-foreground">
                Sin informes todavía.
              </p>
            ) : stats.ultimos_informes.map((inf, i) => (
              <div key={i} className="flex flex-col gap-0.5 px-5 py-3">
                <span className="font-mono text-xs font-semibold text-teal-700">
                  {inf.numero_informe}
                </span>
                <span className="text-sm font-medium leading-snug">{inf.cliente_nombre}</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {ddmmaa(inf.fecha_emision)}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {inf.cantidad_analisis} análisis
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Actividad — últimos 14 días */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Muestras recibidas — últimos 14 días</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : dias.every(d => d.total === 0) ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin actividad en los últimos 14 días.
            </p>
          ) : (
            <ActivityChart dias={dias} />
          )}
        </CardContent>
      </Card>

    </div>
  )
}
