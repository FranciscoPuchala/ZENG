import "dotenv/config"
import express from "express"
import pg from "pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import fs from "fs"
import path from "path"
import { spawn } from "child_process"
import { fileURLToPath } from "url"

// ── Validación de variables de entorno críticas ───────────────────────
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET no está configurado en api/.env — el servidor no puede arrancar.")
  process.exit(1)
}

const JWT_SECRET  = process.env.JWT_SECRET
const SALT_ROUNDS = 10
const __dirname   = path.dirname(fileURLToPath(import.meta.url))

// ── Conexión a PostgreSQL ─────────────────────────────────────────────
const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// ── Servidor Express ──────────────────────────────────────────────────
const app = express()
app.use(express.json())

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
  if (req.method === "OPTIONS") return res.sendStatus(200)
  next()
})

// ── Helpers ───────────────────────────────────────────────────────────

// Captura errores de handlers async y devuelve 500 en vez de crash/cuelgue
function wrap(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      console.error(err)
      if (!res.headersSent) res.status(500).json({ error: "Error interno del servidor" })
    }
  }
}

// Ejecuta un proceso externo de forma asíncrona (no bloquea el event loop)
function spawnAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const { timeout, ...spawnOpts } = opts
    const proc = spawn(cmd, args, spawnOpts)
    let stderr = ""
    if (proc.stderr) proc.stderr.on("data", d => { stderr += d.toString() })
    let timer
    if (timeout) {
      timer = setTimeout(() => {
        proc.kill()
        reject(new Error("Proceso excedió el tiempo límite"))
      }, timeout)
    }
    proc.on("close", code => { clearTimeout(timer); resolve({ status: code, stderr }) })
    proc.on("error", err => { clearTimeout(timer); reject(err) })
  })
}

// Valida que la ruta de un backup esté dentro del directorio permitido (evita path traversal)
function validarRutaBackup(backupBase, carpeta, archivo) {
  if (!/^(frecuentes|diarios)$/.test(carpeta)) return null
  const fullPath = path.join(backupBase, carpeta, archivo)
  const resolved = path.resolve(fullPath)
  const base     = path.resolve(backupBase)
  if (!resolved.startsWith(base + path.sep)) return null
  return fullPath
}

// Middleware: verifica el JWT y pone el usuario en req.usuario
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No autenticado" })
  try {
    req.usuario = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" })
  }
}

// ── LOGIN / SESIÓN ────────────────────────────────────────────────────

app.post("/login", wrap(async (req, res) => {
  const { usuario, password } = req.body
  if (!usuario || !password) return res.status(400).json({ error: "Faltan datos" })

  const result = await pool.query(
    "SELECT id, usuario, nombre, iniciales, rol, password_hash FROM usuarios WHERE usuario = $1",
    [usuario]
  )
  const user = result.rows[0]
  // Si no existe o no tiene contraseña, misma respuesta (no revelar cuál falló)
  if (!user || !user.password_hash) return res.status(401).json({ error: "Usuario o contraseña incorrectos" })

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" })

  const token = jwt.sign(
    { id: user.id, usuario: user.usuario, nombre: user.nombre, iniciales: user.iniciales, rol: user.rol },
    JWT_SECRET,
    { expiresIn: "12h" }
  )
  res.json({ token, usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre, iniciales: user.iniciales, rol: user.rol } })
}))

app.get("/me", auth, (req, res) => {
  res.json(req.usuario)
})

app.post("/usuarios", auth, wrap(async (req, res) => {
  if (req.usuario.rol !== "admin") return res.status(403).json({ error: "Solo el admin puede crear usuarios" })
  const { usuario, password, nombre, iniciales, rol = "analista" } = req.body
  if (!usuario || !password || !iniciales) return res.status(400).json({ error: "Faltan datos obligatorios" })
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const result = await pool.query(
    "INSERT INTO usuarios (usuario, password_hash, nombre, iniciales, rol) VALUES ($1,$2,$3,$4,$5) RETURNING id, usuario, nombre, iniciales, rol",
    [usuario, hash, nombre || null, iniciales, rol]
  )
  res.status(201).json(result.rows[0])
}))

// ── STATS / PANEL ─────────────────────────────────────────────────────

app.get("/stats/panel", auth, wrap(async (req, res) => {
  const [pend, carg, publ, clts, topEns, activ, ultInf] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS n FROM analisis WHERE estado = 'pendiente'"),
    pool.query("SELECT COUNT(*)::int AS n FROM analisis WHERE estado = 'cargado'"),
    pool.query("SELECT COUNT(*)::int AS n FROM informes"),
    pool.query("SELECT COUNT(*)::int AS n FROM muestras WHERE DATE(fecha_entrada) = CURRENT_DATE"),
    pool.query(`
      SELECT e.codigo, e.nombre, COUNT(a.id)::int AS total
      FROM analisis a JOIN ensayos e ON e.id = a.ensayo_id
      GROUP BY e.id, e.codigo, e.nombre
      ORDER BY total DESC LIMIT 8
    `),
    pool.query(`
      SELECT DATE(fecha_entrada)::text AS fecha, COUNT(*)::int AS total
      FROM muestras
      WHERE fecha_entrada >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(fecha_entrada)
      ORDER BY fecha
    `),
    pool.query(`
      SELECT i.numero_informe, i.fecha_emision, c.nombre AS cliente_nombre,
             COUNT(a.id)::int AS cantidad_analisis
      FROM informes i
      JOIN clientes c ON c.id = i.cliente_id
      LEFT JOIN analisis a ON a.informe_id = i.id
      GROUP BY i.id, i.numero_informe, i.fecha_emision, c.nombre
      ORDER BY i.id DESC LIMIT 5
    `),
  ])
  res.json({
    pendientes:       pend.rows[0].n,
    cargados:         carg.rows[0].n,
    informes_total:   publ.rows[0].n,
    muestras_hoy:     clts.rows[0].n,
    top_ensayos:      topEns.rows,
    actividad_14d:    activ.rows,
    ultimos_informes: ultInf.rows,
  })
}))

// ── CLIENTES ──────────────────────────────────────────────────────────

app.get("/clientes", auth, wrap(async (req, res) => {
  const result = await pool.query("SELECT * FROM clientes ORDER BY numero_cliente")
  res.json(result.rows)
}))

app.post("/clientes", auth, wrap(async (req, res) => {
  const { numero_cliente, nombre, direccion, telefono } = req.body
  const result = await pool.query(
    "INSERT INTO clientes (numero_cliente, nombre, direccion, telefono) VALUES ($1, $2, $3, $4) RETURNING *",
    [numero_cliente, nombre, direccion, telefono]
  )
  res.status(201).json(result.rows[0])
}))

app.get("/clientes/:id/analisis", auth, wrap(async (req, res) => {
  const { id } = req.params
  const result = await pool.query(`
    SELECT
      a.id,
      a.estado,
      a.fecha_siembra,
      m.numero_interno,
      m.descripcion,
      m.fecha_entrada,
      c.numero_cliente,
      e.codigo  AS ensayo_codigo,
      e.nombre  AS ensayo_nombre,
      i.id      AS informe_id,
      i.numero_informe,
      i.fecha_emision,
      ROW_NUMBER() OVER (PARTITION BY m.cliente_id ORDER BY m.numero_interno)
        AS numero_cliente_secuencial
    FROM analisis a
    JOIN muestras m ON m.id = a.muestra_id
    JOIN clientes c ON c.id = m.cliente_id
    JOIN ensayos  e ON e.id = a.ensayo_id
    LEFT JOIN informes i ON i.id = a.informe_id
    WHERE m.cliente_id = $1
    ORDER BY m.numero_interno DESC
  `, [id])
  res.json(result.rows)
}))

// ── USUARIOS ──────────────────────────────────────────────────────────

app.get("/usuarios", auth, wrap(async (req, res) => {
  const result = await pool.query("SELECT * FROM usuarios ORDER BY iniciales")
  res.json(result.rows)
}))

// ── ENSAYOS ───────────────────────────────────────────────────────────

app.get("/ensayos", auth, wrap(async (req, res) => {
  const result = await pool.query("SELECT * FROM ensayos ORDER BY codigo")
  res.json(result.rows)
}))

// ── MUESTRAS ──────────────────────────────────────────────────────────

app.get("/muestras", auth, wrap(async (req, res) => {
  const result = await pool.query(`
    SELECT
      m.*,
      c.nombre        AS cliente_nombre,
      c.numero_cliente,
      COALESCE(
        (SELECT array_agg(e.codigo ORDER BY e.codigo)
         FROM analisis a JOIN ensayos e ON e.id = a.ensayo_id
         WHERE a.muestra_id = m.id),
        '{}'
      ) AS ensayo_codigos,
      COALESCE(
        (SELECT estado FROM analisis WHERE muestra_id = m.id
         ORDER BY CASE estado
           WHEN 'pendiente' THEN 1
           WHEN 'cargado'   THEN 2
           WHEN 'publicado' THEN 3
           ELSE 4 END
         LIMIT 1),
        'pendiente'
      ) AS estado
    FROM muestras m
    JOIN clientes c ON c.id = m.cliente_id
    ORDER BY m.numero_interno DESC
    LIMIT 50
  `)
  res.json(result.rows)
}))

// POST /muestras → crea muestra + análisis en una sola transacción
app.post("/muestras", auth, wrap(async (req, res) => {
  const {
    cliente_id, descripcion, fecha_entrada, hora_entrada,
    fecha_muestreo, recibido_por, observaciones, ensayo_ids
  } = req.body

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    // Lock de asesoría por transacción: evita race condition en numero_interno
    await client.query("SELECT pg_advisory_xact_lock(42)")

    const maxResult = await client.query(
      "SELECT COALESCE(MAX(numero_interno), 228000) + 1 AS siguiente FROM muestras"
    )
    const numero_interno = maxResult.rows[0].siguiente

    const muestraResult = await client.query(
      `INSERT INTO muestras
        (numero_interno, cliente_id, descripcion, fecha_entrada, hora_entrada,
         fecha_muestreo, recibido_por, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [numero_interno, cliente_id, descripcion, fecha_entrada,
       hora_entrada || null, fecha_muestreo || null, recibido_por || null, observaciones || null]
    )
    const muestra = muestraResult.rows[0]

    if (ensayo_ids && ensayo_ids.length > 0) {
      for (const ensayo_id of ensayo_ids) {
        await client.query(
          "INSERT INTO analisis (muestra_id, ensayo_id, estado) VALUES ($1, $2, 'pendiente')",
          [muestra.id, ensayo_id]
        )
      }
    }

    await client.query("COMMIT")
    res.status(201).json(muestra)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}))

// DELETE /muestras/:id → borra una muestra solo si todos sus análisis están pendientes
app.delete("/muestras/:id", auth, wrap(async (req, res) => {
  const { id } = req.params
  const checkRes = await pool.query(
    `SELECT COUNT(*) FROM analisis WHERE muestra_id = $1 AND estado != 'pendiente'`,
    [id]
  )
  if (parseInt(checkRes.rows[0].count) > 0) {
    return res.status(409).json({ error: "No se puede borrar: hay análisis que ya fueron trabajados." })
  }
  await pool.query(`DELETE FROM resultados WHERE analisis_id IN (SELECT id FROM analisis WHERE muestra_id = $1)`, [id])
  await pool.query(`DELETE FROM analisis WHERE muestra_id = $1`, [id])
  await pool.query(`DELETE FROM muestras WHERE id = $1`, [id])
  res.json({ ok: true })
}))

// ── ANÁLISIS ──────────────────────────────────────────────────────────

app.get("/analisis/pendientes", auth, wrap(async (req, res) => {
  const result = await pool.query(`
    SELECT
      a.id, a.muestra_id, a.ensayo_id,
      m.numero_interno, m.descripcion, m.fecha_entrada, m.hora_entrada,
      c.nombre AS cliente_nombre, c.numero_cliente,
      e.codigo AS ensayo_codigo, e.nombre AS ensayo_nombre
    FROM analisis a
    JOIN muestras m ON m.id = a.muestra_id
    JOIN clientes c ON c.id = m.cliente_id
    JOIN ensayos  e ON e.id = a.ensayo_id
    WHERE a.estado = 'pendiente'
    ORDER BY m.numero_interno DESC
  `)
  res.json(result.rows)
}))

app.get("/ensayos/:id/parametros", auth, wrap(async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.codigo, p.descripcion AS nombre, p.unidad, p.tipo_campo,
            p.valor_predeterminado, p.valor_referencia, ep.orden
     FROM parametros p
     JOIN ensayo_parametros ep ON ep.parametro_id = p.id
     WHERE ep.ensayo_id = $1
     ORDER BY ep.orden, p.codigo`,
    [req.params.id]
  )
  res.json(result.rows)
}))

app.get("/ensayos/:codigo/plantilla", auth, wrap(async (req, res) => {
  const ensayoRes = await pool.query(
    "SELECT id, codigo, nombre FROM ensayos WHERE codigo = $1",
    [req.params.codigo]
  )
  if (ensayoRes.rows.length === 0) return res.status(404).json({ error: "Ensayo no encontrado" })
  const ensayo = ensayoRes.rows[0]

  const [paramRes, metodRes] = await Promise.all([
    pool.query(
      `SELECT p.id, p.codigo, p.descripcion, p.unidad, p.tipo_campo,
              p.valor_predeterminado, p.valor_referencia, ep.orden
       FROM parametros p
       JOIN ensayo_parametros ep ON ep.parametro_id = p.id
       WHERE ep.ensayo_id = $1
       ORDER BY ep.orden, p.codigo`,
      [ensayo.id]
    ),
    pool.query(
      `SELECT m.codigo, m.descripcion, m.acreditado
       FROM metodologias m
       JOIN ensayo_metodologias em ON em.metodologia_id = m.id
       WHERE em.ensayo_id = $1
       ORDER BY em.orden, m.codigo`,
      [ensayo.id]
    ),
  ])

  res.json({ ensayo, parametros: paramRes.rows, metodologias: metodRes.rows })
}))

app.get("/analisis/cargados", auth, wrap(async (req, res) => {
  const result = await pool.query(`
    SELECT
      a.id, a.muestra_id, a.ensayo_id,
      m.numero_interno, m.descripcion, m.fecha_entrada,
      c.id AS cliente_id, c.nombre AS cliente_nombre, c.numero_cliente,
      e.codigo AS ensayo_codigo, e.nombre AS ensayo_nombre,
      a.fecha_siembra
    FROM analisis a
    JOIN muestras m ON m.id = a.muestra_id
    JOIN clientes c ON c.id = m.cliente_id
    JOIN ensayos  e ON e.id = a.ensayo_id
    WHERE a.estado = 'cargado'
    ORDER BY m.numero_interno DESC
  `)
  res.json(result.rows)
}))

// POST /informes → crea informe y pasa los análisis a 'publicado' en una sola transacción
app.post("/informes", auth, wrap(async (req, res) => {
  const { cliente_id, numero_informe, fecha_recepcion, fecha_emision, analisis_ids } = req.body

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const datesRes = await client.query(
      `SELECT MIN(m.fecha_muestreo) AS fecha_muestreo, MIN(a.fecha_siembra) AS fecha_analisis
       FROM analisis a JOIN muestras m ON m.id = a.muestra_id WHERE a.id = ANY($1::int[])`,
      [analisis_ids]
    )
    const { fecha_muestreo, fecha_analisis } = datesRes.rows[0]

    const informeResult = await client.query(
      `INSERT INTO informes
         (cliente_id, numero_informe, fecha_muestreo, fecha_recepcion, fecha_analisis, fecha_emision, publicado, fecha_publicado)
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_DATE) RETURNING *`,
      [cliente_id, numero_informe, fecha_muestreo || null, fecha_recepcion || null,
       fecha_analisis || null, fecha_emision || null]
    )
    const informe = informeResult.rows[0]

    for (const aid of analisis_ids) {
      await client.query(
        `UPDATE analisis SET informe_id = $1, numero_informe = $2, estado = 'publicado' WHERE id = $3`,
        [informe.id, numero_informe, aid]
      )
    }

    await client.query("COMMIT")
    res.status(201).json(informe)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}))

app.get("/informes", auth, wrap(async (req, res) => {
  const result = await pool.query(`
    SELECT i.id, i.numero_informe, i.fecha_emision,
           c.nombre AS cliente_nombre, c.numero_cliente,
           (SELECT e.codigo FROM ensayos e
            JOIN analisis a2 ON a2.ensayo_id = e.id
            WHERE a2.informe_id = i.id LIMIT 1) AS ensayo_codigo,
           (SELECT e.nombre FROM ensayos e
            JOIN analisis a2 ON a2.ensayo_id = e.id
            WHERE a2.informe_id = i.id LIMIT 1) AS ensayo_nombre,
           (SELECT COUNT(*) FROM analisis a2 WHERE a2.informe_id = i.id) AS cantidad_analisis
    FROM informes i
    JOIN clientes c ON c.id = i.cliente_id
    WHERE i.impreso = FALSE
    ORDER BY i.id DESC
    LIMIT 100
  `)
  res.json(result.rows)
}))

// PUT /informes/:id/impreso → marca el informe como entregado/impreso
app.put("/informes/:id/impreso", auth, wrap(async (req, res) => {
  const { id } = req.params
  await pool.query("UPDATE informes SET impreso = TRUE WHERE id = $1", [id])
  res.json({ ok: true })
}))

// GET /informes/:id/reporte → datos completos para imprimir (sin N+1: usa json_agg)
app.get("/informes/:id/reporte", auth, wrap(async (req, res) => {
  const { id } = req.params

  const infRes = await pool.query(`
    SELECT i.*, c.nombre AS cliente_nombre, c.numero_cliente,
           c.direccion, c.telefono, c.fax
    FROM informes i JOIN clientes c ON c.id = i.cliente_id
    WHERE i.id = $1
  `, [id])
  if (infRes.rows.length === 0) return res.status(404).json({ error: "No encontrado" })
  const informe = infRes.rows[0]

  // Análisis + resultados en una sola query con json_agg
  const analisisRes = await pool.query(`
    SELECT a.id, a.fecha_siembra, a.ensayo_id,
           m.numero_interno, m.descripcion,
           e.codigo AS ensayo_codigo, e.nombre AS ensayo_nombre,
           ROW_NUMBER() OVER (PARTITION BY m.cliente_id ORDER BY m.numero_interno)
             AS numero_cliente_secuencial,
           COALESCE(
             json_agg(
               json_build_object(
                 'descripcion',      p.descripcion,
                 'unidad',           p.unidad,
                 'valor_referencia', p.valor_referencia,
                 'valor',            r.valor,
                 'lectura_dilucion', r.lectura_dilucion
               )
               ORDER BY COALESCE(ep.orden, 999), p.codigo
             ) FILTER (WHERE r.id IS NOT NULL),
             '[]'::json
           ) AS resultados
    FROM analisis a
    JOIN muestras m ON m.id = a.muestra_id
    JOIN ensayos  e ON e.id = a.ensayo_id
    LEFT JOIN resultados r ON r.analisis_id = a.id
    LEFT JOIN parametros p ON p.id = r.parametro_id
    LEFT JOIN ensayo_parametros ep ON ep.parametro_id = p.id AND ep.ensayo_id = a.ensayo_id
    WHERE a.informe_id = $1
    GROUP BY a.id, a.fecha_siembra, a.ensayo_id,
             m.numero_interno, m.descripcion, m.cliente_id,
             e.codigo, e.nombre
    ORDER BY m.numero_interno
  `, [id])

  const ensayoId = analisisRes.rows[0]?.ensayo_id
  let metodologias = []
  if (ensayoId) {
    const metRes = await pool.query(`
      SELECT m.codigo, m.descripcion, m.acreditado
      FROM metodologias m
      JOIN ensayo_metodologias em ON em.metodologia_id = m.id
      WHERE em.ensayo_id = $1
      ORDER BY em.orden, m.codigo
    `, [ensayoId])
    metodologias = metRes.rows
  }

  const ensayo = analisisRes.rows[0]
    ? { codigo: analisisRes.rows[0].ensayo_codigo, nombre: analisisRes.rows[0].ensayo_nombre }
    : { codigo: "—", nombre: "—" }

  res.json({ informe, ensayo, analisis: analisisRes.rows, metodologias })
}))

app.post("/analisis/:id/resultados", auth, wrap(async (req, res) => {
  const { id } = req.params
  const { fecha_siembra, hora_siembra, analista_id, revisor_id, resultados } = req.body

  await pool.query(
    `UPDATE analisis SET fecha_siembra=$1, hora_siembra=$2, estado='cargado' WHERE id=$3`,
    [fecha_siembra, hora_siembra || null, id]
  )

  for (const r of resultados) {
    await pool.query(
      `INSERT INTO resultados (analisis_id, parametro_id, valor, lectura_dilucion, analista_id, revisado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (analisis_id, parametro_id) DO UPDATE
         SET valor=$3, lectura_dilucion=$4, analista_id=$5, revisado_por=$6`,
      [id, r.parametro_id, r.valor || null, r.lectura_dilucion || null,
       analista_id || null, revisor_id || null]
    )
  }

  res.json({ ok: true })
}))

// ── BACKUP ────────────────────────────────────────────────────────────

app.get("/backup/status", auth, wrap(async (req, res) => {
  const logPath = process.env.BACKUP_LOG
  if (!logPath) return res.status(500).json({ error: "BACKUP_LOG no configurado en .env" })

  try {
    const contenido = fs.readFileSync(logPath, "utf8")
    const lineas = contenido.trim().split("\n").filter(l => l.trim())

    const parsear = (linea) => {
      const m = linea.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+(OK-DIA|OK|ERROR)\s+(.*)$/)
      if (!m) return null
      return { fecha: m[1], estado: m[2], detalle: m[3].trim() }
    }

    const entradas = lineas.slice(-30).reverse().map(parsear).filter(Boolean)
    res.json({ entradas })
  } catch (e) {
    if (e.code === "ENOENT") return res.json({ entradas: [], sin_log: true })
    throw e
  }
}))

app.get("/backup/lista", auth, wrap(async (req, res) => {
  const logPath = process.env.BACKUP_LOG
  if (!logPath) return res.status(500).json({ error: "BACKUP_LOG no configurado" })

  const backupBase = path.dirname(logPath)
  const resultado  = []

  for (const carpeta of ["frecuentes", "diarios"]) {
    const dir = path.join(backupBase, carpeta)
    try {
      const archivos = fs.readdirSync(dir).filter(f => f.endsWith(".dump")).sort().reverse().slice(0, 15)
      for (const f of archivos) {
        const stat = fs.statSync(path.join(dir, f))
        resultado.push({ archivo: f, carpeta, fecha_mod: stat.mtime.toISOString(), tamano: stat.size })
      }
    } catch { /* carpeta vacía o inexistente */ }
  }

  resultado.sort((a, b) => new Date(b.fecha_mod) - new Date(a.fecha_mod))
  res.json({ backups: resultado })
}))

app.post("/backup/preview", auth, wrap(async (req, res) => {
  const { archivo, carpeta } = req.body
  const logPath = process.env.BACKUP_LOG
  if (!logPath) return res.status(500).json({ error: "BACKUP_LOG no configurado" })

  const backupBase = path.dirname(logPath)
  const fullPath   = validarRutaBackup(backupBase, carpeta, archivo)
  if (!fullPath || !fs.existsSync(fullPath)) return res.status(404).json({ error: "Archivo no encontrado" })

  const pgBin  = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\18\\bin"
  const env    = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD }
  const tempDb = "zeng_preview_restore"

  await spawnAsync(path.join(pgBin, "dropdb.exe"), ["-U", process.env.DB_USER, "--if-exists", tempDb], { env })
  const cr = await spawnAsync(path.join(pgBin, "createdb.exe"), ["-U", process.env.DB_USER, tempDb], { env })
  if (cr.status !== 0) return res.status(500).json({ error: "No se pudo crear la base temporal" })

  let rr
  try {
    rr = await spawnAsync(
      path.join(pgBin, "pg_restore.exe"),
      ["-U", process.env.DB_USER, "--no-owner", "--no-privileges", "-d", tempDb, fullPath],
      { env, timeout: 60000 }
    )
  } catch (err) {
    await spawnAsync(path.join(pgBin, "dropdb.exe"), ["-U", process.env.DB_USER, tempDb], { env }).catch(() => {})
    throw err
  }

  if (rr.status === null || rr.status > 1) {
    await spawnAsync(path.join(pgBin, "dropdb.exe"), ["-U", process.env.DB_USER, tempDb], { env }).catch(() => {})
    return res.status(500).json({ error: "Error al leer el backup" })
  }

  const tempPool = new pg.Pool({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    database: tempDb, user: process.env.DB_USER, password: process.env.DB_PASSWORD
  })
  try {
    const result = await tempPool.query(`
      SELECT c.numero_cliente, c.nombre,
             COUNT(DISTINCT i.id)::int AS total_informes,
             COALESCE(
               json_agg(
                 json_build_object('numero', i.numero_informe, 'fecha', TO_CHAR(i.fecha_emision, 'DD/MM/YYYY'))
                 ORDER BY i.id
               ) FILTER (WHERE i.id IS NOT NULL),
               '[]'::json
             ) AS informes
      FROM clientes c
      LEFT JOIN informes i ON i.cliente_id = c.id
      GROUP BY c.id, c.numero_cliente, c.nombre
      ORDER BY c.numero_cliente
    `)
    res.json({ clientes: result.rows })
  } finally {
    await tempPool.end()
    await spawnAsync(path.join(pgBin, "dropdb.exe"), ["-U", process.env.DB_USER, tempDb], { env }).catch(() => {})
  }
}))

app.post("/backup/restaurar", auth, wrap(async (req, res) => {
  if (req.usuario.rol !== "admin") return res.status(403).json({ error: "Solo el admin puede restaurar" })

  const logPath = process.env.BACKUP_LOG
  if (!logPath) return res.status(500).json({ error: "BACKUP_LOG no configurado" })

  const backupBase = path.dirname(logPath)
  let ultimo

  if (req.body?.archivo && req.body?.carpeta) {
    ultimo = validarRutaBackup(backupBase, req.body.carpeta, req.body.archivo)
    if (!ultimo || !fs.existsSync(ultimo)) return res.status(404).json({ error: "Archivo no encontrado" })
  } else {
    const candidatos = []
    for (const carpeta of ["frecuentes", "diarios"]) {
      const dir = path.join(backupBase, carpeta)
      try {
        fs.readdirSync(dir).filter(f => f.endsWith(".dump")).forEach(f => candidatos.push(path.join(dir, f)))
      } catch { }
    }
    if (candidatos.length === 0) return res.status(404).json({ error: "No hay backups disponibles" })
    candidatos.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    ultimo = candidatos[0]
  }

  const pgBin = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\18\\bin"
  const env   = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD }

  const result = await spawnAsync(
    path.join(pgBin, "pg_restore.exe"),
    ["-U", process.env.DB_USER, "--clean", "--if-exists", "-d", process.env.DB_NAME, ultimo],
    { env, timeout: 120000 }
  )

  if (result.status === 0 || result.status === 1) {
    res.json({ ok: true, archivo: path.basename(ultimo) })
  } else {
    res.status(500).json({ error: result.stderr || "Error en pg_restore" })
  }
}))

// ── INICIO ────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001

const distPath = path.join(__dirname, "..", "web", "dist")
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((_req, res) => res.sendFile(path.join(distPath, "index.html")))
}

app.listen(PORT, () => {
  console.log(`Servidor ZENG corriendo en http://localhost:${PORT}`)
})
