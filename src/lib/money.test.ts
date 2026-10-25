import { describe, expect, it } from 'vitest'
import { centsToInput, formatMoney, formatMoneyCompact, parseMoney, toCents } from './money'

describe('parseMoney', () => {
  it('reads typed amounts with or without $ and commas', () => {
    expect(parseMoney('1,250.50')).toBe(125050)
    expect(parseMoney('$40')).toBe(4000)
    expect(parseMoney(' 6.53 ')).toBe(653)
  })

  it('returns null for blank or unreadable input and never goes negative', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('-20')).toBe(0)
  })

  it('round-trips through the input format', () => {
    expect(centsToInput(2500)).toBe('25')
    expect(centsToInput(2550)).toBe('25.50')
    expect(centsToInput(null)).toBe('')
  })
})

describe('formatMoneyCompact', () => {
  it('shortens thousands and millions for chart axes', () => {
    expect(formatMoneyCompact(0)).toBe('$0')
    expect(formatMoneyCompact(95000)).toBe('$950')
    expect(formatMoneyCompact(500000)).toBe('$5K')
    expect(formatMoneyCompact(1250000)).toBe('$12.5K')
    expect(formatMoneyCompact(120000000)).toBe('$1.2M')
  })
})

describe('toCents', () => {
  it('converts dollars to whole cents', () => {
    expect(toCents(19.99)).toBe(1999)
    expect(toCents(6000)).toBe(600000)
  })

  it('rounds half a cent away from zero despite float error', () => {
    expect(toCents(1.005)).toBe(101)
    expect(toCents(-12.5)).toBe(-1250)
  })
})

describe('formatMoney', () => {
  it('shows whole dollars with thousands separators by default', () => {
    expect(formatMoney(123456)).toBe('$1,235')
    expect(formatMoney(0)).toBe('$0')
  })

  it('shows cents when asked', () => {
    expect(formatMoney(123456, { showCents: true })).toBe('$1,234.56')
    expect(formatMoney(-5, { showCents: true })).toBe('-$0.05')
  })

  it('puts the minus sign before the dollar sign', () => {
    expect(formatMoney(-250000)).toBe('-$2,500')
  })

  it('rounds positives and negatives symmetrically', () => {
    expect(formatMoney(150)).toBe('$2')
    expect(formatMoney(-150)).toBe('-$2')
  })

  it('never shows "-$0"', () => {
    expect(formatMoney(-40)).toBe('$0')
  })
})
