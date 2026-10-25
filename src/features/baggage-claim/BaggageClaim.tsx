import { Card } from '../../components/Card'
import { Segmented } from '../../components/Segmented'
import { useData } from '../../app/plan'
import { setPref } from '../../db/prefs'
import { DebtCard } from './DebtCard'
import { DebtForm } from './DebtForm'
import { InSchoolPanel } from './InSchoolPanel'
import { RepayPanel } from './RepayPanel'
import './baggage-claim.css'

export function BaggageClaim() {
  const { debts, prefs } = useData()

  return (
    <>
      <Card title="What you owe" hint="loans & credit cards">
        <DebtForm />
        {debts.length ? (
          <div className="debt-grid">
            {debts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} />
            ))}
          </div>
        ) : (
          <p className="empty">
            Add a loan or card to see interest build and how fast you can clear it.
          </p>
        )}
      </Card>
      {debts.length > 0 && (
        <Card
          title="Mode"
          hint="are you in school, or paying it off?"
          actions={
            <Segmented
              label="Loan mode"
              value={prefs.loanMode}
              options={[
                { value: 'school', label: 'In school' },
                { value: 'repay', label: 'Repaying' },
              ]}
              onChange={(value) => void setPref('loanMode', value)}
            />
          }
        >
          {prefs.loanMode === 'school' ? <InSchoolPanel /> : <RepayPanel />}
        </Card>
      )}
    </>
  )
}
