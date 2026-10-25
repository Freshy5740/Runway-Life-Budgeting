// Runs the prototype's own math (copied verbatim from reference/runway-budget-v2.html) on a fixed
// sample plan and prints the results. The engine tests in src/engines use these numbers as their
// expected answers, so the new app is checked against the prototype rather than against itself.
//
// Run: node scripts/prototype-oracle.mjs

/* ---------- sample plan (prototype units: dollars) ---------- */
const state = {
  terms: [
    {
      id: 't1',
      name: 'Fall 2026',
      start: '2026-08-24',
      end: '2026-12-14',
      cushion: 200,
      lumps: [
        { id: 'l1', label: 'Fall loan disbursement', amount: 6000, date: '2026-08-20' },
        { id: 'l2', label: 'Scholarship', amount: 1500, date: '2026-09-15' },
        { id: 'l3', label: 'Late refund', amount: 300, date: '2027-01-10' },
      ],
      incomes: [
        { id: 'i1', label: 'Campus job', amount: 220, freq: 'biweekly' },
        { id: 'i2', label: 'Parents', amount: 150, freq: 'monthly' },
      ],
      bigCosts: [
        { id: 'b1', label: 'Tuition', amount: 4200 },
        { id: 'b2', label: 'Books', amount: 450 },
      ],
      recurCosts: [
        { id: 'r1', label: 'Groceries', amount: 60, freq: 'weekly' },
        { id: 'r2', label: 'Phone', amount: 45, freq: 'monthly' },
      ],
    },
    {
      id: 't2',
      name: 'Spring 2027',
      start: '2027-01-11',
      end: '2027-05-03',
      cushion: 0,
      lumps: [{ id: 'l4', label: 'Spring disbursement', amount: 5000, date: '2027-01-05' }],
      incomes: [{ id: 'i3', label: 'Campus job', amount: 220, freq: 'biweekly' }],
      bigCosts: [{ id: 'b3', label: 'Tuition', amount: 4200 }],
      recurCosts: [{ id: 'r3', label: 'Groceries', amount: 65, freq: 'weekly' }],
    },
  ],
  log: { '2026-08-24': '120', '2026-08-31': '95.5', '2026-09-07': '140', '2027-01-11': '80' },
  debts: [
    {
      id: 'd1',
      name: 'Subsidized',
      type: 'fed-sub',
      balance: 3500,
      apr: 6.39,
      comp: 'daily',
      min: 40,
    },
    {
      id: 'd2',
      name: 'Unsubsidized',
      type: 'fed-unsub',
      balance: 5500,
      apr: 6.39,
      comp: 'daily',
      min: 60,
    },
    {
      id: 'd3',
      name: 'Private',
      type: 'private',
      balance: 8000,
      apr: 9.5,
      comp: 'monthly',
      min: 95,
    },
    { id: 'd4', name: 'Card', type: 'card', balance: 900, apr: 24.99, comp: 'daily', min: 35 },
  ],
  inSchool: { weeks: 80, contrib: 25 },
  repay: { extra: 100, strat: 'avalanche' },
  savings: {
    emergency: { target: 1000, balance: 250, recur: 10 },
    goals: [
      { id: 'g1', name: 'Car', target: 3000, balance: 400, recur: 15 },
      { id: 'g2', name: 'Concert', target: 200, balance: 50, recur: 0 },
    ],
  },
}

/* ---------- prototype functions, verbatim ---------- */
const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const num = (v) => {
  const x = parseFloat(v)
  return isFinite(x) ? x : 0
}
const weeksBetween = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / (7 * 864e5)))
const perWeek = (f) => (f === 'weekly' ? 1 : f === 'biweekly' ? 0.5 : f === 'monthly' ? 12 / 52 : 0)
const fmtShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtMY = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
const TYPES = {
  'fed-sub': { accrues: false },
  'fed-unsub': { accrues: true },
  private: { accrues: true },
  card: { accrues: true },
  other: { accrues: true },
}

function recurSavingsWeekly() {
  return (
    num(state.savings.emergency.recur) + state.savings.goals.reduce((s, g) => s + num(g.recur), 0)
  )
}
function termCompute(t) {
  const weeks = weeksBetween(t.start, t.end)
  const lumpTotal = t.lumps.reduce((s, l) => s + (l.date <= t.end ? l.amount : 0), 0)
  const incWk = t.incomes.reduce((s, i) => s + i.amount * perWeek(i.freq), 0)
  const arrivals = lumpTotal + incWk * weeks
  const bigTotal = t.bigCosts.reduce((s, c) => s + c.amount, 0)
  const recurWk = t.recurCosts.reduce((s, c) => s + c.amount * perWeek(c.freq), 0)
  const recurTotal = recurWk * weeks
  const saveTotal = recurSavingsWeekly() * weeks
  const pool = arrivals - bigTotal - recurTotal - saveTotal - (t.cushion || 0)
  return {
    weeks,
    lumpTotal,
    arrivals,
    bigTotal,
    recurTotal,
    saveTotal,
    pool,
    baseWeekly: pool / weeks,
    recurWk,
  }
}
function buildWeeks() {
  const out = []
  state.terms
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start))
    .forEach((t) => {
      const c = termCompute(t),
        start = new Date(t.start + 'T00:00:00')
      for (let w = 0; w < c.weeks; w++) {
        const ws = addDays(start, w * 7)
        out.push({
          iso: iso(ws),
          date: ws,
          termId: t.id,
          termName: t.name,
          budget: c.baseWeekly,
          actual: state.log[iso(ws)],
        })
      }
    })
  return out
}
function groupWeeks(wks, level) {
  if (level === 'week')
    return wks.map((w) => ({
      key: w.iso,
      label: 'Wk',
      date: w.date,
      budget: w.budget,
      actual: num(w.actual),
      logged: w.actual !== undefined && w.actual !== '',
      iso: w.iso,
      sub: fmtShort(w.date),
    }))
  const map = new Map()
  wks.forEach((w) => {
    let key,
      label,
      sub = ''
    if (level === 'month') {
      key = w.iso.slice(0, 7)
      label = fmtMY(w.date)
    } else if (level === 'term') {
      key = w.termId
      label = w.termName
    } else {
      key = String(w.date.getFullYear())
      label = String(w.date.getFullYear())
      sub = 'YTD'
    }
    if (!map.has(key))
      map.set(key, { key, label, sub, date: w.date, budget: 0, actual: 0, logged: false })
    const g = map.get(key)
    g.budget += w.budget
    if (w.actual !== undefined && w.actual !== '') {
      g.actual += num(w.actual)
      g.logged = true
    }
  })
  return [...map.values()]
}
function monthlyRate(d) {
  const apr = d.apr / 100
  if (apr <= 0) return 0
  return d.comp === 'daily' ? Math.pow(1 + apr / 365, 365 / 12) - 1 : apr / 12
}
function simRepay(strat, startBalances) {
  const CAP = 720
  let debts = state.debts.map((d, i) => ({
    ...d,
    bal: startBalances ? startBalances[i] : d.balance,
    rate: monthlyRate(d),
  }))
  const totalMin = debts.reduce((s, d) => s + d.min, 0)
  const budget = strat === 'minimum' ? totalMin : totalMin + num(state.repay.extra)
  let months = 0,
    intPaid = 0,
    stuck = false
  const series = [{ m: 0, balance: debts.reduce((s, d) => s + d.bal, 0), cumInt: 0 }]
  const order = (l) => {
    const a = [...l]
    if (strat === 'avalanche') a.sort((x, y) => y.rate - x.rate || x.bal - y.bal)
    else if (strat === 'snowball') a.sort((x, y) => x.bal - y.bal || y.rate - x.rate)
    return a
  }
  while (debts.some((d) => d.bal > 0.005) && months < CAP) {
    months++
    debts.forEach((d) => {
      if (d.bal > 0) {
        const it = d.bal * d.rate
        d.bal += it
        intPaid += it
      }
    })
    let avail = budget
    debts.forEach((d) => {
      if (d.bal > 0 && avail > 0) {
        const p = Math.min(d.min, d.bal, avail)
        d.bal -= p
        avail -= p
      }
    })
    if (strat !== 'minimum')
      for (const d of order(debts)) {
        if (avail <= 0) break
        if (d.bal > 0) {
          const p = Math.min(avail, d.bal)
          d.bal -= p
          avail -= p
        }
      }
    const tot = Math.max(
      0,
      debts.reduce((s, d) => s + d.bal, 0),
    )
    series.push({ m: months, balance: tot, cumInt: intPaid })
    if (months > 2 && tot > 0.01 && tot >= series[series.length - 2].balance - 0.01) {
      stuck = true
      break
    }
  }
  const startTot = startBalances
    ? startBalances.reduce((a, b) => a + b, 0)
    : state.debts.reduce((s, d) => s + d.balance, 0)
  return {
    months,
    interestPaid: intPaid,
    totalPaid: startTot + intPaid,
    series,
    stuck: stuck || months >= CAP,
    budget,
  }
}
function simSchool(weeklyContrib) {
  const months = Math.max(1, Math.round(state.inSchool.weeks / 4.345))
  const monthly = (weeklyContrib * 52) / 12
  const accr = state.debts.map((d) => ({
    ...d,
    P: d.balance,
    unpaid: 0,
    rate: monthlyRate(d),
    acc: TYPES[d.type].accrues,
  }))
  let totalAccrued = 0,
    withSeries = [{ m: 0, total: accr.reduce((s, d) => s + d.P, 0) }]
  const order = (l) => [...l].filter((d) => d.acc && d.P > 0).sort((a, b) => b.rate - a.rate)
  for (let m = 1; m <= months; m++) {
    accr.forEach((d) => {
      if (d.acc) {
        const it = d.P * d.rate
        d.unpaid += it
        totalAccrued += it
      }
    })
    let avail = monthly
    for (const d of order(accr)) {
      if (avail <= 0) break
      const p = Math.min(avail, d.unpaid)
      d.unpaid -= p
      avail -= p
    }
    for (const d of order(accr)) {
      if (avail <= 0) break
      const p = Math.min(avail, d.P)
      d.P -= p
      avail -= p
    }
    withSeries.push({ m, total: accr.reduce((s, d) => s + d.P + d.unpaid, 0) })
  }
  const capWith = accr.reduce((s, d) => s + d.unpaid, 0)
  const balWith = accr.map((d) => d.P + d.unpaid)
  let totalAccruedBase = 0
  const baseSeries = [{ m: 0, total: state.debts.reduce((s, d) => s + d.balance, 0) }]
  const baseBal = state.debts.map((d) => {
    const r = monthlyRate(d),
      acc = TYPES[d.type].accrues
    const cap = acc ? d.balance * r * months : 0
    totalAccruedBase += cap
    return d.balance + cap
  })
  for (let m = 1; m <= months; m++)
    baseSeries.push({
      m,
      total: state.debts.reduce((s, d) => {
        const r = monthlyRate(d),
          acc = TYPES[d.type].accrues
        return s + d.balance + (acc ? d.balance * r * m : 0)
      }, 0),
    })
  const covered = Math.max(0, totalAccrued - capWith)
  const capAvoided = Math.max(0, totalAccruedBase - capWith)
  const lifeBase = simRepay('avalanche', baseBal),
    lifeWith = simRepay('avalanche', balWith)
  const lifeSaved = Math.max(0, lifeBase.totalPaid - lifeWith.totalPaid)
  return {
    months,
    totalAccrued,
    covered,
    capAvoided,
    lifeSaved,
    baseSeries,
    withSeries,
    monthsToFreeBase: lifeBase.months,
    monthsToFreeWith: lifeWith.months,
  }
}

/* ---------- results ---------- */
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]))
const repaySummary = (r) => ({
  ...pick(r, ['months', 'interestPaid', 'totalPaid', 'stuck', 'budget']),
  seriesLength: r.series.length,
  seriesAt12: r.series[12],
  last: r.series[r.series.length - 1],
})

const weeks = buildWeeks()
const results = {
  monthlyRate: state.debts.map(monthlyRate),
  terms: state.terms.map(termCompute),
  weeks: {
    count: weeks.length,
    first: pick(weeks[0], ['iso', 'termId', 'budget', 'actual']),
    last: pick(weeks[weeks.length - 1], ['iso', 'termId', 'budget', 'actual']),
    isoList: weeks.map((w) => w.iso),
  },
  groups: Object.fromEntries(
    ['month', 'term', 'ytd'].map((lvl) => [
      lvl,
      groupWeeks(weeks, lvl).map((g) => pick(g, ['key', 'label', 'budget', 'actual', 'logged'])),
    ]),
  ),
  repay: Object.fromEntries(
    ['avalanche', 'snowball', 'minimum'].map((s) => [s, repaySummary(simRepay(s))]),
  ),
  school: (() => {
    const s = simSchool(state.inSchool.contrib)
    return {
      ...pick(s, [
        'months',
        'totalAccrued',
        'covered',
        'capAvoided',
        'lifeSaved',
        'monthsToFreeBase',
        'monthsToFreeWith',
      ]),
      baseEnd: s.baseSeries[s.baseSeries.length - 1],
      withEnd: s.withSeries[s.withSeries.length - 1],
    }
  })(),
  schoolNoContrib: pick(simSchool(0), ['totalAccrued', 'covered', 'capAvoided', 'lifeSaved']),
}

// A plan whose payment never outpaces interest.
state.debts = [
  { id: 'x', name: 'Too big', type: 'private', balance: 10000, apr: 12, comp: 'monthly', min: 50 },
]
state.repay.extra = 0
results.stuck = repaySummary(simRepay('avalanche'))

console.log(JSON.stringify(results, null, 2))
