# ZENG — Sistema de gestión de laboratorio

Sistema nuevo (independiente y offline) para el laboratorio de microbiología de alimentos
**ZENG**, pensado también como producto para otros laboratorios.

- **Estado:** relevamiento del sistema actual hecho; modelo de datos v1 definido.
- **Stack previsto:** PostgreSQL + Node.js + app web en la red local.
- **Esquema de la base:** ver [`zeng_esquema_v1.sql`](zeng_esquema_v1.sql).
- **Contexto completo del proyecto:** ver [`CLAUDE.md`](CLAUDE.md).

## Poner la base en marcha (servidor local)
```
createdb zeng
psql -d zeng -f zeng_esquema_v1.sql
```
