# ZENG — Sistema de gestión para laboratorio de microbiología

> Contexto del proyecto. Claude Code lee este archivo automáticamente al abrir la carpeta,
> así que sirve para retomar el trabajo sin perder nada de lo conversado.

## Qué es esto
Sistema NUEVO para reemplazar el software actual del laboratorio **ZENG** (microbiología de
alimentos). Objetivo doble: (1) herramienta interna para ZENG, siendo dueños del sistema;
(2) a futuro, producto para vender a otros laboratorios chicos del rubro. ZENG es el sitio
de validación.

## Principios de trabajo
- Entender el problema en profundidad ANTES de construir.
- Hacer un MVP (un tipo de análisis de punta a punta) y correrlo EN PARALELO con el sistema
  viejo antes de reemplazar nada.
- Construir de forma **independiente y reservada** del programador externo que hizo el sistema
  actual: no copiar su código ni su esquema. Los datos y el formato del informe son del
  laboratorio y se pueden reproducir.

## Restricciones
- El laboratorio trabaja **100% offline** (sin internet).
- Meta: un **servidor local** con la base, usado desde todas las PC por la red.

## Cómo funciona el laboratorio hoy (relevado)
Flujo en 3 etapas sobre 2 programas:
1. **Cuaderno de Entrada** (app Access) — se ingresa la muestra (cliente, descripción, cantidad
   de análisis → códigos de ensayo). Genera el N° de muestra global.
2. **Resultados** (programa aparte, sobre SQL Server Express en 192.168.1.106) — se importa la
   muestra, se cargan los parámetros (queda "pendiente") y luego los valores/resultados.
3. **Cuaderno de Análisis / Informe** (app Access) — imprime la hoja de trabajo ("Reporte de
   Ficha") para anotar a mano, y el **Informe de Ensayo** final que se entrega al cliente.
   **El informe debe reproducirse EXACTAMENTE igual.**

Detalle completo en `ZENG - Relevamiento del Sistema Actual.pdf`.

## Arquitectura (dirección elegida)
- **Base de datos:** PostgreSQL (relacional, libre, corre en Windows/Linux/Raspberry).
- **Backend:** Node.js / JavaScript.
- **Cliente:** preferentemente **app web en la LAN** (navegador en cada PC, sin instalar por
  máquina), servida desde el servidor local. Alternativa: escritorio (Electron).
- **Servidor:** una máquina siempre prendida (reusar la dedicada actual, un mini-PC, o una
  Raspberry Pi con SSD + backups + UPS). Nota: SQL Server NO corre en Raspberry; PostgreSQL sí.
- Falta confirmar con el lab: motor (Postgres vs seguir SQL Server), tipo de servidor, web vs escritorio.

## Modelo de datos
Esquema v1 (PostgreSQL) en **`zeng_esquema_v1.sql`**. 8 tablas:
- Catálogo: `clientes`, `usuarios`, `ensayos`, `parametros`.
- Operación: `muestras`, `analisis`, `resultados`, `informes`.
Notas: `numero_cliente` es texto (ej. "026 A"); `valor` del resultado es texto (ej. "<1.0*10(1)",
"NEGATIVO"); el "Nro. Análisis" = `numero_cliente / numero_informe / fecha_siembra(aaaa-mm-dd)`
se arma en la app, no se guarda como texto.

## Campos ya confirmados
- Nro. Análisis = cliente / N° informe / **fecha de siembra** (formato año-mes-día; 26-06-19 = 2026-06-19).
- "Inf. De En…" = info de ensayo → **se ignora**.
- "Publicado" = informe **aprobado para publicar**.
- "Fecha Muestra" = **fecha de muestreo**, la da el cliente, **manual**.
- "Muestra Interna" = "Muestra" en todas las etapas = mismo contador global.

## Pendiente (2ª visita al lab)
Ver `ZENG - Checklist 2a visita.pdf`. Lo grande: mapeo **ensayo → parámetros**, copia de **cada
formato de informe**, **acceso a los datos** (Access / exportar / credenciales SQL), **infra y red**
(PCs, máquina dedicada, backups), regla fina del **N° de informe por cliente**, y si un **informe
agrupa una o varias muestras**. Negocio: cuánto pagan al programador hoy y cuántos labs hay.

## Roadmap (orden)
1. 2ª visita (cerrar pendientes). 2. Fijar las 3 decisiones de arquitectura. 3. Cerrar el esquema SQL.
4. Montar Postgres + Node en el servidor local. 5. Cargar catálogo / migrar. 6. Backend de las 3 etapas.
7. Informe idéntico (PDF). 8. Frontend web. 9. MVP de un análisis + correr en paralelo.
10. Completar + producción. 11. Validar precio y vender a un 2º lab.

## Archivos
- `zeng_esquema_v1.sql` — esquema PostgreSQL (estructura de la base).
- `ZENG - Relevamiento del Sistema Actual.pdf` — mapa completo del sistema actual.
- `ZENG - Checklist 2a visita.pdf` — qué confirmar/traer de la próxima visita.
- `guia_relevamiento_ZENG.docx`, `Proyecto_ZENG_Innovacion_Laboratorios.pdf` — material previo.

## Sobre quién desarrolla
Francisco programa en JS/Node (principiante/intermedio, facultad), sin experiencia previa de
bases de datos ni infraestructura. Explicar conceptos de DB/redes/servidores sin asumir
experiencia. Proyecto y comunicación en español.
