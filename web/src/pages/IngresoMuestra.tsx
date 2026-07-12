import * as React from "react"
import { Plus, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

// --- Datos de ejemplo (placeholder) ---------------------------------
// El mapeo completo ensayo -> parámetros todavía no está confirmado
// (pendiente de la 2ª visita, ver docs/ZENG - Checklist 2a visita.pdf).
// Acá va sólo lo que ya sabemos con certeza: 138 = Enterobacterias.
const ENSAYOS = [
  { codigo: "138", nombre: "Enterobacterias" },
  { codigo: "140", nombre: "Ensayo 140 (a confirmar)" },
  { codigo: "141", nombre: "Ensayo 141 (a confirmar)" },
  { codigo: "142", nombre: "Ensayo 142 (a confirmar)" },
  { codigo: "014", nombre: "Ensayo 014 (a confirmar)" },
  { codigo: "121", nombre: "Ensayo 121 (a confirmar)" },
]

const USUARIOS = [
  { iniciales: "sv", nombre: "S.V." },
  { iniciales: "dq", nombre: "D.Q." },
  { iniciales: "fr", nombre: "F.R." },
]

const CLIENTES = [
  { numero: "439", nombre: "CLAY" },
  { numero: "297", nombre: "Frigorífico Norte" },
  { numero: "026 A", nombre: "Distribuidora del Este" },
  { numero: "245", nombre: "Lácteos del Sur" },
  { numero: "160", nombre: "Panificados Rex" },
]

const MUESTRAS_RECIENTES = [
  {
    interno: 229038,
    cliente: "439",
    descripcion: "5 muestras de carne",
    fechaEntrada: "11/07/2026",
    ensayos: ["138"],
    estado: "pendiente" as const,
  },
  {
    interno: 229037,
    cliente: "297",
    descripcion: "Pico 1",
    fechaEntrada: "11/07/2026",
    ensayos: ["140", "141"],
    estado: "cargado" as const,
  },
  {
    interno: 229036,
    cliente: "026 A",
    descripcion: "Agua destilada",
    fechaEntrada: "10/07/2026",
    ensayos: ["142"],
    estado: "publicado" as const,
  },
  {
    interno: 229035,
    cliente: "245",
    descripcion: "Máquina de hielo",
    fechaEntrada: "10/07/2026",
    ensayos: ["138", "014"],
    estado: "publicado" as const,
  },
]

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  cargado: "Cargado",
  publicado: "Publicado",
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
function horaAhoraISO() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function IngresoMuestra() {
  const [ensayosSeleccionados, setEnsayosSeleccionados] = React.useState<
    string[]
  >(["138"])

  function toggleEnsayo(codigo: string) {
    setEnsayosSeleccionados((prev) =>
      prev.includes(codigo)
        ? prev.filter((c) => c !== codigo)
        : [...prev, codigo]
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      {/* --- Formulario de ingreso --- */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nueva muestra</CardTitle>
          <CardDescription>
            Etapa 1 — Cuaderno de Entrada. Al guardar se genera el N° de
            muestra y pasa a carga de resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente">
              Cliente <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Select defaultValue={CLIENTES[0].numero}>
              <SelectTrigger id="cliente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENTES.map((c) => (
                  <SelectItem key={c.numero} value={c.numero}>
                    {c.numero} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">
              Descripción de la muestra <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input id="descripcion" placeholder="Ej. 5 muestras de carne" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-entrada">
                Fecha de entrada <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="fecha-entrada" type="date" defaultValue={hoyISO()} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hora-entrada">Hora de entrada</Label>
              <Input id="hora-entrada" type="time" defaultValue={horaAhoraISO()} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha-muestreo">
              Fecha de muestreo{" "}
              <span className="font-normal normal-case text-muted-foreground/70">
                (la da el cliente)
              </span>
            </Label>
            <Input id="fecha-muestreo" type="date" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recibido">Recibido por</Label>
            <Select defaultValue={USUARIOS[0].iniciales}>
              <SelectTrigger id="recibido">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USUARIOS.map((u) => (
                  <SelectItem key={u.iniciales} value={u.iniciales}>
                    {u.nombre} ({u.iniciales})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Ensayos a realizar <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {ENSAYOS.map((e) => {
                const selected = ensayosSeleccionados.includes(e.codigo)
                return (
                  <button
                    key={e.codigo}
                    type="button"
                    onClick={() => toggleEnsayo(e.codigo)}
                    className={
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                      (selected
                        ? "border-teal-700 bg-teal-50 text-teal-700"
                        : "border-border bg-card text-muted-foreground hover:bg-muted")
                    }
                  >
                    {e.codigo} · {e.nombre}
                    {selected ? (
                      <X className="size-3" />
                    ) : (
                      <Plus className="size-3" />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              El mapeo ensayo → parámetros completo se confirma en la 2ª
              visita al laboratorio.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observaciones">Observaciones</Label>
            <textarea
              id="observaciones"
              rows={2}
              placeholder="Opcional"
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-[11px] text-muted-foreground">* Campos obligatorios</p>
          <div className="flex gap-2">
            <Button variant="outline">Limpiar</Button>
            <Button variant="secondary">Guardar muestra</Button>
          </div>
        </CardFooter>
      </Card>

      {/* --- Listado de muestras recientes --- */}
      <Card className="h-fit">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Muestras recientes</CardTitle>
            <CardDescription>Últimas muestras ingresadas hoy</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por N° o cliente..."
              className="w-56 pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Muestra</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Ensayos</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MUESTRAS_RECIENTES.map((m) => {
                const cliente = CLIENTES.find((c) => c.numero === m.cliente)
                return (
                  <TableRow key={m.interno}>
                    <TableCell className="font-mono text-xs">
                      {m.interno}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{cliente?.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.cliente}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.descripcion}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.ensayos.map((code) => (
                          <span
                            key={code}
                            className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-800"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.fechaEntrada}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.estado}>
                        {ESTADO_LABEL[m.estado]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
