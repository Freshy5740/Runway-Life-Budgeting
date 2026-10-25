import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysBetween,
  formatDate,
  formatDuration,
  formatMonthYearShort,
  seasonName,
  todayIso,
} from './dates'

describe('date math', () => {
  it('adds days across a daylight-saving change without drifting', () => {
    expect(addDays('2026-10-26', 7)).toBe('2026-11-02')
    expect(addDays('2027-03-08', 7)).toBe('2027-03-15')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-08-24', '2026-12-14')).toBe(112)
    expect(daysBetween('2027-01-11', '2027-05-03')).toBe(112)
  })

  it('adds months the way JavaScript dates do', () => {
    expect(addMonths('2026-10-24', 67)).toBe('2032-05-24')
    expect(addMonths('2027-01-31', 1)).toBe('2027-03-03')
  })

  it("reads today's date from the local clock", () => {
    expect(todayIso(new Date(2026, 9, 5, 23, 30))).toBe('2026-10-05')
  })
})

describe('date formatting', () => {
  it('formats dates the way the prototype did', () => {
    expect(formatDate('2026-08-24')).toBe('Aug 24, 2026')
    expect(formatMonthYearShort('2026-08-24')).toBe('Aug 26')
  })

  it('shows a dash instead of crashing on a missing or broken date', () => {
    expect(formatDate('')).toBe('—')
    expect(formatDate('not a date')).toBe('—')
  })

  it('writes durations in years and months', () => {
    expect(formatDuration(5)).toBe('5 mo')
    expect(formatDuration(12)).toBe('1 yr')
    expect(formatDuration(67)).toBe('5 yr 7 mo')
    expect(formatDuration(0)).toBe('0 mo')
  })

  it('names terms by season', () => {
    expect(seasonName('2026-08-24')).toBe('Fall 2026')
    expect(seasonName('2027-01-11')).toBe('Spring 2027')
    expect(seasonName('2027-06-01')).toBe('Summer 2027')
  })
})
