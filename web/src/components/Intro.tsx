import * as React from "react"

const NOMBRE_USUARIO = "Francisco"

export function Intro({ onDone }: { onDone: () => void }) {
  const [saliendo, setSaliendo] = React.useState(false)

  React.useEffect(() => {
    const t1 = setTimeout(() => setSaliendo(true), 7500)
    const t2 = setTimeout(onDone, 8500)
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
      <div
        className="animate-intro-logo-scale select-none"
        style={{ willChange: "transform, opacity, filter" }}
      >
        <div className="animate-intro-logo-spin" style={{ willChange: "transform" }}>
          <img
            src="/logo.png"
            alt="ZENG"
            className="w-72"
            draggable={false}
            style={{ filter: "drop-shadow(0 0 24px rgb(15 118 110 / 0.7))" }}
          />
        </div>
      </div>

      <div
        className="animate-intro-line mt-8 h-px w-48 bg-teal-500/50"
        style={{ transformOrigin: "left center" }}
      />

      <div className="animate-intro-sub mt-6 text-5xl font-bold tracking-widest text-teal-300 uppercase text-center">
        Bienvenido, {NOMBRE_USUARIO}
      </div>

      <div className="animate-intro-sub2 mt-3 text-xl tracking-widest text-navy-100/50 uppercase text-center">
        Laboratorio Microbiológico
      </div>
    </div>
  )
}
