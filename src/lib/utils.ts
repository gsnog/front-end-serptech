import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TZ = 'America/Sao_Paulo'

/**
 * Formata uma data no padrão brasileiro DD/MM/YYYY.
 * - Strings YYYY-MM-DD (sem hora): parsing por string, sem conversão UTC.
 * - Strings ISO com hora/timezone: converte para America/Sao_Paulo antes de extrair a data.
 * - Strings já em DD/MM/YYYY: retorna sem alteração.
 */
export function fmtDate(value?: string | null): string {
  if (!value) return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  // Data pura sem hora — usa split para evitar conversão UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  // Datetime com fuso (ex: 2026-06-29T00:00:00Z) — converte para UTC-3
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { timeZone: TZ })
}

/**
 * Formata um datetime ISO para DD/MM/YYYY HH:mm no fuso America/Sao_Paulo.
 */
export function fmtDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return (
    d.toLocaleDateString('pt-BR', { timeZone: TZ }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  )
}

/**
 * Converte um Date para string YYYY-MM-DD no fuso LOCAL, sem conversão UTC.
 * Use no lugar de `date.toISOString().split('T')[0]`, que desloca o dia
 * em -1 entre 00h e 03h em America/Sao_Paulo (UTC-3).
 */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Data local de hoje como YYYY-MM-DD, correta em qualquer fuso horário.
 */
export function todayStr(): string {
  return localDateStr(new Date())
}

/**
 * Diferença em dias entre duas datas YYYY-MM-DD, sem influência de fuso.
 * Constrói as datas no horário local (meia-noite) para evitar o parse UTC
 * de `new Date('YYYY-MM-DD')`.
 */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const a = new Date(fy, fm - 1, fd)
  const b = new Date(ty, tm - 1, td)
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000)
}
