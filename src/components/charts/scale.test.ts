import { describe, expect, it } from 'vitest'
import { monthTickLabel, monthTicks, niceTicks } from './scale'

describe('niceTicks', () => {
  it('picks round steps that reach past the maximum', () => {
    expect(niceTicks(1990931)).toEqual([0, 500000, 1000000, 1500000, 2000000])
    expect(niceTicks(107427)).toEqual([0, 50000, 100000, 150000])
    expect(niceTicks(1000)).toEqual([0, 250, 500, 750, 1000])
  })

  it('still draws an axis when everything is zero', () => {
    expect(niceTicks(0)).toEqual([0, 1])
  })
})

describe('monthTicks', () => {
  it('labels years on long timelines and months on short ones', () => {
    expect(monthTicks(140, 600)).toEqual([0, 24, 48, 72, 96, 120])
    expect(monthTicks(18, 600)).toEqual([0, 3, 6, 9, 12, 15, 18])
    expect(monthTicks(67, 240)).toEqual([0, 36])
  })

  it('names ticks in plain words', () => {
    expect([0, 6, 24].map(monthTickLabel)).toEqual(['Now', '6 mo', '2 yr'])
  })
})
