import * as React from "react"

const NOMBRE_USUARIO = "Francisco"

export function Intro({ onDone }: { onDone: () => void }) {
  const [saliendo, setSaliendo] = React.useState(false)

  React.useEffect(() => {
    const t1 = setTimeout(() => setSaliendo(true), 6500)
    const t2 = setTimeout(onDone, 7500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950 overflow-hidden",
        "transition-opacity duration-700 ease-in-out",
        saliendo ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
      style={{ perspective: "1200px" }}
    >
      {/* Logo — arranca enorme desde el centro, gira 5 veces y se frena en posición */}
      <div
        className="animate-intro-logo flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-teal-700 text-5xl font-bold text-white select-none"
        style={{
          boxShadow: "0 0 60px rgb(15 118 110 / 0.6), 0 0 140px rgb(15 118 110 / 0.25)",
          willChange: "transform, filter",
        }}
      >
        Z
      </div>

      <div
        className="animate-intro-title mt-7 text-5xl font-bold text-white"
        style={{ willChange: "transform, opacity, filter" }}
      >
        ZENG
      </div>

      {/* Línea y bienvenida — entran desde abajo, más sutiles */}
      <div className="animate-intro-line mt-4 h-px bg-teal-500/50" />

      <div className="animate-intro-sub mt-5 text-lg font-medium tracking-widest text-teal-300 uppercase">
        Bienvenido, {NOMBRE_USUARIO}
      </div>

      <div className="animate-intro-sub2 mt-1.5 text-xs tracking-widest text-navy-100/35 uppercase">
        Laboratorio Microbiológico
      </div>
    </div>
  )
}
