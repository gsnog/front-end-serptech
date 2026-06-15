import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { todayStr, localDateStr, daysBetween } from './utils'

describe('localDateStr', () => {
  it('formata como YYYY-MM-DD no horário local (sem conversão UTC)', () => {
    // 1º de junho às 23h local NÃO deve virar 2 de junho (bug do toISOString).
    expect(localDateStr(new Date(2025, 5, 1, 23, 0, 0))).toBe('2025-06-01')
  })

  it('preenche zero à esquerda em mês e dia', () => {
    expect(localDateStr(new Date(2025, 0, 5))).toBe('2025-01-05')
  })
})

describe('todayStr', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retorna a data local mesmo perto da meia-noite', () => {
    // 8 de junho às 01h local: toISOString daria 07/06 em UTC-3; todayStr não.
    vi.setSystemTime(new Date(2025, 5, 8, 1, 0, 0))
    expect(todayStr()).toBe('2025-06-08')
  })
})

describe('daysBetween', () => {
  it('conta dias inteiros entre duas datas', () => {
    expect(daysBetween('2025-06-01', '2025-06-30')).toBe(29)
  })

  it('é zero para a mesma data', () => {
    expect(daysBetween('2025-06-08', '2025-06-08')).toBe(0)
  })

  it('atravessa a virada de mês corretamente', () => {
    expect(daysBetween('2025-01-31', '2025-02-01')).toBe(1)
  })
})
