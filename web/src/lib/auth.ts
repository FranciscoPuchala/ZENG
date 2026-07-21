const KEY = "zeng_token"

export interface UsuarioSesion {
  id: number
  usuario: string
  nombre: string
  iniciales: string
  rol: string
  exp?: number
}

export function guardarToken(token: string) {
  sessionStorage.setItem(KEY, token)
}

export function leerToken(): string | null {
  return sessionStorage.getItem(KEY)
}

export function borrarToken() {
  sessionStorage.removeItem(KEY)
}

// Lee el payload del JWT guardado (sin verificar firma, solo para mostrar datos)
export function leerSesion(): UsuarioSesion | null {
  const token = leerToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as UsuarioSesion & { exp: number }
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      borrarToken()
      return null
    }
    return payload
  } catch {
    borrarToken()
    return null
  }
}
