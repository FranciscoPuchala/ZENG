import * as React from "react"
import { motion } from "motion/react"
import {
  FlaskConical,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Users,
  Beaker,
  Settings,
  LogOut,
  DatabaseBackup,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UsuarioSesion } from "@/lib/auth"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  etapa?: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Panel", icon: LayoutDashboard },
  { label: "Ingreso de Muestra",   icon: ClipboardList, etapa: "Etapa 1" },
  { label: "Carga de Resultados",  icon: FlaskConical,  etapa: "Etapa 2" },
  { label: "Cuaderno de Análisis", icon: FileCheck2,    etapa: "Etapa 3" },
  { label: "Clientes",             icon: Users },
  { label: "Ensayos y Parámetros", icon: Beaker },
  { label: "Respaldo",             icon: DatabaseBackup, adminOnly: true },
]

export function AppShell({
  active,
  onNavigate,
  usuario,
  onLogout,
  children,
}: {
  active: string
  onNavigate?: (label: string) => void
  usuario: UsuarioSesion
  onLogout: () => void
  children: React.ReactNode
}) {
  const iniciales = usuario.iniciales?.toUpperCase() ?? "?"
  const nombreMostrar = usuario.nombre ?? usuario.usuario
  const esAdmin = usuario.rol === "admin"
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || esAdmin)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-62 shrink-0 flex-col bg-navy-950 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white"
            style={{ boxShadow: "0 2px 10px rgb(15 118 110 / 0.5)" }}
          >
            Z
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-white">ZENG</div>
            <div className="text-[11px] tracking-wide text-navy-100/55">Laboratorio Microbiológico</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-1">
          {navItems.map((item) => {
            const isActive = item.label === active
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.label)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150",
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-navy-100/65 hover:bg-navy-800/70 hover:text-white"
                )}
              >
                <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-teal-200" : "text-navy-100/50")} />
                <span className="flex-1">{item.label}</span>
                {item.etapa && (
                  <span className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                    isActive ? "bg-white/15 text-teal-100" : "bg-white/5 text-navy-100/40"
                  )}>
                    {item.etapa}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer — usuario + acciones */}
        <div className="border-t border-white/8 px-3 py-3">
          <button
            onClick={() => onNavigate?.("Configuración")}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-navy-100/55 transition-all duration-150 hover:bg-navy-800/70 hover:text-white"
          >
            <Settings className="size-4" />
            Configuración
          </button>

          {/* Usuario logueado */}
          <div className="mt-1.5 flex items-center gap-2.5 rounded-lg px-3 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-[11px] font-semibold ring-1 ring-teal-500/40">
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-navy-100/80">{nombreMostrar}</div>
              <div className="text-[10px] capitalize text-navy-100/40">{usuario.rol}</div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="ml-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-navy-100/35 transition-colors hover:bg-red-900/40 hover:text-red-300"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6 shadow-[0_1px_0_0_var(--color-border)]">
          <div className="text-sm font-medium text-foreground">{active}</div>
          <div className="text-xs text-muted-foreground">Servidor local · sin conexión a internet</div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
