import "dotenv/config"
import express from "express"
import pg from "pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10

// --- Conexión a PostgreSQL ---
const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// --- Servidor Express ---
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

// POST /login → verifica usuario+contraseña y devuelve un JWT
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body
  if (!usuario || !password) return res.status(400).json({ error: "Faltan datos" })

  const result = await pool.query(
    "SELECT id, usuario, nombre, iniciales, rol, password_hash FROM usuarios WHERE usuario = $1",
    [usuario]
  )
  const user = result.rows[0]
  if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" })

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" })

  const token = jwt.sign(
    { id: user.id, usuario: user.usuario, nombre: user.nombre, iniciales: user.iniciales, rol: user.rol },
    JWT_SECRET,
    { expiresIn: "12h" }
  )
  res.json({ token, usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre, iniciales: user.iniciales, rol: user.rol } })
})

// GET /me → verifica el token y devuelve el usuario actual (para recargar la sesión)
app.get("/me", auth, (req, res) => {
  res.json(req.usuario)
})

// POST /usuarios → crea un usuario nuevo (solo admin)
app.post("/usuarios", auth, async (req, res) => {
  if (req.usuario.rol !== "admin") return res.status(403).json({ error: "Solo el admin puede crear usuarios" })
  const { usuario, password, nombre, iniciales, rol = "analista" } = req.body
  if (!usuario || !password || !iniciales) return res.status(400).json({ error: "Faltan datos obligatorios" })
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const result = await pool.query(
    "INSERT INTO usuarios (usuario, password_hash, nombre, iniciales, rol) VALUES ($1,$2,$3,$4,$5) RETURNING id, usuario, nombre, iniciales, rol",
    [usuario, hash, nombre || null, iniciales, rol]
  )
  res.status(201).json(result.rows[0])
})

// ── CLIENTES ──────────────────────────────────────────────────────────

// GET /stats/panel → todos los datos del dashboard en una sola llamada
app.get("/stats/panel", async (req, res) => {
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
})

app.get("/clientes", async (req, res) => {
  const result = await pool.query("SELECT * FROM clientes ORDER BY numero_cliente")
  res.json(result.rows)
})

app.post("/clientes", async (req, res) => {
  const { numero_cliente, nombre, direccion, telefono } = req.body
  const result = await pool.query(
    "INSERT INTO clientes (numero_cliente, nombre, direccion, telefono) VALUES ($1, $2, $3, $4) RETURNING *",
    [numero_cliente, nombre, direccion, telefono]
  )
  res.status(201).json(result.rows[0])
})

// GET /clientes/:id/analisis → historial completo de un cliente
app.get("/clientes/:id/analisis", async (req, res) => {
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
})

// ── USUARIOS ──────────────────────────────────────────────────────────

app.get("/usuarios", async (req, res) => {
  const result = await pool.query("SELECT * FROM usuarios ORDER BY iniciales")
  res.json(result.rows)
})

// ── ENSAYOS ───────────────────────────────────────────────────────────

app.get("/ensayos", async (req, res) => {
  const result = await pool.query("SELECT * FROM ensayos ORDER BY codigo")
  res.json(result.rows)
})

// ── MUESTRAS ──────────────────────────────────────────────────────────

// GET /muestras → devuelve muestras con nombre de cliente, ensayos y estado
app.get("/muestras", async (req, res) => {
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
        (SELECT estado FROM analisis WHERE muestra_id = m.id ORDER BY id LIMIT 1),
        'pendiente'
      ) AS estado
    FROM muestras m
    JOIN clientes c ON c.id = m.cliente_id
    ORDER BY m.numero_interno DESC
    LIMIT 50
  `)
  res.json(result.rows)
})

// POST /muestras → crea muestra + los análisis de cada ensayo seleccionado
app.post("/muestras", async (req, res) => {
  const {
    cliente_id, descripcion, fecha_entrada, hora_entrada,
    fecha_muestreo, recibido_por, observaciones, ensayo_ids
  } = req.body

  // Número interno global: el máximo actual + 1
  const maxResult = await pool.query(
    "SELECT COALESCE(MAX(numero_interno), 228000) + 1 AS siguiente FROM muestras"
  )
  const numero_interno = maxResult.rows[0].siguiente

  // Crear la muestra
  const muestraResult = await pool.query(
    `INSERT INTO muestras
      (numero_interno, cliente_id, descripcion, fecha_entrada, hora_entrada,
       fecha_muestreo, recibido_por, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [numero_interno, cliente_id, descripcion, fecha_entrada,
     hora_entrada || null, fecha_muestreo || null, recibido_por || null, observaciones || null]
  )
  const muestra = muestraResult.rows[0]

  // Crear un análisis (en estado "pendiente") por cada ensayo seleccionado
  if (ensayo_ids && ensayo_ids.length > 0) {
    for (const ensayo_id of ensayo_ids) {
      await pool.query(
        "INSERT INTO analisis (muestra_id, ensayo_id, estado) VALUES ($1, $2, 'pendiente')",
        [muestra.id, ensayo_id]
      )
    }
  }

  res.status(201).json(muestra)
})

// DELETE /muestras/:id → borra una muestra y sus análisis (solo si todos están pendientes)
app.delete("/muestras/:id", async (req, res) => {
  const { id } = req.params
  try {
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
  } catch (err) {
    console.error("DELETE /muestras/:id →", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── ANÁLISIS ──────────────────────────────────────────────────────────

// GET /analisis/pendientes → análisis en estado 'pendiente' con datos de muestra, cliente y ensayo
app.get("/analisis/pendientes", async (req, res) => {
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
})

// GET /ensayos/:id/parametros → parámetros de un ensayo (por id numérico)
// Usado en CargaResultados al seleccionar un análisis pendiente.
app.get("/ensayos/:id/parametros", async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.codigo, p.descripcion AS nombre, p.unidad, p.tipo_valor, ep.orden
     FROM parametros p
     JOIN ensayo_parametros ep ON ep.parametro_id = p.id
     WHERE ep.ensayo_id = $1
     ORDER BY ep.orden, p.codigo`,
    [req.params.id]
  )
  res.json(result.rows)
})

// GET /ensayos/:codigo/plantilla → plantilla completa de un ensayo (por código texto)
// Devuelve { ensayo, parametros[], metodologias[] }.
// Usado en la futura pantalla de carga donde el analista escribe el código de ensayo.
app.get("/ensayos/:codigo/plantilla", async (req, res) => {
  // 1. Buscar el ensayo por código
  const ensayoRes = await pool.query(
    "SELECT id, codigo, nombre FROM ensayos WHERE codigo = $1",
    [req.params.codigo]
  )
  if (ensayoRes.rows.length === 0) {
    return res.status(404).json({ error: "Ensayo no encontrado" })
  }
  const ensayo = ensayoRes.rows[0]

  // 2. Traer parámetros y metodologías en paralelo (más rápido que uno por uno)
  const [paramRes, metodRes] = await Promise.all([
    pool.query(
      `SELECT p.id, p.codigo, p.descripcion, p.unidad, p.tipo_valor, ep.orden
       FROM parametros p
       JOIN ensayo_parametros ep ON ep.parametro_id = p.id
       WHERE ep.ensayo_id = $1
       ORDER BY ep.orden, p.codigo`,
      [ensayo.id]
    ),
    pool.query(
      `SELECT m.codigo, m.descripcion
       FROM metodologias m
       JOIN ensayo_metodologias em ON em.metodologia_id = m.id
       WHERE em.ensayo_id = $1
       ORDER BY em.orden, m.codigo`,
      [ensayo.id]
    ),
  ])

  res.json({
    ensayo,
    parametros:   paramRes.rows,
    metodologias: metodRes.rows,
  })
})

// GET /analisis/cargados → análisis en estado 'cargado' listos para agrupar en informe
app.get("/analisis/cargados", async (req, res) => {
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
})

// POST /informes → crea un informe y pasa los análisis seleccionados a 'publicado'
app.post("/informes", async (req, res) => {
  const { cliente_id, numero_informe, fecha_recepcion, fecha_emision, analisis_ids } = req.body

  // Derivar fecha_muestreo (de la muestra) y fecha_analisis (fecha_siembra) automáticamente
  const datesRes = await pool.query(
    `SELECT MIN(m.fecha_muestreo) AS fecha_muestreo, MIN(a.fecha_siembra) AS fecha_analisis
     FROM analisis a JOIN muestras m ON m.id = a.muestra_id WHERE a.id = ANY($1::int[])`,
    [analisis_ids]
  )
  const { fecha_muestreo, fecha_analisis } = datesRes.rows[0]

  const informeResult = await pool.query(
    `INSERT INTO informes
       (cliente_id, numero_informe, fecha_muestreo, fecha_recepcion, fecha_analisis, fecha_emision, publicado, fecha_publicado)
     VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_DATE) RETURNING *`,
    [cliente_id, numero_informe, fecha_muestreo || null, fecha_recepcion || null,
     fecha_analisis || null, fecha_emision || null]
  )
  const informe = informeResult.rows[0]

  for (const aid of analisis_ids) {
    await pool.query(
      `UPDATE analisis SET informe_id = $1, numero_informe = $2, estado = 'publicado' WHERE id = $3`,
      [informe.id, numero_informe, aid]
    )
  }

  res.status(201).json(informe)
})

// GET /informes → lista de informes publicados (para reimprimir)
app.get("/informes", async (req, res) => {
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
    ORDER BY i.id DESC
    LIMIT 100
  `)
  res.json(result.rows)
})

// GET /informes/:id/reporte → todos los datos para imprimir el informe
app.get("/informes/:id/reporte", async (req, res) => {
  const { id } = req.params

  // Informe + cliente
  const infRes = await pool.query(`
    SELECT i.*, c.nombre AS cliente_nombre, c.numero_cliente,
           c.direccion, c.telefono, c.fax
    FROM informes i JOIN clientes c ON c.id = i.cliente_id
    WHERE i.id = $1
  `, [id])
  if (infRes.rows.length === 0) return res.status(404).json({ error: "No encontrado" })
  const informe = infRes.rows[0]

  // Análisis del informe con datos de muestra, ensayo y contador por cliente
  const analisisRes = await pool.query(`
    SELECT a.id, a.fecha_siembra, a.ensayo_id,
           m.numero_interno, m.descripcion,
           e.codigo AS ensayo_codigo, e.nombre AS ensayo_nombre,
           ROW_NUMBER() OVER (PARTITION BY m.cliente_id ORDER BY m.numero_interno)
             AS numero_cliente_secuencial
    FROM analisis a
    JOIN muestras m ON m.id = a.muestra_id
    JOIN ensayos  e ON e.id = a.ensayo_id
    WHERE a.informe_id = $1
    ORDER BY m.numero_interno
  `, [id])

  // Resultados por análisis
  const analisis = []
  for (const a of analisisRes.rows) {
    const resRes = await pool.query(`
      SELECT p.descripcion, p.unidad, r.valor, r.lectura_dilucion,
             COALESCE(ep.orden, 999) AS orden
      FROM resultados r
      JOIN parametros p ON p.id = r.parametro_id
      LEFT JOIN ensayo_parametros ep ON ep.parametro_id = p.id AND ep.ensayo_id = $2
      WHERE r.analisis_id = $1
      ORDER BY orden, p.codigo
    `, [a.id, a.ensayo_id])
    analisis.push({ ...a, resultados: resRes.rows })
  }

  // Metodologías del ensayo del primer análisis
  const ensayoId = analisisRes.rows[0]?.ensayo_id
  let metodologias = []
  if (ensayoId) {
    const metRes = await pool.query(`
      SELECT m.codigo, m.descripcion
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

  res.json({ informe, ensayo, analisis, metodologias })
})

// POST /analisis/:id/resultados → guarda los valores y pasa el análisis a 'cargado'
app.post("/analisis/:id/resultados", async (req, res) => {
  const { id } = req.params
  const { fecha_siembra, hora_siembra, analista_id, revisor_id, resultados } = req.body

  // Actualizar el análisis con fecha de siembra y estado
  await pool.query(
    `UPDATE analisis SET fecha_siembra=$1, hora_siembra=$2, estado='cargado' WHERE id=$3`,
    [fecha_siembra, hora_siembra || null, id]
  )

  // Insertar un resultado por parámetro (ignorar duplicados por si se guarda dos veces)
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
})

// ── INICIO ────────────────────────────────────────────────────────────
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Servidor ZENG corriendo en http://localhost:${PORT}`)
})
