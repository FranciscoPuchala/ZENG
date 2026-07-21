// URL base de la API. En produccion es "" (mismo origen). En dev viene de .env.development
export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ""

import { leerToken } from "@/lib/auth"

// Wrapper de fetch que agrega el header Authorization automáticamente
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = leerToken()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetch(`${API}${path}`, { ...options, headers })
}
