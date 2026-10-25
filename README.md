# Runway

Student money, cleared for takeoff. Runway is a free money app that keeps your data on your device and grows with you: term budgets and loan tracking in college, then your first paycheck and job offer, then long-term goals like a house and retirement.

- Roadmap and decisions: [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md)
- Working notes for contributors (and Claude): [CLAUDE.md](CLAUDE.md)
- Original prototype: [reference/runway-budget-v2.html](reference/runway-budget-v2.html)

## Run it locally

Requires Node.js 24 LTS.

```bash
npm install
npm run dev
```

| Command           | What it does                                                |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Live preview at http://localhost:5173 while you edit        |
| `npm run build`   | Type-check and build the production app into `dist/`        |
| `npm run preview` | Serve the production build (offline mode works here)        |
| `npm test`        | Run tests and re-run them on save (`npm run test:run` once) |
| `npm run lint`    | Check code with oxlint                                      |
| `npm run format`  | Format code with Prettier                                   |
| `npm run icons`   | Regenerate app icons from `public/favicon.svg`              |

Numbers in Runway are planning estimates, not financial advice.
