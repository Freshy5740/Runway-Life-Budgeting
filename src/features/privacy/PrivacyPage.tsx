import { Card } from '../../components/Card'
import { hrefFor } from '../../app/routes'

export function PrivacyPage() {
  return (
    <div className="prose">
      <h1>Your data and privacy</h1>
      <Card title="Where your data lives">
        <p>
          Everything you enter in Runway stays on this device, in this browser's storage. Runway has
          no accounts, and no server ever receives your budget, loans or savings.
        </p>
        <p>There are no ads, trackers or analytics.</p>
      </Card>
      <Card title="Keeping a copy">
        <p>
          Because your data lives only here, clearing this browser's data or uninstalling Runway
          deletes it. Use <b>Backup → Export backup</b> now and then to save a file you can import
          on another device or browser.
        </p>
        <p>
          On iPhone and iPad, Safari may clear data for sites you haven't opened in a week. Adding
          Runway to your Home Screen (Share → Add to Home Screen) prevents that.
        </p>
      </Card>
      <Card title="Not financial advice">
        <p>
          Runway's numbers are planning estimates based on what you type in. Loan terms differ, and
          federal student loan rules change; check with your loan servicer or studentaid.gov before
          making decisions.
        </p>
      </Card>
      <Card title="The code">
        <p>
          Runway's code is public on{' '}
          <a
            href="https://github.com/Freshy5740/Runway-Life-Budgeting"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          , so anyone can check that it does what this page says.
        </p>
      </Card>
      <p>
        <a className="btn" href={hrefFor('tarmac')}>
          Back to Tarmac
        </a>
      </p>
    </div>
  )
}
