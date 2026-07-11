import { ClipboardList, FlaskConical, FileCheck2, Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const STATS = [
  {
    label: "Muestras pendientes",
    value: "12",
    icon: ClipboardList,
    tone: "text-amber-600 bg-amber-100",
  },
  {
    label: "En carga de resultados",
    value: "7",
    icon: FlaskConical,
    tone: "text-blue-600 bg-blue-100",
  },
  {
    label: "Publicados hoy",
    value: "4",
    icon: FileCheck2,
    tone: "text-green-600 bg-green-100",
  },
  {
    label: "Tiempo prom. de entrega",
    value: "2.3 días",
    icon: Clock,
    tone: "text-navy-800 bg-navy-100",
  },
]

export function Panel() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`flex size-10 items-center justify-center rounded-md ${s.tone}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Este es un primer boceto visual del sistema nuevo de ZENG — placeholder
            de datos, todavía no conectado a una base real. Arrancá por "Ingreso
            de Muestra" para ver la primera pantalla completa.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
