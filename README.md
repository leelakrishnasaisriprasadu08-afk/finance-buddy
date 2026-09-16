# Finance Buddy

Finance Buddy is a dependency-free personal and business financial support prototype. It gives a user a quick view of monthly income, spending, available cash, savings rate, recent activity, and a next-best-move recommendation.

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173> in a browser.

## Current behavior

- The public launch page explains how Finance Buddy helps, with a guided sign-in and demo-account entry flow.
- The launch page and workspace include a live **Scenario Lab** where users can test revenue, operating costs, and growth investment before making a decision.
- The workspace includes a **Simulation Studio** with separate guided tools for cash-flow checks, hiring decisions, debt payoff, and growth experiments.
- The signed-in workspace is organized into separate top-level pages: Overview, Activity, Goals, Assistant, Accounts, and Simulations.
- The **Opportunities** page surfaces freelance work ideas and a demo stock watchlist with continuous simulated updates. Market prices are illustrative only until a real provider is connected.
- Workspace navigation uses one bottom dashboard bar, avoiding duplicate sidebar and top-tab navigation.
- The profile avatar opens an account preview with settings, connected services, appearance themes, terms/privacy access, and sign out.
- The visual system uses editorial typography, a restrained particle texture, cursor-responsive lighting, and reduced-motion support to keep the product warm without distracting from financial decisions.
- The **Add update** flow recalculates the dashboard and agent guidance immediately.
- Optional update notes appear in **Recent activity**.
- Overview, Activity, and Goals navigation buttons scroll to the relevant surface.
- The **AI helper** workspace answers common cash-flow, hiring, and growth-planning questions, and includes a staged expansion map.
- The **Today's expenditure** and **Connected sources** blocks support manual expense capture and simulated Finvu sync feedback. They are ready for a server-side consent integration, but do not connect to real accounts yet.
- Data is held in browser memory for this prototype; no financial data is sent anywhere.

The next production step would be adding an authenticated backend for durable user updates and connecting the recommendation layer to a financial-data policy and an AI provider.

## Recommended service foundation

The initial Java/Spring Boot backend scaffold is in [`backend/`](backend/). It provides the security boundary for future Finvu, Grok, and persistent database integrations. Start with the instructions in [`backend/README.md`](backend/README.md); real provider secrets must stay in a deployment secret manager and must never be added to browser code or committed files.