import * as React from "react"
import {
  FlaskConical,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Users,
  Beaker,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  etapa?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Panel", icon: LayoutDashboard },
  { label: "Ingreso de Muestra", icon: ClipboardList, etapa: "Etapa 1" },
  { label: "Carga de Resultados", icon: FlaskConical, etapa: "Etapa 2" },
  { label: "Cuaderno de Análisis", icon: FileCheck2, etapa: "Etapa 3" },
  { label: "Clientes", icon: Users },
  { label: "Ensayos y Parámetros", icon: Beaker },
]

export function AppShell({
  active,
  onNavigate,
  children,
}: {
  active: string
  onNavigate?: (label: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-navy-900 text-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-teal-600 text-sm font-bold">
            Z
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">ZENG</div>
            <div className="text-[11px] text-navy-100/70">
              Laboratorio Microbiológico
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === active
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.label)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-teal-700/90 text-white"
                    : "text-navy-100/80 hover:bg-navy-800 hover:text-white"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.etapa && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-white/5 text-navy-100/60"
                    )}
                  >
                    {item.etapa}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-navy-100/70 hover:bg-navy-800 hover:text-white">
            <Settings className="size-4" />
            Configuración
          </button>
          <div className="mt-2 flex items-center gap-2 px-3 py-1">
            <div className="flex size-7 items-center justify-center rounded-full bg-navy-700 text-xs font-medium">
              FR
            </div>
            <div className="text-xs text-navy-100/70">Francisco · Recepción</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="text-sm font-medium text-foreground">{active}</div>
          <div className="text-xs text-muted-foreground">
            Servidor local · sin conexión a internet
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
