// Carga el catálogo completo del laboratorio desde los CSVs en db/.
// Usar desde la carpeta api/:   node seed_catalogos.js
// Requiere:  api/.env  con las credenciales de la base.

import "dotenv/config"
import pg from "pg"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR    = path.join(__dirname, "../db")

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Parser CSV simple que maneja campos entre comillas (pueden contener comas)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8").replace(/\r/g, "")
  const lines   = content.trim().split("\n")
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase())

  return lines.slice(1).map(line => {
    const values = []
    let current  = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"')            inQuotes = !inQuotes
      else if (ch === "," && !inQuotes) { values.push(current.trim()); current = "" }
      else                       current += ch
    }
    values.push(current.trim())

    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // ── 1. Ensayos ──────────────────────────────────────────────────────
    const ensayos = parseCSV(path.join(DB_DIR, "seed_ensayos.csv"))
    for (const e of ensayos) {
      await client.query(
        `INSERT INTO ensayos (codigo, nombre) VALUES ($1, $2)
         ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre`,
        [e.codigo, e.nombre]
      )
    }
    console.log(`✓ Ensayos: ${ensayos.length}`)

    // ── 2. Parámetros ───────────────────────────────────────────────────
    const parametros = parseCSV(path.join(DB_DIR, "seed_parametros.csv"))
    for (const p of parametros) {
      await client.query(
        `INSERT INTO parametros (codigo, descripcion, unidad, tipo_valor) VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo) DO UPDATE
           SET descripcion = EXCLUDED.descripcion,
               unidad      = EXCLUDED.unidad,
               tipo_valor  = EXCLUDED.tipo_valor`,
        [p.codigo, p.descripcion, p.unidad || null, p.tipo_valor || "numerico"]
      )
    }
    console.log(`✓ Parámetros: ${parametros.length}`)

    // ── 3. Metodologías ─────────────────────────────────────────────────
    const metodologias = parseCSV(path.join(DB_DIR, "seed_metodologias.csv"))
    for (const m of metodologias) {
      await client.query(
        `INSERT INTO metodologias (codigo, descripcion) VALUES ($1, $2)
         ON CONFLICT (codigo) DO UPDATE SET descripcion = EXCLUDED.descripcion`,
        [m.codigo, m.descripcion]
      )
    }
    console.log(`✓ Metodologías: ${metodologias.length}`)

    // ── 4. Relaciones ensayo → parámetro ────────────────────────────────
    const ep = parseCSV(path.join(DB_DIR, "seed_ensayo_parametros.csv"))
    let skippedEP = 0
    for (const row of ep) {
      const res = await client.query(
        `INSERT INTO ensayo_parametros (ensayo_id, parametro_id, orden)
         SELECT e.id, p.id, $3
         FROM ensayos e, parametros p
         WHERE e.codigo = $1 AND p.codigo = $2
         ON CONFLICT (ensayo_id, parametro_id) DO UPDATE SET orden = EXCLUDED.orden`,
        [row.codigo_ensayo, row.codigo_parametro, parseInt(row.orden) || 0]
      )
      if (res.rowCount === 0) skippedEP++
    }
    console.log(`✓ Ensayo→Parámetro: ${ep.length - skippedEP} cargados${skippedEP ? `, ${skippedEP} sin resolver` : ""}`)

    // ── 5. Relaciones ensayo → metodología ──────────────────────────────
    const em = parseCSV(path.join(DB_DIR, "seed_ensayo_metodologias.csv"))
    let skippedEM = 0
    for (const row of em) {
      const res = await client.query(
        `INSERT INTO ensayo_metodologias (ensayo_id, metodologia_id, orden)
         SELECT e.id, m.id, $3
         FROM ensayos e, metodologias m
         WHERE e.codigo = $1 AND m.codigo = $2
         ON CONFLICT (ensayo_id, metodologia_id) DO UPDATE SET orden = EXCLUDED.orden`,
        [row.codigo_ensayo, row.codigo_metodologia, parseInt(row.orden) || 0]
      )
      if (res.rowCount === 0) skippedEM++
    }
    console.log(`✓ Ensayo→Metodología: ${em.length - skippedEM} cargados${skippedEM ? `, ${skippedEM} sin resolver` : ""}`)

    await client.query("COMMIT")
    console.log("\n✅ Catálogo real cargado correctamente.\n")

    // ── Verificación: ensayo 01 (Potabilidad) → 4 parámetros, 3 metodologías
    const vp = await client.query(
      `SELECT COUNT(*) FROM ensayo_parametros ep
       JOIN ensayos e ON e.id = ep.ensayo_id WHERE e.codigo = '01'`
    )
    const vm = await client.query(
      `SELECT COUNT(*) FROM ensayo_metodologias em
       JOIN ensayos e ON e.id = em.ensayo_id WHERE e.codigo = '01'`
    )
    console.log("Verificación — Ensayo 01 (Potabilidad):")
    console.log(`  Parámetros:   ${vp.rows[0].count} (esperado: 4)`)
    console.log(`  Metodologías: ${vm.rows[0].count} (esperado: 3)`)

  } catch (err) {
    await client.query("ROLLBACK")
    console.error("\n❌ Error — se deshizo todo:", err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
