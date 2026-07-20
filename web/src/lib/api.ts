// URL base de la API. En produccion es "" (mismo origen). En dev viene de .env.development
export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ""
