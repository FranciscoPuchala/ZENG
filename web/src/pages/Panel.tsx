import { ClipboardList, FlaskConical, FileCheck2, Clock } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const STATS = [
  {
    label: "Muestras pendientes",
    value: "12",
    icon: ClipboardList,
    tone: "text-amber-600 bg-amber-100",
    glow: "rgb(217 119 6 / 0.12)",
  },
  {
    label: "En carga de resultados",
    value: "7",
    icon: FlaskConical,
    tone: "text-blue-600 bg-blue-100",
    glow: "rgb(37 99 235 / 0.12)",
  },
  {
    label: "Publicados hoy",
    value: "4",
    icon: FileCheck2,
    tone: "text-green-600 bg-green-100",
    glow: "rgb(22 163 74 / 0.12)",
  },
  {
    label: "Tiempo prom. de entrega",
    value: "2.3 días",
    icon: Clock,
    tone: "text-navy-800 bg-navy-100",
    glow: "rgb(22 50 79 / 0.1)",
  },
]

export function Panel() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card
            key={s.label}
            className="cursor-default transition-all duration-200 hover:-translate-y-0.5"
            style={{
              boxShadow: `0 1px 3px rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)`,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                `0 8px 24px -4px ${s.glow}, 0 2px 8px -2px rgb(0 0 0 / 0.07)`
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                `0 1px 3px rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)`
            }}
          >
            <CardContent className="flex items-center gap-4 py-5">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${s.tone}`}
              >
                <s.icon className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bienvenida */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Primer boceto visual del sistema nuevo de ZENG — datos placeholder,
            sin conexión a backend todavía. Usá el menú lateral para navegar
            entre las etapas del flujo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
