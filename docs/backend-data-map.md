# MaishaWatch backend data map

This document describes how the frontend consumes the supplied backend repository without requiring that backend to expose an HTTP API.

## Source of truth

The authoritative backend contract is `docs/data_contract.md` in the backend repository. The frontend snapshot is generated from:

- `reference/facility_master.csv`
- `data/equipment_master.csv`
- `data/sensor_telemetry.csv`
- `data/maintenance_history.csv`
- `data/usage_reporting_log.csv`
- `data/failure_events.csv`

The NASA C-MAPSS FD001 files are intentionally **not** joined into the Kenyan facility/equipment UI. The backend contract says they are for predictive-maintenance method validation only.

## Frontend normalization

| Backend source | Frontend model | Main UI usage |
|---|---|---|
| facility_master | `Facility` | Facilities, facility detail, national view |
| equipment_master | `Equipment` | Equipment registry, metadata, scenario context |
| sensor_telemetry | `Equipment.telemetryHistory`, `environment`, anomaly counts | Equipment health, sensor trend, risk intelligence |
| maintenance_history | `Equipment.maintenanceLog` | Maintenance timeline, technician workflow |
| usage_reporting_log | `Equipment.usageHistory` | Counter/register comparison, discrepancy monitoring |
| failure_events | `Equipment.failureEvents` | Failure exposure, downtime, repair-cost analysis |

## Preserved backend fields now visualised

The frontend now surfaces these previously underused backend dimensions:

- facility beds/cots/capacity
- facility ownership and operating status
- service availability flags
- equipment manufacturer/model/criticality/department
- maintenance due state
- operational and condition status
- RUL (remaining useful life)
- degradation index
- utilization rate
- latest error code
- temperature, vibration, pressure, flow, power and humidity
- sensor anomaly counts
- failure-event count
- downtime hours
- estimated repair cost
- usage/reporting discrepancy history
- facility equipment-eligibility flags
- county risk concentration

## Snapshot strategy

The raw telemetry has 324,000 hourly rows. Shipping all of that directly to the browser would be unnecessary and heavy, so the sync script aggregates telemetry to daily equipment-level observations while preserving the latest sensor state and anomaly counts.

The frontend snapshot therefore remains small enough for the capstone while still being derived from the backend's actual pipeline output.

## Updating the snapshot

Set `BACKEND_REPO_PATH` to the backend repository and run:

```bash
BACKEND_REPO_PATH=../maishawatch-backend npm run sync-data
```

The script requires Python 3 and pandas. The backend repository already uses pandas in its data pipeline; a Python environment with the backend requirements installed is the easiest way to run the sync.
