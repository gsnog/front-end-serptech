import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data no padrão brasileiro DD/MM/YYYY.
 * Aceita strings YYYY-MM-DD, ISO datetime ou já formatadas DD/MM/YYYY.
 * Usa manipulação de string pura para evitar problemas de fuso horário.
 */
export function fmtDate(value?: string | null): string {
  if (!value) return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const datePart = value.substring(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-')
    return `${d}/${m}/${y}`
  }
  return value
}

/**
 * Formata um datetime ISO para DD/MM/YYYY HH:mm.
 */
export function fmtDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
