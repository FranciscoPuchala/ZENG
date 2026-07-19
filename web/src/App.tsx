import { useState } from "react"
import { MotionConfig } from "motion/react"
import { AppShell } from "@/components/layout/AppShell"
import { Intro } from "@/components/Intro"
import { Panel } from "@/pages/Panel"
import { IngresoMuestra } from "@/pages/IngresoMuestra"
import { CargaResultados } from "@/pages/CargaResultados"
import { CuadernoAnalisis } from "@/pages/CuadernoAnalisis"
import { EnsayosParametros } from "@/pages/EnsayosParametros"
import { Clientes } from "@/pages/Clientes"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function Proximamente({ nombre }: { nombre: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{nombre}</CardTitle>
        <CardDescription>
          Todavía no diseñada — próximamente.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function App() {
  const [active, setActive] = useState("Panel")
  const [introHecho, setIntroHecho] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      {!introHecho && <Intro onDone={() => setIntroHecho(true)} />}
      <AppShell active={active} onNavigate={setActive}>
      {active === "Panel" && <Panel />}
      {active === "Ingreso de Muestra" && <IngresoMuestra />}
      {active === "Carga de Resultados" && <CargaResultados />}
      {active === "Cuaderno de Análisis" && <CuadernoAnalisis />}
      {active === "Ensayos y Parámetros" && <EnsayosParametros />}
      {active === "Clientes" && <Clientes />}
      {active !== "Panel" &&
        active !== "Ingreso de Muestra" &&
        active !== "Carga de Resultados" &&
        active !== "Cuaderno de Análisis" &&
        active !== "Ensayos y Parámetros" &&
        active !== "Clientes" && <Proximamente nombre={active} />}
    </AppShell>
    </MotionConfig>
  )
}

export default App
