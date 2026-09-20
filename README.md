# MaishaWatch Frontend

[![Live Frontend](https://img.shields.io/badge/Live%20Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://maishawatch-frontend.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://maishawatch-backend.onrender.com/docs)
[![Frontend Repo](https://img.shields.io/badge/Frontend%20Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/E-Macharia/maishawatch-frontend)
[![Backend Repo](https://img.shields.io/badge/Backend%20Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/E-Macharia/maishawatch-backend)

> 🌐 **Live Web Application (Vercel):** [https://maishawatch-frontend.vercel.app/](https://maishawatch-frontend.vercel.app/)  
> ⚡ **Live Backend API (Render Swagger):** [https://maishawatch-backend.onrender.com/docs](https://maishawatch-backend.onrender.com/docs)  
> 💻 **Frontend Repository:** [https://github.com/E-Macharia/maishawatch-frontend](https://github.com/E-Macharia/maishawatch-frontend)  
> 🛠️ **Backend Repository:** [https://github.com/E-Macharia/maishawatch-backend](https://github.com/E-Macharia/maishawatch-backend)

---

## About MaishaWatch

**MaishaWatch** is an intelligent medical equipment utilization, predictive maintenance, and risk-monitoring platform designed for Kenyan healthcare facilities across all 47 counties.

Key capabilities include:
- **Predictive AI / RUL Estimation**: Continuous remaining useful life forecasting and degradation tracking.
- **Utilization & Discrepancy Auditing**: Automated reconciliation between counter telemetry and register usage logs.
- **Hotspot & Capacity Analysis**: Facility-tier equipment eligibility and county-wide operational visibility.
- **Dual Operating Modes**: Operates with a live FastAPI backend service or a high-fidelity standalone snapshot dataset.

This repository is designed to work **even when the backend team does not expose an HTTP API**. The frontend consumes a normalized snapshot generated directly from the backend team's real project datasets and exposes that snapshot through Next.js API routes for a clean application boundary.

## 1. Architecture

The project is structured across two complementary repositories:

- **Frontend Repository:** [https://github.com/E-Macharia/maishawatch-frontend](https://github.com/E-Macharia/maishawatch-frontend) (Next.js 16, React 19, Tailwind CSS, Vercel)
- **Backend Repository:** [https://github.com/E-Macharia/maishawatch-backend](https://github.com/E-Macharia/maishawatch-backend) (FastAPI, Scikit-learn ML models, Render)

```text
maishawatch-backend/
maishawatch-frontend/
```

## 2. What data is included

The packaged snapshot is generated from the supplied backend repository and currently contains:

- 12,394 facility master records
- 150 equipment assets
- 324,000 hourly telemetry records, aggregated to equipment-level daily history for the frontend
- 454 maintenance records
- 2,100 usage/reporting records
- 525 failure events
- 69 derived current alerts

The frontend visualises equipment risk, RUL, maintenance status, sensor condition, utilization, reporting discrepancy, failure exposure, downtime, repair-cost exposure, facility capacity, facility eligibility, and county-level risk.

## 3. Requirements

### Frontend development

- Node.js 20+
- npm 10+

### Data refresh

- Python 3
- pandas
- The backend repository or a Python environment containing its data-processing dependencies

## 4. Run the frontend by itself

From the frontend repository:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Run the two repositories together

The repositories do not need to communicate over HTTP for the capstone.

Example layout:

```text
projects/
├── maishawatch-backend/
└── maishawatch-frontend/
```

Start the frontend:

```bash
cd projects/maishawatch-frontend
npm install
npm run dev
```

## 6. Refresh frontend data from the backend repository

When the backend team changes the source datasets, regenerate the frontend snapshot.

From the frontend repository:

```bash
BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data
```

On Windows PowerShell:

```powershell
$env:BACKEND_REPO_PATH="..\\maishawatch-backend"
npm run sync-data
```

The script reads the backend data contract and source CSVs, normalizes IDs and fields, aggregates the 324,000 hourly telemetry rows to daily equipment history, and writes:

```text
lib/data/generated/dataset.json
```

### Python environment for sync

The sync script uses pandas. The simplest approach is to use the backend team's Python environment:

```bash
cd ../maishawatch-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../maishawatch-frontend
BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data
```

On Windows, activate `.venv\\Scripts\\activate` instead.

## 7. Next.js API layer

The frontend contains local API routes so the UI has a stable service boundary even without a separate backend server:

```text
GET /api/equipment
GET /api/equipment/:equipmentId
GET /api/facilities
GET /api/facilities/:facilityId
GET /api/alerts
GET /api/maintenance
GET /api/failures
GET /api/analytics/summary
```

These routes read from the normalized frontend snapshot.

Examples:

```text
/api/equipment?q=dialysis
/api/equipment?risk=critical
/api/facilities?county=Nairobi
/api/maintenance?equipmentId=ME-00002
/api/failures?equipmentId=ME-00002
```

If the backend team later exposes a real HTTP API, the page components do not need to be rewritten. Only the data adapter needs to be pointed at the live service and verified against the backend contract.

## 8. Theme system

MaishaWatch supports both dark and light themes.

- Dark remains the primary/established visual theme.
- Light mode has its own contrast-optimized palette rather than simply inverting colors.
- Theme choice is saved in browser local storage.
- The toggle is available in the top bar.

The theme is controlled centrally in `components/theme-provider.tsx` and the design tokens are in `app/globals.css`.

## 9. Important product data views

### Overview

Shows network KPIs, risk portfolio, usage/reporting trends, priority equipment, hotspots, sensor anomaly signals and equipment mix.

### Equipment

Shows searchable/filterable equipment with risk, RUL, utilization, maintenance state and discrepancy information.

The equipment detail page also includes:

- equipment health score
- explainable risk drivers
- condition telemetry trend
- latest sensor state
- anomaly counts
- failure-event exposure
- downtime and repair cost
- maintenance history
- usage reconciliation
- technician activity
- hospital notification actions

### Facilities

Shows facility risk plus capacity, operating profile and equipment eligibility information derived from the facility master.

### Alerts

Shows risk and usage/reporting discrepancy alerts.

### Reports

Provides management-level risk, equipment and facility summaries plus export workflows already implemented in the product.

### National

Provides county-level equipment risk, critical exposure, discrepancies, downtime and network watchlists.

## 10. Environment variables

`.env.example` documents the optional remote-API configuration. The default frontend build does not require a remote API.

For local snapshot mode, leave the frontend using the packaged dataset.

If a live backend API is eventually provided, configure the adapter with:

```env
DATA_SOURCE=remote
BACKEND_API_BASE_URL=http://localhost:8000
```

## 11. Quality checks

Before committing a frontend change:

```bash
npm run lint
npm run build
```

When data changes, refresh and review the generated snapshot:

```bash
BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data
```

Then run the application and manually verify the main routes:

```text
/overview
/facilities
/equipment
/alerts
/reports
/national
```

and at least one facility and equipment detail route.

## 13. Project structure

```text
app/                    Next.js routes and API routes
components/             reusable UI/dashboard components
lib/api/                backend/remote adapter
lib/data/               normalized snapshot and analytics
lib/data/generated/     backend-derived runtime dataset
lib/config/             navigation/configuration
scripts/                backend snapshot sync script
types/                  frontend domain types
docs/                   backend mapping and integration documentation
```

## 14. Troubleshooting

### `npm install` fails

Use Node 20+ and npm 10+. Delete `node_modules` and the lockfile only as a last resort; normally the committed `package-lock.json` should be used.

### Data appears unchanged after backend updates

Run the snapshot sync command again and restart Next.js.

### The sync script cannot find the backend

Set `BACKEND_REPO_PATH` to the actual backend repository directory.

### The backend repo has no API

That is supported. The frontend runs entirely from the backend-derived snapshot and local Next.js API routes.

### A future live API has a different response shape

Do not change dashboard components to match raw backend field names. Add the mapping in `lib/api/backend-client.ts` so the rest of the UI continues to use the stable MaishaWatch domain types.
