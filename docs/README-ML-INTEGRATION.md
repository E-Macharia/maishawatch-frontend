# MaishaWatch — ML Integration (Snapshot Style)

## Does this break the existing pipeline?

**No.** It integrates **on top** of the existing pipeline.

| Mode | What happens |
|------|----------------|
| **Models missing** (current state) | Sync behaves exactly like before. `riskScore`, `rulHours`, alerts all come from telemetry CSVs. New ML fields are written as `null` / `"telemetry"`. Frontend keeps working. |
| **Models present** | Same pipeline runs, plus real scikit-learn predictions are baked into `dataset.json`. `riskScore` / `rulHours` are preferentially taken from the models. Extra fields (`failureProbability24h`, etc.) appear. |

Nothing is removed. No API contract changes for the UI. No forced backend HTTP calls.

---

## Files in this package

```text
maishawatch-ml-integration/
├── backend/
│   └── requirements.txt                  ← REPLACE backend requirements.txt
├── frontend/
│   ├── scripts/
│   │   └── sync_backend_data.py          ← REPLACE frontend scripts/sync_backend_data.py
│   ├── types/
│   │   └── equipment-ml-fields.ts.txt    ← COPY fields into types/maishawatch.ts
│   └── lib/api/
│       └── backend-client-ml-append.ts.txt ← OPTIONAL: append to backend-client.ts
└── docs/
    └── README-ML-INTEGRATION.md          ← this file
```

---

## Step-by-step: where to put each file

### 1. Backend — requirements

**Replace:**
```text
maishawatch-backend/requirements.txt
```
with the file from `backend/requirements.txt`.

Then install:
```bash
cd maishawatch-backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Backend — place the model files (required for real ML)

Create the folder and drop the five `.pkl` files:

```text
maishawatch-backend/models/
  failure_model_24h.pkl
  failure_model_72h.pkl
  failure_model_168h.pkl
  rul_model.pkl
  rul_features.pkl
```

(If you do not have the models yet, skip this step — the pipeline still works.)

### 3. Frontend — replace the sync script

**Replace:**
```text
maishawatch-frontend/scripts/sync_backend_data.py
```
with the file from `frontend/scripts/sync_backend_data.py`.

### 4. Frontend — extend TypeScript types

Open:
```text
maishawatch-frontend/types/maishawatch.ts
```

Find the `Equipment` interface (search for `riskScore` or `rulHours`).

**Append** the fields from `frontend/types/equipment-ml-fields.ts.txt` inside that interface. Do not delete existing fields.

### 5. Frontend — optional live client helpers

Only if you want the frontend to call the running backend API for on-demand predictions:

Open:
```text
maishawatch-frontend/lib/api/backend-client.ts
```

**Append** the entire contents of `frontend/lib/api/backend-client-ml-append.ts.txt` at the bottom of the file.

### 6. Re-run the snapshot

From the **frontend** repo, with the backend venv activated (so `app.ml` can be imported):

```bash
# Linux / macOS
cd maishawatch-backend && source .venv/bin/activate
cd ../maishawatch-frontend
BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data

# Windows PowerShell
cd maishawatch-backend
.\.venv\Scripts\Activate.ps1
cd ..\maishawatch-frontend
$env:BACKEND_REPO_PATH="..\maishawatch-backend"
npm run sync-data
```

You should see console output like:
```text
[ML] Backend models loaded successfully
… or …
[ML] models/ not found … — using telemetry heuristics only
Wrote …/dataset.json
  ML available=True  succeeded=150  failed=0
```

### 7. Start the apps as usual

```bash
# Backend (optional for snapshot mode)
cd maishawatch-backend
source .venv/bin/activate
python run.py

# Frontend
cd maishawatch-frontend
npm run dev
```

---

## What the UI sees after a successful ML sync

Each equipment object in `lib/data/generated/dataset.json` gains:

| Field | Meaning |
|-------|---------|
| `failureProbability24h` | Model P(failure in 24 h) |
| `failureProbability72h` | Model P(failure in 72 h) |
| `failureProbability168h` | Model P(failure in 7 days) |
| `mlRulHours` | Model remaining useful life (hours) |
| `mlRiskLevel` | `critical` / `high` / `medium` / `low` from model |
| `mlSource` | `"model"` or `"telemetry"` |

Existing fields `riskScore`, `riskLevel`, `rulHours` continue to exist and are updated from the model when available, so current UI components keep working without changes.

---

## Live prediction endpoints (backend already has them)

| Method | Path | Body |
|--------|------|------|
| POST | `/predict/failure/24h` | `{ "equipment_id": "ME-00001" }` |
| POST | `/predict/failure/72h` | same |
| POST | `/predict/failure/168h` | same |
| POST | `/predict/rul` | same |
| POST | `/equipment/evaluate` | full evaluation + system alert |

Swagger UI: `http://127.0.0.1:8000/docs`

---

## Summary

- Existing snapshot pipeline is **unchanged** when models are absent.
- ML is **additive**: extra fields + preferred risk/RUL when models are present.
- No forced live HTTP dependency for the dashboard.
- One script replacement + one requirements file + optional type/client appends.
