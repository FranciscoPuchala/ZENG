import "dotenv/config"
import express from "express"
import pg from "pg"

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

// CORS: permite que el frontend (localhost:5173) llame a esta API (localhost:3001)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
  if (req.method === "OPTIONS") return res.sendStatus(200)
  next()
})

// ── CLIENTES ──────────────────────────────────────────────────────────

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

// ── ANÁLISIS ──────────────────────────────────────────────────────────

// GET /analisis/pendientes → análisis en estado 'pendiente' con datos de muestra, cliente y ensayo
app.get("/analisis/pendientes", async (req, res) => {
  const result = await pool.query(`
    SELECT
      a.id, a.muestra_id, a.ensayo_id,
      m.numero_interno, m.descripcion, m.fecha_entrada,
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

// GET /ensayos/:id/parametros → parámetros de un ensayo
app.get("/ensayos/:id/parametros", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM parametros WHERE ensayo_id = $1 ORDER BY orden, id",
    [req.params.id]
  )
  res.json(result.rows)
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
