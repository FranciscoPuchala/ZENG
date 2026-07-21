# Guía de instalación — paso a paso

Cómo dejar el sistema andando en el laboratorio: **una PC servidor** (que tiene la base y el
programa) y **las demás PC** que solo lo usan por el navegador.

---

## Parte A — La PC servidor (se hace UNA sola vez)

Es la máquina que va a quedar **siempre prendida** y que tiene la base de datos.

1. **Elegir la PC servidor:** la más confiable, que pueda quedar prendida siempre.
2. **Instalar los dos prerequisitos:**
   - **PostgreSQL 18** (dejar anotada la contraseña del usuario `postgres` que ponés en la instalación).
   - **Node.js 18 o superior**.
3. **Copiar el proyecto** a la PC (clonar el repo de GitHub o copiar la carpeta `ZENG`).
4. **Conectar el disco externo de 2 TB** (para los backups) y anotar su **letra** (ej. `E:`).
5. **Correr el instalador:** abrir PowerShell **como Administrador** en la carpeta del proyecto y ejecutar:
   ```
   deploy\instalar.ps1
   ```
   Te va a pedir: la **contraseña de Postgres**, el **puerto** (dejá 3001), y la **carpeta de backups**
   (la letra del disco de 2 TB). Después hace todo solo: crea la base, carga el catálogo, crea el
   primer usuario **admin**, arma el frontend, deja el backend en **auto-arranque**, abre el
   **firewall** y te muestra la **IP del servidor**.
6. **Anotar la IP** que te muestra al final (ej. `http://192.168.1.50:3001`). La vas a necesitar
   para las otras PC.
7. **Verificar:** abrí esa dirección en el navegador de la misma PC servidor → tiene que aparecer el **login**.

> A partir de acá, cada vez que se prenda la PC servidor, el sistema arranca solo. Y los backups
> corren solos cada 30 minutos al disco externo.

---

## Parte B — Cada PC cliente (las otras)

**No se instala NADA.** Solo:

1. Abrir el **navegador** (Chrome o Edge).
2. Ir a la **dirección del servidor** (la que anotaste, ej. `http://192.168.1.50:3001`).
3. (Recomendado) **Crear un acceso directo** en el escritorio a esa dirección, para entrar de un clic.
4. **Iniciar sesión** con el usuario de esa persona.

Listo. Todas las PC ven **los mismos datos** porque todas hablan con el mismo servidor.

---

## Parte C — Cosas para tener en cuenta

- La **PC servidor tiene que quedar prendida** (al menos en horario de trabajo). Si se apaga, nadie
  puede usar el sistema hasta que se prenda de nuevo (y al prenderse arranca todo solo).
- **Usuarios nuevos:** los crea el admin desde la PC servidor con `node crear_admin.js` (en la
  carpeta `api/`).
- **Actualizar el sistema:** se hace **una sola vez en el servidor** (traer la versión nueva +
  rebuild + reiniciar el backend). Las demás PC ven la versión nueva al **refrescar**.
- **Si algo falla:** ver `docs/GUIA_BASE_DE_DATOS.md` (diagnóstico de abajo hacia arriba: ¿está la
  base? ¿el backend? ¿el frontend?).
- Detalle técnico completo del instalador: `deploy/README.md`.
