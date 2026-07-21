import * as React from "react"
import { API } from "@/lib/api"
import { guardarToken, type UsuarioSesion } from "@/lib/auth"

// ── Fondo galáctico animado ───────────────────────────────────────────
// Paralaje con mouse + estrellas fugaces + nebulosas que pulsan
function FondoGalactico() {
  const canvasRef  = React.useRef<HTMLCanvasElement>(null)
  const mouseRef   = React.useRef({ x: 0.5, y: 0.5 })
  const smoothRef  = React.useRef({ x: 0.5, y: 0.5 })

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    function onMouse(e: MouseEvent) {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
    }
    window.addEventListener("mousemove", onMouse)

    // ── Estrellas en 3 capas de profundidad ──
    type Star = {
      nx: number; ny: number; r: number; depth: number
      phase: number; speed: number; rgb: [number, number, number]; bright: boolean
    }
    const stars: Star[] = Array.from({ length: 230 }, (_, i) => {
      // near=0.1 (mucho paralaje), far=0.95 (poco paralaje)
      const depth = i < 18 ? 0.1 + Math.random() * 0.15
                  : i < 80 ? 0.4 + Math.random() * 0.2
                  : 0.7 + Math.random() * 0.25
      return {
        nx:    Math.random(),
        ny:    Math.random(),
        r:     depth < 0.3 ? Math.random() * 2 + 1.5
             : depth < 0.6 ? Math.random() * 1.1 + 0.5
             : Math.random() * 0.65 + 0.15,
        depth,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.15,
        rgb:   i % 13 === 0 ? [170, 210, 255]  // azulada
             : i % 9  === 0 ? [255, 235, 160]  // cálida
             : [255, 255, 255],
        bright: i < 8,
      }
    })

    // ── Nebulosas (3 elipses animadas) ──
    const nebulae = [
      { cx: 0.1,  cy: 0.55, rw: 0.38, rh: 0.42, rgb: [15, 118, 110],  maxA: 0.16 },
      { cx: 0.88, cy: 0.12, rw: 0.32, rh: 0.35, rgb: [99,  55, 198],  maxA: 0.13 },
      { cx: 0.52, cy: 1.0,  rw: 0.55, rh: 0.3,  rgb: [30,  64, 175],  maxA: 0.11 },
    ]

    // ── Estrellas fugaces ──
    type Shoot = { x: number; y: number; vx: number; vy: number; life: number; trail: number }
    let shoots: Shoot[] = []
    let nextShoot = 1.5 + Math.random() * 2

    function spawnShoot(W: number, H: number) {
      const ang   = (Math.PI / 180) * (20 + Math.random() * 25)
      const spd   = 500 + Math.random() * 350
      const fromTop = Math.random() < 0.6
      shoots.push({
        x:     fromTop ? Math.random() * W * 0.75 : -10,
        y:     fromTop ? -10 : Math.random() * H * 0.45,
        vx:    Math.cos(ang) * spd,
        vy:    Math.sin(ang) * spd,
        life:  1,
        trail: 90 + Math.random() * 70,
      })
    }

    let animId: number
    let last = performance.now()
    let t    = 0

    function draw(now: number) {
      if (!ctx || !canvas) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      t   += dt

      // Interpolación suave del mouse
      const sm = smoothRef.current
      sm.x += (mouseRef.current.x - sm.x) * 0.07
      sm.y += (mouseRef.current.y - sm.y) * 0.07

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const W = canvas.width, H = canvas.height

      // ── Nebulosas animadas ──
      for (let i = 0; i < nebulae.length; i++) {
        const n     = nebulae[i]
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.25 + i * 2.1)
        const alpha = n.maxA * pulse
        const [r, g, b] = n.rgb

        ctx.save()
        ctx.translate(n.cx * W, n.cy * H)
        ctx.scale(n.rw * W, n.rh * H)
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        grd.addColorStop(0,   `rgba(${r},${g},${b},${alpha.toFixed(3)})`)
        grd.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.4).toFixed(3)})`)
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`)
        ctx.beginPath()
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
        ctx.restore()
      }

      // ── Estrellas con paralaje ──
      for (const s of stars) {
        const alpha   = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed))
        const par     = 40 * (1 - s.depth)  // near → más movimiento
        const x = s.nx * W + (sm.x - 0.5) * par
        const y = s.ny * H + (sm.y - 0.5) * par
        const [r, g, b] = s.rgb

        if (s.bright) {
          // Halo
          const grd = ctx.createRadialGradient(x, y, 0, x, y, s.r * 6)
          grd.addColorStop(0,   `rgba(${r},${g},${b},${alpha.toFixed(3)})`)
          grd.addColorStop(0.3, `rgba(${r},${g},${b},${(alpha * 0.28).toFixed(3)})`)
          grd.addColorStop(1,   `rgba(${r},${g},${b},0)`)
          ctx.beginPath()
          ctx.arc(x, y, s.r * 6, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
          // Núcleo
          ctx.beginPath()
          ctx.arc(x, y, s.r * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(alpha * 1.3, 1).toFixed(3)})`
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`
          ctx.fill()
        }
      }

      // ── Estrellas fugaces ──
      nextShoot -= dt
      if (nextShoot <= 0) {
        spawnShoot(W, H)
        nextShoot = 3 + Math.random() * 5
      }

      shoots = shoots.filter(s => s.life > 0)
      for (const s of shoots) {
        s.x    += s.vx * dt
        s.y    += s.vy * dt
        s.life -= dt * 1.6

        const alpha  = Math.max(0, s.life)
        const spd    = Math.hypot(s.vx, s.vy)
        const dx     = s.vx / spd
        const dy     = s.vy / spd
        const tailX  = s.x - dx * s.trail
        const tailY  = s.y - dy * s.trail

        const grd = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grd.addColorStop(0,   "rgba(200,220,255,0)")
        grd.addColorStop(0.6, `rgba(210,230,255,${(alpha * 0.35).toFixed(3)})`)
        grd.addColorStop(1,   `rgba(255,255,255,${alpha.toFixed(3)})`)

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grd
        ctx.lineWidth   = 1.5
        ctx.stroke()

        // Cabeza brillante
        ctx.beginPath()
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  )
}

// ── Login ─────────────────────────────────────────────────────────────
export function Login({ onLogin }: { onLogin: (u: UsuarioSesion) => void }) {
  const [usuario,  setUsuario]  = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error,    setError]    = React.useState("")
  const [cargando, setCargando] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setCargando(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return }
      guardarToken(data.token)
      onLogin(data.usuario)
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "#03081a" }}
    >
      {/* Fondo galáctico interactivo */}
      <FondoGalactico />

      {/* Tarjeta de login */}
      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Logo + nombre */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-2xl font-bold text-white"
            style={{ boxShadow: "0 4px 28px rgba(15,118,110,0.55), 0 0 0 1px rgba(15,118,110,0.3)" }}
          >
            Z
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-widest text-white uppercase">ZENG</div>
            <div className="mt-0.5 text-xs uppercase tracking-wider text-white/40">
              Laboratorio Microbiológico
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8"
          style={{
            background: "rgba(3,8,26,0.70)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
            Iniciar sesión
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/50">
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="tu usuario"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 transition-all duration-150 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/50">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 transition-all duration-150 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !usuario || !password}
              className="mt-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-teal-500 active:scale-[0.97] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ boxShadow: "0 2px 16px rgba(15,118,110,0.35)" }}
            >
              {cargando ? "Verificando…" : "Ingresar"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-[10px] tracking-widest uppercase text-white/18">
          Sistema de gestión interno
        </p>
      </div>
    </div>
  )
}
