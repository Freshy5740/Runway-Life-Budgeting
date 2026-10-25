# Runway — Build Plan

_Last updated 2026-10-24. This plan will change as we go, so update it when a decision changes._

**Status:** M0 nearly done. The project is set up, verified locally and committed; pushing to GitHub and the Vercel deploy are next.

## 1. The product

Runway is a free money app that keeps your data on your own device and **graduates with you**. It starts as a term-based student budget and loan tracker. Then it carries you through senior year and your first job, and grows into a long-term financial health dashboard. The whole app is free; paid add-ons cover convenience (the Obsidian model).

### Phases

| Phase | Who | Focus |
|---|---|---|
| **Taxi** | in college | term budget, in-school interest, envelopes, credit builder, aid calendar |
| **Takeoff** | senior year through the grace period | paycheck, benefits, negotiation, repayment plan, Altitude |
| **Cruising Altitude** | employed and repaying | 50/30/20, Hangar, mortgage, retirement, Waypoints, Logbook |

### Transfers (moving between phases)

Each Transfer is a guided checklist that also changes how the app behaves.

| Transfer | From → To | What changes |
|---|---|---|
| Senior Year Transfer | Taxi → Takeoff | Takeoff tools unlock alongside the term budget. Suggested ~12 months before expected graduation, or started manually. |
| Graduation Transfer | in college → graduated | You enter your graduation date and each loan's grace countdown starts. The budget switches from terms to paychecks, the emergency-fund target rescales to 3–6 months of expenses, and the first-paycheck setup checklist opens. |
| Grad School Transfer _(bonus)_ | Taxi/Takeoff → Grad School | A hybrid of terms, stipend/paycheck and off-campus living, under grad loan rules |
| Cruising Transfer | Takeoff → Cruising Altitude | When repayment begins or you're settled in the job. Phase 3 tools come first. |

**Waypoints** are milestones _within_ a phase, such as "emergency fund full", "first loan paid off" or "bought a car". Some come preset and you can add your own.

### Names

| Thing | Name |
|---|---|
| Dashboard | Tarmac |
| Budget | Flight Plan |
| Loans & debt | Baggage Claim |
| Savings | Sky Miles |
| Net worth | Altitude |
| Weekly stress check-in | Turbulence |
| Spending heat map | Weather Radar |
| Year in review | Logbook |
| Milestones | Waypoints |
| House fund / planner | Hangar |
| Moving between phases | Transfers |
| Health score | Flight Status _(proposed)_ |

## 2. Decisions so far

- Repayment plans get rebuilt around current federal rules (section 6).
- The credit score builder moves into Phase 1 (Taxi).
- Envelopes stay as the visual way to save for **wants** (e.g., drop $10 into the Car envelope). The budget covers needs, and the emergency fund is a separate reserve.
- Adding: aid calendar, Transfers, first-paycheck setup, insurance basics, reminders.
- Not building: roommate splitting, city-by-city offer comparison, tracking individual stocks and bonds.
- Business model: Obsidian-style. The full app is free forever with data on your device, and paid add-ons cover convenience (section 9).

## 3. Tech stack, in plain English

The free app needs **no server**. Everything runs and is stored on the user's phone or laptop. That's what makes "free for everyone" sustainable: an extra user costs us nothing.

| Piece | What it does | Cost | Starts |
|---|---|---|---|
| **TypeScript** | The programming language: JavaScript plus a checker that flags mistakes (like text where a dollar amount should go) before users see them. | free | M0 |
| **React** | Builds screens from reusable pieces. A "loan card" is written once and used everywhere. | free | M0 |
| **Vite** | The build tool. It shows a live preview while we work, then packs the code into fast-loading files. | free | M0 |
| **PWA** (installable web app) | Lets the website install on laptops and phones with its own icon, and work offline. This covers "desktop app". | free | M0 |
| **IndexedDB** (via Dexie) | A real database inside the browser or phone. It replaces localStorage, which is too small for years of transactions. | free | M1 |
| **Vitest** | Automated tests that check the money math every time code changes. | free | M1 |
| **Git + GitHub** | Saves every version of the code and backs it up online. | free | M0 |
| **Vercel** | Hosts the website. Each push to GitHub updates the live site automatically. | free | M0 |
| **Capacitor** | Wraps the same app for the App Store and Google Play, and adds real phone notifications. | Apple $99/yr, Google $25 once | M5 |
| **Supabase** | Accounts and a cloud database, used only by the paid Sync add-on. | free tier, then ~$25/mo | M8 |
| **Stripe** | Takes payments on the website. | ~2.9% + 30¢ per charge | M8 |
| **Plaid** | Links bank accounts so transactions import automatically (paid add-on). | per linked account | M8+ |

**Why Vite instead of Next.js (the handoff's choice):** Next.js is built for sites where a server prepares each page. Runway's free tier runs entirely on the device, so a server framework adds complexity and gives nothing back. Vite is simpler and plugs straight into Capacitor for the phone apps. A marketing site can be its own small project later.

## 4. Architecture

### Building blocks

Every screen sits on top of six calculation pieces ("engines"). They're plain code with tests. The screens only display their results.

| Engine | Powers |
|---|---|
| Transaction list | Weather Radar, subscriptions & bills, textbook/one-time costs, 50/30/20, Logbook, Turbulence vs. spending |
| Period budget | term budget (Taxi) and paycheck budget (Takeoff/Cruising): the same "re-balance the remaining weeks" math over a different period |
| Paycheck calculator | benefits decoder, negotiation calculator, first-paycheck setup, paycheck budget |
| Loan calculator | student loans, cards, car loan, mortgage, in-school interest, repayment plan picker, grace countdowns |
| Envelopes & jars | emergency fund, want envelopes, Hangar/car/apartment planners |
| Snapshots & scores | Altitude, Flight Status, Turbulence, readiness scores, Waypoints, Logbook |

### Data (stored on the device)

Every record carries `id`, `createdAt`, `updatedAt` and `deletedAt` (deleted records are marked, not erased). That one rule is what lets paid Sync be added later without a rewrite.

- **Profile**: life stage (`undergrad | senior | grad-school | graduated | cruising`), school, expected and actual graduation date, completed Transfers
- **Period**: a term or a pay period (a broader version of the prototype's terms)
- **Transaction**: date, amount, in/out, category, bucket (`need | want | save`), note, source (`manual | csv | bank`), optional link to a recurring item
- **Category**: student defaults (rent, groceries, eating out, textbooks, transport, subscriptions…) plus custom ones
- **Recurring**: bills, subscriptions, paychecks and stipends, with amount, frequency and next date
- **Debt**: type (`fed-sub | fed-unsub | grad-plus | parent-plus | private | card | auto | mortgage | other`), balance, APR, compounding, minimum, first disbursement date (decides which repayment plans apply), grace end date, chosen plan
- **Envelope**: kind (`emergency | want | planner`), target, balance, weekly auto-save, optional planner template (apartment, car, house)
- **Deposit**: money dropped into an envelope (history for the Logbook)
- **Asset account**: checking, savings, 401(k), IRA, brokerage or cash, with balance history
- **Snapshot** (monthly): Altitude, assets, debts, savings rate, scores
- **Check-in**: weekly Turbulence rating 1–5, optional note
- **Waypoint**: title, target date, an automatic check (e.g., emergency envelope ≥ $1,000) or a manual one, checklist
- **Reminder**: date, kind, linked record
- **Aid event**: FAFSA, disbursement, scholarship deadline, refund

Prototype backups (`runway.v2` JSON) import directly. The prototype only stored one spending total per week, so those totals come in as "uncategorized" transactions.

## 5. Milestones

Each milestone ends with something live that people can use.

### M0 — Pre-flight (setup)

- [x] Install Node.js (LTS) and Git.
- [x] Create a GitHub account _(you)_: `Freshy5740`, committing with the private noreply email.
- [ ] Create a Vercel account _(you)_.
- [x] Create the code folder **outside OneDrive**: `C:\Users\Freshy\dev\runway`. A JavaScript project installs tens of thousands of small files and OneDrive syncs them badly. GitHub becomes the backup instead.
- [x] Set up the project: Vite + React + TypeScript, installable-app (PWA) plugin, Dexie, Vitest, oxlint and Prettier.
- [x] `CLAUDE.md` with project rules, names and design colors; the prototype copied into `reference/` as a guide.
- [x] Placeholder "Pre-flight check" page that confirms it loads, saves on the device, works offline and can be installed.
- [x] First Git commit.
- [ ] Create the GitHub repository and push.
- [ ] Automatic publishing to Vercel.

**Done when:** a placeholder Runway page is live at a public URL and installs to your phone's home screen.

### M1 — Taxi parity (port the prototype) → **v0.1 public**

- Design system: the prototype's colors as named variables, plus dark mode. Designed for phones first.
- Engines rewritten in TypeScript with tests, using the prototype's own results as the expected answers: period budget, in-school interest and capitalization, avalanche/snowball/minimum payoff.
- Tabs: Tarmac, Flight Plan, Baggage Claim, Sky Miles.
- Export/import, including old prototype backups.
- "Not financial advice" notice, plus a one-page privacy statement ("your data never leaves your device").

**Done when:** everything the prototype does works in the new app, saved on the device, at a public URL. **This is the working version anyone can use.**

### M2 — Transactions & envelopes

- Quick-add a transaction (amount, category, need/want/save) in a few taps. Edit, search, and import bank CSV exports.
- Weekly safe-to-spend calculated from real transactions.
- Subscriptions & bills tracker: recurring charges come out of safe-to-spend automatically, with a "coming up" list.
- Envelopes: savings for wants that visibly fill up, with tip drops and auto-save. The emergency fund stays its own reserve.
- Monthly snapshots start recording, building history for Altitude and the Logbook.

**Done when:** logging a day's spending takes seconds and Tarmac shows spending by category.

### M3 — Finish Taxi (Phase 1)

- Textbook & one-time cost finder: plan each term's big costs; compare renting, buying used and buying new.
- Weather Radar: a calendar heat map of spending, filterable by category.
- Turbulence: a weekly 1–5 check-in, charted against spending.
- Flight Status (Taxi version) built from staying on budget, interest covered, emergency fund and card balances. It shows the breakdown and one action per part.
- Credit builder: the five credit-score factors in plain language, card usage pulled from Baggage Claim, an on-time payment streak, and a score you enter yourself (no credit pull).
- Aid calendar: FAFSA renewal, disbursement dates (linked to Arrivals), scholarship deadlines, refunds.
- A reminders list in the app (phone notifications arrive in M5).

**Done when:** every Phase 1 feature is live.

### M4 — Takeoff (Phase 2) + Transfers

- Profile & life stage; the Transfer system (checklist + app changes).
- Senior Year Transfer and Graduation Transfer.
- Grace countdown for each loan.
- Paycheck calculator: salary → take-home after federal and state tax, Social Security/Medicare, pre-tax 401(k)/HSA and insurance premiums. Tax tables are stored as data and updated each year.
- Benefits decoder: 401(k) match, HSA/FSA and health plans compared in dollars, with health insurance basics.
- Salary negotiation calculator: an offer → take-home pay, how much loan payment it supports, and what a raise is worth over 5 years.
- First-paycheck setup: W-4 walkthrough, splitting direct deposit into envelopes, 401(k) enrollment.
- Repayment plan picker using current rules (section 6).
- Paycheck budget: a per-pay-period budget whose weekly spending adjusts as you go.
- Altitude (net worth) with history.
- Flight Status (Takeoff version).

**Done when:** a senior can enter a job offer and see take-home pay, what the benefits are worth, a first budget, and which repayment plan costs least.

### M5 — Phone & desktop apps

- Installable-app polish: offline use, install prompts, icons, splash screens.
- iOS and Android builds with Capacitor, plus scheduled notifications on the phone for bills, grace countdowns, Turbulence check-ins and aid deadlines. No server needed.
- Apple Developer ($99/yr) and Google Play ($25) accounts _(you)_. Beta through TestFlight first.
- Check the name and trademarks before listing in the stores (see section 10).

**Done when:** Runway installs through TestFlight and the Play Store and sends reminders.

### M6 — Cruising Altitude (Phase 3)

- Cruising Transfer.
- 50/30/20 bars that fill live from transactions.
- First apartment estimator: deposit, first + last month, movers, setup, renters insurance. Each line item gets a readiness score, plus an overall one.
- Hangar (house): down payment %, closing costs, PMI and affordability (the 28/36 rule). A car planner with auto insurance. When you buy, the envelope turns into a loan in Baggage Claim.
- Mortgage in Baggage Claim: payment schedule, extra principal, when PMI drops off.
- Retirement: 401(k) match, Roth vs. traditional, and a growth chart next to the debt payoff chart. IRA and brokerage balances count toward Altitude. This teaches; it doesn't give advice.
- Waypoints: preset and custom milestones with automatic checks and checklists.
- Logbook: the year in review, viewable anytime, with a special December release and a shareable summary card.
- Flight Status (Cruising version).

### M7 — Grad School branch (bonus)

- Grad School Transfer: terms + stipend/paycheck + off-campus living, mostly built from existing parts.
- Grad loan rules: yearly and lifetime caps, no Grad PLUS for new borrowers, private loan comparison.
- Can be done any time after M4.

### M8 — Paid add-ons (Obsidian model)

- Accounts (Supabase), needed only for paid features.
- Runway Sync: encrypted sync and backup across devices.
- Stripe checkout and subscription management, with a student discount.
- Founding Crew: a one-time supporter tier with early access (like Obsidian's Catalyst).
- Bank Link (Plaid) add-on.
- Terms of service, updated privacy policy, security review.

## 6. Federal repayment plans (for M4)

Checked against secondary sources on 2026-10-23. **Re-check studentaid.gov and the final regulations before building M4.** Some details were still being finalized, and the Tiered Standard terms and RAP income brackets below come from the 2025 law and still need confirming. Plan rules go in a data table, not baked into code, so they can be updated without a rewrite.

Which plans a borrower can use depends on **when their loans were made**:

| Borrower | Plans available |
|---|---|
| Every federal loan made before July 1, 2026, and no new loan or consolidation since | Standard (10 yr), Graduated, Extended, IBR, RAP. ICR and PAYE close July 1, 2028. SAVE has ended. |
| Any new federal loan or consolidation on/after July 1, 2026 | **Tiered Standard** or **RAP** only |
| Parent PLUS (new) | no income-driven plans |

| Plan | How payments work |
|---|---|
| Tiered Standard | Fixed payments. Length depends on balance: under $25k = 10 yrs, $25–50k = 15, $50–100k = 20, over $100k = 25. |
| RAP (Repayment Assistance Plan) | 1–10% of AGI depending on income bracket. $10/mo minimum, $50/mo less per dependent. Unpaid interest is waived after on-time payments, and principal gets a match of up to $50/mo. Whatever is left is forgiven after 360 qualifying payments (30 yrs). |
| IBR (older borrowers) | 10% of discretionary income (15% for borrowers before 2014); forgiveness after 20–25 yrs |
| Standard / Graduated / Extended (older borrowers) | unchanged |
| Private loans | the lender's terms; a plain fixed payment schedule |

Also:
- Grad PLUS ended for new borrowers on July 1, 2026. New caps: $20,500/yr for grad students, $50,000/yr for professional programs.
- Grace periods: 6 months for Direct Subsidized/Unsubsidized loans; private loans vary; credit cards have none.
- Which plans count toward PSLF still needs confirming.

Sources: [NYC DCWP — Key Changes, July 2026](https://www.nyc.gov/site/dca/talk-money/Student-Loans-Key-Changes.page) · [NerdWallet — What is RAP](https://www.nerdwallet.com/student-loans/learn/what-is-the-new-repayment-assistance-plan-rap-for-student-loans) · [The College Investor — How RAP works](https://thecollegeinvestor.com/79015/how-the-repayment-assistance-plan-rap-works/) · [CSS NY — Updates in effect July 1, 2026](https://bplc.cssny.org/blog/student-loan-updates-now-in-effect-as-of-july-1-2026) · [ELFI — SAVE plan ending](https://www.elfi.com/the-save-plan-is-coming-to-an-end-heres-what-you-need-to-know/)

## 7. Not building (for now)

- Roommate expense splitting (Venmo and Splitwise already do this)
- City-by-city offer comparison
- Tracking individual stocks and bonds
- Envelope budgeting for needs (envelopes are for wants)

## 8. Quality bar

- Every engine has tests, and money-math changes need passing tests.
- Designed for phones first; works at 375px wide.
- Light and dark mode.
- Accessible: works by keyboard, labeled for screen readers, readable contrast.
- Numbers are planning estimates, with "not financial advice" shown.
- No tracking or analytics by default.

## 9. Business model (Obsidian-style)

| Tier | What you get | Price |
|---|---|---|
| **Runway** | every tool in every phase, data on your device, export anytime | free forever |
| **Runway Sync** | account, encrypted sync and backup across phone and laptop | TBD monthly/yearly, student discount |
| **Bank Link** | automatic transaction import | TBD add-on |
| **Founding Crew** | one-time supporter tier with early access and a badge | TBD one-time |

Free users cost nothing to serve because their data never touches our servers. Paid tiers pay for the servers they use.

## 10. Risks & open questions

- **Name:** "Runway" is already used by other companies, including a business financial-planning product. Check trademarks before buying a domain or listing in the app stores; we may need a variant.
- **Tax tables** change every year, so update them each January.
- **Federal loan rules** are still changing (section 6).
- **Sync conflicts** (two devices editing the same record): the latest edit wins, decided by `updatedAt`.
- **Security once accounts exist:** each user can only reach their own data, everything is encrypted, and there's a security review before M8 ships.

## 11. How we'll work

- One milestone at a time, broken into small features, each saved to Git.
- You test each feature on your phone and laptop; I fix and adjust.
- This file and `CLAUDE.md` carry context between sessions.
