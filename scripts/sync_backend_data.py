#!/usr/bin/env python3
"""
MaishaWatch frontend data snapshot generator.

Reads the backend repository CSVs, normalizes them, optionally runs the
backend ML models (if present under BACKEND_REPO_PATH/models/), and writes
lib/data/generated/dataset.json.

This is a DROP-IN REPLACEMENT for the previous sync script.
- Existing telemetry-derived riskScore / rulHours / alerts still work exactly
  as before when models are missing.
- When models are present, extra ML fields are added and risk/RUL are
  preferentially taken from the models.

Usage:
  BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
backend = Path(os.environ.get("BACKEND_REPO_PATH", "../maishawatch-backend")).expanduser().resolve()
out = Path("lib/data/generated/dataset.json").resolve()
models_dir = backend / "models"

# ---------------------------------------------------------------------------
# Optional ML import (graceful fallback when models are missing)
# ---------------------------------------------------------------------------
ML_AVAILABLE = False
predict_failure = None
predict_rul = None


def _try_load_ml():
    global ML_AVAILABLE, predict_failure, predict_rul
    if not models_dir.exists():
        print(f"[ML] models/ not found at {models_dir} — using telemetry heuristics only")
        return
    required = [
        "failure_model_24h.pkl",
        "failure_model_72h.pkl",
        "failure_model_168h.pkl",
        "rul_model.pkl",
        "rul_features.pkl",
    ]
    missing = [f for f in required if not (models_dir / f).exists()]
    if missing:
        print(f"[ML] Missing model files: {missing} — using telemetry heuristics only")
        return
    # Put backend on sys.path so we can import app.ml
    backend_str = str(backend)
    if backend_str not in sys.path:
        sys.path.insert(0, backend_str)
    try:
        from app.ml.predictor import (
            predict_failure_24h,
            predict_failure_72h,
            predict_failure_168h,
            predict_rul as _predict_rul,
        )
        predict_failure = {
            24: predict_failure_24h,
            72: predict_failure_72h,
            168: predict_failure_168h,
        }
        predict_rul = _predict_rul
        ML_AVAILABLE = True
        print("[ML] Backend models loaded successfully")
    except Exception as e:
        print(f"[ML] Could not load models ({e}) — using telemetry heuristics only")


_try_load_ml()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def norm_id(v):
    s = str(v)
    return s[:-2] if s.endswith(".0") else s


def sf(v, d=0.0):
    try:
        return d if pd.isna(v) else float(v)
    except Exception:
        return d


def si(v, d=0):
    try:
        return d if pd.isna(v) else int(round(float(v)))
    except Exception:
        return d


def rn(v, n=2):
    try:
        if pd.isna(v):
            return None
        return round(float(v), n)
    except Exception:
        return None


def rlevel(x: float) -> str:
    return "critical" if x >= 80 else "high" if x >= 60 else "medium" if x >= 40 else "low"


def mtype(x) -> str:
    s = str(x).lower()
    if "prevent" in s or "pm" in s:
        return "preventive"
    if "inspect" in s or "calibr" in s:
        return "inspection"
    return "corrective"


def ml_risk_level(p24: float, p72: float, p168: float, rul: float | None) -> str:
    """Map model outputs to the same risk levels used by the UI."""
    p = max(p24 or 0, p72 or 0, p168 or 0)
    if p >= 0.80 or (rul is not None and rul <= 8):
        return "critical"
    if p >= 0.60 or (rul is not None and rul <= 15):
        return "high"
    if p >= 0.30 or (rul is not None and rul <= 30):
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Load source CSVs
# ---------------------------------------------------------------------------
print(f"Reading backend data from {backend}")
fac = pd.read_csv(backend / "reference/facility_master.csv", dtype={"facility_id": str, "facility_code": str})
eq = pd.read_csv(backend / "data/equipment_master.csv", dtype={"facility_id": str})
telem = pd.read_csv(
    backend / "data/sensor_telemetry.csv",
    parse_dates=["timestamp"],
    dtype={"equipment_id": str, "facility_id": str},
)
maint = pd.read_csv(
    backend / "data/maintenance_history.csv",
    parse_dates=["maintenance_date"],
    dtype={"equipment_id": str, "facility_id": str},
)
usage = pd.read_csv(
    backend / "data/usage_reporting_log.csv",
    parse_dates=["week_start"],
    dtype={"equipment_id": str, "facility_id": str},
)
fail = pd.read_csv(
    backend / "data/failure_events.csv",
    parse_dates=["failure_timestamp"],
    dtype={"equipment_id": str, "facility_id": str},
)

for df in (fac, eq, telem, maint, usage, fail):
    df["facility_id"] = df["facility_id"].map(norm_id)
    if "equipment_id" in df.columns:
        df["equipment_id"] = df["equipment_id"].map(norm_id)

# ---------------------------------------------------------------------------
# Facilities
# ---------------------------------------------------------------------------
eleg_cols = {
    "hemodialysis": "eligible_hemodialysis",
    "icuVentilator": "eligible_icu_ventilator",
    "anesthesiaTheatre": "eligible_anesthesia_theatre",
    "mriCt": "eligible_mri_ct",
    "xray": "eligible_xray",
    "ultrasound": "eligible_ultrasound",
    "patientMonitor": "eligible_patient_monitor",
}
facilities = []
for _, r in fac.iterrows():
    elig = {k: (None if pd.isna(r[c]) else bool(r[c])) for k, c in eleg_cols.items()}
    facilities.append(
        {
            "id": norm_id(r["facility_id"]),
            "name": str(r.get("facility_name") or r.get("name") or ""),
            "county": str(r.get("county") or ""),
            "serviceLevel": str(r.get("keph_level") or ""),
            "facilityType": str(r.get("facility_type") or ""),
            "department": str(r.get("department") or "") or None,
            "ownerType": str(r.get("owner_type") or "") or None,
            "owner": str(r.get("owner") or "") or None,
            "beds": si(r.get("beds")),
            "cots": si(r.get("cots")),
            "bedsAndCots": si(r.get("beds_and_cots")),
            "eligibility": elig,
            "latitude": rn(r.get("latitude"), 5),
            "longitude": rn(r.get("longitude"), 5),
        }
    )

# ---------------------------------------------------------------------------
# Group helpers
# ---------------------------------------------------------------------------
tb = {k: g.sort_values("timestamp") for k, g in telem.groupby("equipment_id")}
mb = {k: g.sort_values("maintenance_date") for k, g in maint.groupby("equipment_id")}
ub = {k: g.sort_values("week_start") for k, g in usage.groupby("equipment_id")}
fb = {k: g.sort_values("failure_timestamp") for k, g in fail.groupby("equipment_id")}

type_map = {
    "Hemodialysis": "dialysis",
    "Ventilator": "icu",
    "Anesthesia": "theatre",
    "MRI": "imaging",
    "CT": "imaging",
    "X-Ray": "imaging",
    "Ultrasound": "imaging",
    "Patient Monitor": "icu",
}
name_map = {
    "Hemodialysis": "Hemodialysis Machine",
    "Ventilator": "ICU Ventilator",
    "Anesthesia": "Anesthesia Machine",
    "MRI": "MRI Scanner",
    "CT": "CT Scanner",
    "X-Ray": "X-Ray Unit",
    "Ultrasound": "Ultrasound",
    "Patient Monitor": "Patient Monitor",
}

# ---------------------------------------------------------------------------
# Equipment + optional ML predictions
# ---------------------------------------------------------------------------
equipment = []
alerts = []
ml_ok_count = 0
ml_fail_count = 0

for _, r in eq.iterrows():
    eid = norm_id(r["equipment_id"])
    et = str(r.get("equipment_type") or "Unknown")
    tg = tb.get(eid, pd.DataFrame())
    mg = mb.get(eid, pd.DataFrame())
    ug = ub.get(eid, pd.DataFrame())
    fg = fb.get(eid, pd.DataFrame())

    latest = tg.iloc[-1] if len(tg) else None
    risk = round(sf(latest["risk_score"] * 100) if latest is not None else 0)
    rul = si(latest["rul_hours"]) if latest is not None else 0
    lead = max(0, round(rul / 24))
    last_use = ug.iloc[-1] if len(ug) else None
    discrepancy = sf(last_use["discrepancy_pct"] * 100) if last_use is not None else 0.0
    discrepancy_flag = bool(last_use.get("is_labeled_discrepancy_case", False)) if last_use is not None else False
    degradation = rn(latest["degradation_index"]) if latest is not None else None
    utilization = rn(latest["utilization_rate"], 3) if latest is not None else None
    condition = str(latest["condition_status"]) if latest is not None else None
    operational = str(latest["operational_status"]) if latest is not None else None
    latest_error = str(latest.get("error_code") or "") if latest is not None else None
    maint_due = bool(latest.get("maintenance_due")) if latest is not None else False

    # Telemetry history (last 30 days aggregated)
    telemetry_history = []
    if len(tg):
        x = tg.copy()
        x["day"] = x["timestamp"].dt.floor("D")
        daily = (
            x.groupby("day")
            .agg(
                risk=("risk_score", "mean"),
                degradation=("degradation_index", "mean"),
                utilization=("utilization_rate", "mean"),
                temperature=("temperature", "mean"),
                vibration=("vibration", "mean"),
                pressure=("pressure", "mean"),
                flowRate=("flow_rate", "mean"),
                power=("power_consumption", "mean"),
                humidity=("humidity", "mean"),
            )
            .tail(30)
            .reset_index()
        )
        telemetry_history = [
            {
                "date": d.day.isoformat() if hasattr(d.day, "isoformat") else str(d.day),
                "riskScore": rn(d.risk * 100),
                "degradationIndex": rn(d.degradation),
                "utilizationRate": rn(d.utilization, 3),
                "temperature": rn(d.temperature),
                "vibration": rn(d.vibration, 3),
                "pressure": rn(d.pressure),
                "flowRate": rn(d.flowRate),
                "powerConsumption": rn(d.power),
                "humidity": rn(d.humidity),
            }
            for _, d in daily.iterrows()
        ]

    # Maintenance log
    maint_log = [
        {
            "id": f"{eid}-M-{i+1}",
            "date": pd.Timestamp(x["maintenance_date"]).strftime("%Y-%m-%d"),
            "type": mtype(x.get("maintenance_type")),
            "notes": str(x.get("notes") or x.get("action_performed") or ""),
            "daysSincePrevious": None,
            "actionPerformed": str(x.get("action_performed") or ""),
            "technician": str(x.get("technician") or ""),
            "durationHours": rn(x.get("duration_hours")),
            "partsCost": rn(x.get("parts_cost")),
            "downtimeHours": rn(x.get("downtime_hours")),
        }
        for i, (_, x) in enumerate(mg.tail(12).iterrows())
    ]

    # Usage history
    usage_history = [
        {
            "date": pd.Timestamp(x["week_start"]).strftime("%Y-%m-%d"),
            "counterUsage": rn(x["counter_reported_hours"]),
            "registerUsage": rn(x["register_reported_hours"]),
            "discrepancyPercent": rn(
                x.get("discrepancy_pct") * 100 if pd.notna(x.get("discrepancy_pct")) else None
            ),
            "isLabeledDiscrepancyCase": bool(x.get("is_labeled_discrepancy_case", False)),
        }
        for _, x in ug.tail(16).iterrows()
    ]

    # Failure events
    failures = [
        {
            "id": f"{eid}-FAIL-{i+1}",
            "timestamp": pd.Timestamp(x["failure_timestamp"]).isoformat(),
            "mode": str(x["failure_mode"]),
            "severity": str(x["severity"]).lower(),
            "riskScore": round(sf(x["risk_score"]) * 100),
            "downtimeHours": rn(x["downtime_hours"]),
            "estimatedRepairCost": rn(x["estimated_repair_cost"]),
            "rationale": str(x.get("scenario_rationale") or ""),
        }
        for i, (_, x) in enumerate(fg.tail(12).iterrows())
    ]

    # ---- ML predictions (optional, additive) ----
    ml_fields = {
        "failureProbability24h": None,
        "failureProbability72h": None,
        "failureProbability168h": None,
        "mlRulHours": None,
        "mlRiskLevel": None,
        "mlSource": "telemetry",
    }
    if ML_AVAILABLE:
        try:
            p24, _ = predict_failure[24](eid)
            p72, _ = predict_failure[72](eid)
            p168, _ = predict_failure[168](eid)
            mrul, _ = predict_rul(eid)
            ml_fields.update(
                {
                    "failureProbability24h": round(float(p24), 4),
                    "failureProbability72h": round(float(p72), 4),
                    "failureProbability168h": round(float(p168), 4),
                    "mlRulHours": max(0.0, round(float(mrul), 1)),
                    "mlRiskLevel": ml_risk_level(p24, p72, p168, mrul),
                    "mlSource": "model",
                }
            )
            # Prefer model risk for UI when available
            risk = round(max(p24, p72, p168) * 100)
            rul = max(0, int(round(mrul)))
            lead = max(0, round(rul / 24))
            ml_ok_count += 1
        except Exception:
            ml_fail_count += 1
            # keep telemetry heuristics — pipeline still works

    env = {
        "temperature": rn(latest["temperature"]) if latest is not None else None,
        "humidity": rn(latest["humidity"]) if latest is not None else None,
        "vibration": rn(latest["vibration"], 3) if latest is not None else None,
    }
    anomaly_counts = {
        "temperature": si(latest.get("temperature_anomaly")) if latest is not None else 0,
        "vibration": si(latest.get("vibration_anomaly")) if latest is not None else 0,
        "pressure": si(latest.get("pressure_instability")) if latest is not None else 0,
        "flow": si(latest.get("flow_deviation")) if latest is not None else 0,
        "power": si(latest.get("power_anomaly")) if latest is not None else 0,
    }

    item = {
        "id": eid,
        "facilityId": norm_id(r["facility_id"]),
        "name": f"{name_map.get(et, et)} · {str(r['model'])}",
        "type": type_map.get(et, "imaging"),
        "backendEquipmentType": et,
        "manufacturer": str(r["manufacturer"]),
        "model": str(r["model"]),
        "serialNumber": str(r["serial_number"]),
        "installDate": str(r["installation_date"])[:10],
        "usageDays": round(
            max(
                0,
                sf(latest["operating_hours"]) / 24
                if latest is not None
                else sf(r.get("operating_hours_at_start")) / 24,
            )
        ),
        "counterUsage": rn(last_use["counter_reported_hours"]) if last_use is not None else 0,
        "registerUsage": rn(last_use["register_reported_hours"]) if last_use is not None else 0,
        "discrepancyPercent": round(discrepancy, 2),
        "discrepancyFlagged": discrepancy_flag,
        "riskScore": risk,
        "riskLevel": rlevel(risk) if ml_fields["mlRiskLevel"] is None else ml_fields["mlRiskLevel"],
        "leadTimeDays": lead,
        "scenarioPattern": str(r["scenario_type"])
        .replace("MaintenanceNeglect", "maintenance-neglect")
        .replace("UsageDiscrepancy", "usage-discrepancy")
        .replace("Normal", "normal"),
        "scenarioRationale": str(r["scenario_rationale"] or ""),
        "lastMaintenanceDate": str(r["last_maintenance_date"])[:10],
        "maintenanceIntervalDays": si(r.get("maintenance_interval_days")),
        "criticality": str(r.get("criticality") or ""),
        "department": str(r.get("department") or ""),
        "maintenanceDue": maint_due,
        "operationalStatus": operational,
        "conditionStatus": condition,
        "degradationIndex": degradation,
        "rulHours": rul,
        "utilizationRate": utilization,
        "latestErrorCode": latest_error,
        "environment": env,
        "anomalyCounts": anomaly_counts,
        "telemetryHistory": telemetry_history,
        "maintenanceLog": maint_log,
        "usageHistory": usage_history,
        "failureEvents": failures,
        "failureCount": len(fg),
        "totalDowntimeHours": rn(fg["downtime_hours"].sum()) if len(fg) else 0,
        "estimatedRepairCost": rn(fg["estimated_repair_cost"].sum()) if len(fg) else 0,
        # New ML fields (null when models were not available)
        **ml_fields,
    }
    equipment.append(item)

    if risk >= 60:
        alerts.append(
            {
                "id": f"AL-{eid}-R",
                "type": "risk",
                "severity": item["riskLevel"],
                "equipmentId": eid,
                "facilityId": item["facilityId"],
                "message": f"{et} risk is {risk}/100 with {lead} usage-days of remaining useful life.",
                "scenarioRationale": item["scenarioRationale"],
                "createdAt": str(latest["timestamp"]) if latest is not None else item["lastMaintenanceDate"],
            }
        )
    if discrepancy_flag and discrepancy >= 15:
        alerts.append(
            {
                "id": f"AL-{eid}-D",
                "type": "discrepancy",
                "severity": "high" if discrepancy >= 30 else "medium",
                "equipmentId": eid,
                "facilityId": item["facilityId"],
                "message": f"Usage discrepancy of {discrepancy:.1f}% between counter and register.",
                "scenarioRationale": item["scenarioRationale"],
                "createdAt": str(last_use["week_start"]) if last_use is not None else item["lastMaintenanceDate"],
            }
        )

# ---------------------------------------------------------------------------
# Write snapshot
# ---------------------------------------------------------------------------
out.parent.mkdir(parents=True, exist_ok=True)
payload = {
    "meta": {
        "source": "MaishaWatch backend data pipeline snapshot",
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "facilityCount": len(facilities),
        "equipmentCount": len(equipment),
        "alertCount": len(alerts),
        "telemetryRows": len(telem),
        "maintenanceRows": len(maint),
        "usageRows": len(usage),
        "failureRows": len(fail),
        "mlModelsUsed": ML_AVAILABLE,
        "mlPredictionsSucceeded": ml_ok_count,
        "mlPredictionsFailed": ml_fail_count,
        "dataContract": "docs/data_contract.md",
    },
    "facilities": facilities,
    "equipment": equipment,
    "alerts": alerts,
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

print(f"Wrote {out}")
print(f"  facilities={len(facilities)}  equipment={len(equipment)}  alerts={len(alerts)}")
print(f"  ML available={ML_AVAILABLE}  succeeded={ml_ok_count}  failed={ml_fail_count}")
