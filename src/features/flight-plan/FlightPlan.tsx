import { Card } from '../../components/Card'
import { useData, usePlan } from '../../app/plan'
import { ItemSection } from './ItemSection'
import { RunwayOutlook } from './RunwayOutlook'
import { TermBar } from './TermBar'
import './flight-plan.css'

export function FlightPlan() {
  const data = useData()
  const plan = usePlan()
  const term = plan.activeTerm

  if (!term) {
    return <TermBar term={null} terms={data.terms} />
  }

  const items = data.budgetItems.filter((item) => item.termId === term.id)
  const section = (kind: (typeof items)[number]['kind']) => ({
    term,
    items: items.filter((item) => item.kind === kind),
  })

  return (
    <>
      <TermBar term={term} terms={data.terms} />
      <div className="grid-2">
        <Card title="Arrivals" hint="money coming in">
          <ItemSection kind="lump" {...section('lump')} />
          <ItemSection kind="income" {...section('income')} />
        </Card>
        <Card title="Departures" hint="money going out">
          <ItemSection kind="bigCost" {...section('bigCost')} />
          <ItemSection kind="recurCost" {...section('recurCost')} />
        </Card>
      </div>
      <RunwayOutlook />
    </>
  )
}
