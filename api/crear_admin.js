// Script de un solo uso para crear el primer usuario admin.
// Correr con: node api/crear_admin.js
// Luego podés crear el resto desde la pantalla de administración.

import "dotenv/config"
import pg from "pg"
import bcrypt from "bcrypt"
import readline from "readline"

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const preguntar = (q) => new Promise(res => rl.question(q, res))

console.log("\n=== Crear usuario admin — ZENG ===\n")

const usuario   = await preguntar("Nombre de usuario (ej. francisco): ")
const password  = await preguntar("Contraseña: ")
const nombre    = await preguntar("Nombre completo (ej. Francisco Puchala): ")
const iniciales = await preguntar("Iniciales (ej. fp): ")
rl.close()

const hash = await bcrypt.hash(password, 10)

const result = await pool.query(
  `INSERT INTO usuarios (usuario, password_hash, nombre, iniciales, rol)
   VALUES ($1, $2, $3, $4, 'admin')
   ON CONFLICT (usuario) DO UPDATE SET password_hash = $2, rol = 'admin'
   RETURNING id, usuario, nombre, iniciales, rol`,
  [usuario, hash, nombre, iniciales]
)

console.log("\nUsuario creado/actualizado:")
console.table(result.rows)
await pool.end()
