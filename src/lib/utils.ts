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
