import { useState } from "react"
import { MotionConfig } from "motion/react"
import { AppShell } from "@/components/layout/AppShell"
import { Intro } from "@/components/Intro"
import { Login } from "@/pages/Login"
import { Panel } from "@/pages/Panel"
import { IngresoMuestra } from "@/pages/IngresoMuestra"
import { CargaResultados } from "@/pages/CargaResultados"
import { CuadernoAnalisis } from "@/pages/CuadernoAnalisis"
import { EnsayosParametros } from "@/pages/EnsayosParametros"
import { Clientes } from "@/pages/Clientes"
import { Respaldo } from "@/pages/Respaldo"
import { Configuracion } from "@/pages/Configuracion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { leerSesion, borrarToken, type UsuarioSesion } from "@/lib/auth"

function Proximamente({ nombre }: { nombre: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{nombre}</CardTitle>
        <CardDescription>Todavía no diseñada — próximamente.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function App() {
  const [active,      setActive]      = useState("Panel")
  const [introHecho,  setIntroHecho]  = useState(false)
  const [usuario,     setUsuario]     = useState<UsuarioSesion | null>(() => leerSesion())

  function handleLogin(u: UsuarioSesion) {
    setUsuario(u)
    setIntroHecho(false) // mostrar intro al entrar
  }

  function handleLogout() {
    borrarToken()
    setUsuario(null)
    setIntroHecho(false)
    setActive("Panel")
  }

  // Sin sesión → pantalla de login
  if (!usuario) return <Login onLogin={handleLogin} />

  return (
    <MotionConfig reducedMotion="user">
      {!introHecho && <Intro onDone={() => setIntroHecho(true)} />}
      <AppShell active={active} onNavigate={setActive} usuario={usuario} onLogout={handleLogout}>
        {active === "Panel"               && <Panel />}
        {active === "Ingreso de Muestra"  && <IngresoMuestra />}
        {active === "Carga de Resultados" && <CargaResultados />}
        {active === "Cuaderno de Análisis"&& <CuadernoAnalisis />}
        {active === "Ensayos y Parámetros"&& <EnsayosParametros />}
        {active === "Clientes"            && <Clientes />}
        {active === "Respaldo"            && <Respaldo />}
        {active === "Configuración"       && <Configuracion usuario={usuario} />}
        {active !== "Panel" &&
          active !== "Ingreso de Muestra" &&
          active !== "Carga de Resultados" &&
          active !== "Cuaderno de Análisis" &&
          active !== "Ensayos y Parámetros" &&
          active !== "Clientes" &&
          active !== "Respaldo" &&
          active !== "Configuración" && <Proximamente nombre={active} />}
      </AppShell>
    </MotionConfig>
  )
}

export default App
