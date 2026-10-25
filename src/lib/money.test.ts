import { describe, expect, it } from 'vitest'
import { formatMoney, toCents } from './money'

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
