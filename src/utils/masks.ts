/** Aplica máscara de CPF: 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

/** Aplica máscara de RG: 00.000.000-0 (até 9 dígitos; aceita X no dígito final) */
export function maskRg(value: string): string {
  const d = value.replace(/[^0-9Xx]/g, '').slice(0, 9)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}-${d.slice(8)}`
}

/** Aplica máscara de telefone celular: (00) 00000-0000 */
export function maskCelular(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

/** Aplica máscara de telefone fixo: (00) 0000-0000 */
export function maskTelefoneFixo(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
}

/** Aplica máscara de CEP: 00000-000 */
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

/** Aplica máscara de PIS/PASEP: 000.00000.00-0 */
export function maskPisPasep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 8) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0,3)}.${d.slice(3,8)}.${d.slice(8)}`
  return `${d.slice(0,3)}.${d.slice(3,8)}.${d.slice(8,10)}-${d.slice(10)}`
}
