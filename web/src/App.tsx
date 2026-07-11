import { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Panel } from "@/pages/Panel"
import { IngresoMuestra } from "@/pages/IngresoMuestra"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function Proximamente({ nombre }: { nombre: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{nombre}</CardTitle>
        <CardDescription>
          Todavía no diseñada — la siguiente en la lista una vez que
          valide la pantalla de Ingreso de Muestra.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function App() {
  const [active, setActive] = useState("Ingreso de Muestra")

  return (
    <AppShell active={active} onNavigate={setActive}>
      {active === "Panel" && <Panel />}
      {active === "Ingreso de Muestra" && <IngresoMuestra />}
      {active !== "Panel" && active !== "Ingreso de Muestra" && (
        <Proximamente nombre={active} />
      )}
    </AppShell>
  )
}

export default App
