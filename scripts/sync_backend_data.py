import os
import pandas as pd, json, math
from pathlib import Path
backend=Path(os.environ.get('BACKEND_REPO_PATH','../maishawatch-backend')).expanduser().resolve()
out=Path('lib/data/generated/dataset.json').resolve()
fac=pd.read_csv(backend/'reference/facility_master.csv', dtype={'facility_id':str,'facility_code':str})
eq=pd.read_csv(backend/'data/equipment_master.csv', dtype={'facility_id':str})
telem=pd.read_csv(backend/'data/sensor_telemetry.csv', parse_dates=['timestamp'], dtype={'equipment_id':str,'facility_id':str})
maint=pd.read_csv(backend/'data/maintenance_history.csv', parse_dates=['maintenance_date'], dtype={'equipment_id':str,'facility_id':str})
usage=pd.read_csv(backend/'data/usage_reporting_log.csv', parse_dates=['week_start'], dtype={'equipment_id':str,'facility_id':str})
fail=pd.read_csv(backend/'data/failure_events.csv', parse_dates=['failure_timestamp'], dtype={'equipment_id':str,'facility_id':str})

def norm_id(v):
    s=str(v)
    return s[:-2] if s.endswith('.0') else s
for df in (fac,eq,telem,maint,usage,fail):
    df['facility_id']=df['facility_id'].map(norm_id)
    if 'equipment_id' in df: df['equipment_id']=df['equipment_id'].map(norm_id)

def sf(v,d=0):
    try:
        return d if pd.isna(v) else float(v)
    except: return d
def si(v,d=0):
    try:
        return d if pd.isna(v) else int(round(float(v)))
    except: return d
def rn(v,n=2):
    try:
        if pd.isna(v): return None
        return round(float(v),n)
    except: return None
def rlevel(x):
    return 'critical' if x>=80 else 'high' if x>=60 else 'medium' if x>=40 else 'low'
def mtype(x):
    s=str(x).lower()
    if 'prevent' in s or 'pm' in s: return 'preventive'
    if 'inspect' in s or 'calibr' in s: return 'inspection'
    return 'corrective'

tb={k:g.sort_values('timestamp') for k,g in telem.groupby('equipment_id')}
mb={k:g.sort_values('maintenance_date') for k,g in maint.groupby('equipment_id')}
ub={k:g.sort_values('week_start') for k,g in usage.groupby('equipment_id')}
fb={k:g.sort_values('failure_timestamp') for k,g in fail.groupby('equipment_id')}

eleg_cols={
 'hemodialysis':'eligible_hemodialysis','icuVentilator':'eligible_icu_ventilator','anesthesiaTheatre':'eligible_anesthesia_theatre',
 'mriCt':'eligible_mri_ct','xray':'eligible_xray','ultrasound':'eligible_ultrasound','patientMonitor':'eligible_patient_monitor'}
facilities=[]
for _,r in fac.iterrows():
    elig={k:(None if pd.isna(r[c]) else bool(r[c])) for k,c in eleg_cols.items()}
    facilities.append({
      'id':norm_id(r['facility_id']), 'name':str(r.get('official_name') if not pd.isna(r.get('official_name')) else r.get('facility_name') or ''),
      'county':str(r.get('county') or ''),'serviceLevel':str(r.get('keph_level') or 'Unknown'),'facilityType':str(r.get('facility_type') or ''),
      'ownerType':str(r.get('owner_type') or ''),'owner':str(r.get('owner') or ''),'regulatoryBody':str(r.get('regulatory_body') or ''),
      'beds':si(r.get('beds')),'cots':si(r.get('cots')),'bedsAndCots':si(r.get('beds_and_cots')),'operationStatus':str(r.get('operation_status') or ''),
      'openWholeDay':str(r.get('open_whole_day') or ''),'openWeekends':str(r.get('open_weekends') or ''),'openPublicHolidays':str(r.get('open_public_holidays') or ''),'openLateNight':str(r.get('open_late_night') or ''),
      'subCounty':str(r.get('sub_county') or ''),'constituency':str(r.get('constituency') or ''),'ward':str(r.get('ward') or ''),
      'equipmentEligibleAny':None if pd.isna(r.get('equipment_eligible_any')) else bool(r.get('equipment_eligible_any')),'eligibility':elig,
      'serviceNames':[] if pd.isna(r.get('service_names')) else [x.strip() for x in str(r.get('service_names')).split(';') if x.strip()]
    })

type_map={'Hemodialysis':'dialysis','Ventilator':'icu','Patient Monitor':'icu','Anesthesia':'theatre','MRI':'imaging','CT':'imaging','Ultrasound':'imaging','X-Ray':'imaging'}
name_map={'Hemodialysis':'Hemodialysis Machine','Ventilator':'ICU Ventilator','Patient Monitor':'Patient Monitor','Anesthesia':'Anaesthesia Workstation','MRI':'MRI Scanner','CT':'CT Scanner','Ultrasound':'Ultrasound System','X-Ray':'X-Ray System'}
equipment=[]; alerts=[]
for _,r in eq.iterrows():
    eid=norm_id(r['equipment_id']); et=str(r['equipment_type']); tg=tb.get(eid,pd.DataFrame()); mg=mb.get(eid,pd.DataFrame()); ug=ub.get(eid,pd.DataFrame()); fg=fb.get(eid,pd.DataFrame())
    latest=tg.iloc[-1] if len(tg) else None
    risk=round(sf(latest['risk_score']*100) if latest is not None else 0)
    rul=si(latest['rul_hours']) if latest is not None else 0
    lead=max(0,round(rul/24)); last_use=ug.iloc[-1] if len(ug) else None
    discrepancy=sf(last_use['discrepancy_pct']*100) if last_use is not None else sf(r.get('discrepancy_pct_target'))*100
    discrepancy_flag=bool(ug['is_labeled_discrepancy_case'].any()) if len(ug) else False
    telemetry_history=[]; anomaly_counts={k:0 for k in ['temperature','vibration','pressure','flow','power']}; env={}; operational='Unknown'; condition='Unknown'; maint_due=False; degradation=0; utilization=0; latest_error='NONE'
    if len(tg):
        x=tg.copy(); x['day']=x['timestamp'].dt.date.astype(str)
        daily=x.groupby('day').agg(risk=('risk_score','mean'),degradation=('degradation_index','mean'),utilization=('utilization_rate','mean'),temperature=('temperature','mean'),vibration=('vibration','mean'),pressure=('pressure','mean'),flowRate=('flow_rate','mean'),power=('power_consumption','mean'),humidity=('humidity','mean')).tail(30).reset_index()
        telemetry_history=[{'date':d.day,'riskScore':rn(d.risk*100),'degradationIndex':rn(d.degradation),'utilizationRate':rn(d.utilization,3),'temperature':rn(d.temperature),'vibration':rn(d.vibration,3),'pressure':rn(d.pressure),'flowRate':rn(d.flowRate),'powerConsumption':rn(d.power),'humidity':rn(d.humidity)} for _,d in daily.iterrows()]
        last30=tg.tail(30)
        for k,c in {'temperature':'temperature_anomaly','vibration':'vibration_anomaly','pressure':'pressure_instability','flow':'flow_deviation','power':'power_anomaly'}.items(): anomaly_counts[k]=int((last30[c]>0.2).sum())
        latest_error=str(latest.get('error_code') or 'NONE'); operational=str(latest.get('operational_status') or 'Unknown'); condition=str(latest.get('condition_status') or 'Unknown'); maint_due=bool(latest.get('maintenance_due')); degradation=rn(latest.get('degradation_index')); utilization=rn(latest.get('utilization_rate'),3)
        env={'temperature':rn(latest.get('temperature')),'vibration':rn(latest.get('vibration'),3),'pressure':rn(latest.get('pressure')),'flowRate':rn(latest.get('flow_rate')),'powerConsumption':rn(latest.get('power_consumption')),'humidity':rn(latest.get('humidity'))}
    maint_log=[]; prev=None
    for _,m in mg.tail(8).iterrows():
        d=pd.Timestamp(m['maintenance_date']); gap=None if prev is None else (d-prev).days; prev=d
        maint_log.append({'id':str(m['maintenance_id']),'date':d.date().isoformat(),'type':mtype(m['maintenance_type']),'notes':str(m.get('maintenance_notes') or m.get('action_performed') or ''),'daysSincePrevious':gap,'actionPerformed':str(m.get('action_performed') or ''),'technician':str(m.get('technician') or ''),'durationHours':rn(m.get('duration_hours')),'partsCost':rn(m.get('parts_cost')),'downtimeHours':rn(m.get('downtime_hours'))})
    usage_history=[{'date':pd.Timestamp(u['week_start']).date().isoformat(),'counterUsage':rn(u['counter_reported_hours']),'registerUsage':rn(u['register_reported_hours']),'discrepancyPercent':rn(u['discrepancy_pct']*100),'isLabeledDiscrepancyCase':bool(u['is_labeled_discrepancy_case'])} for _,u in ug.tail(16).iterrows()]
    failures=[{'id':f'{eid}-FAIL-{i+1}','timestamp':pd.Timestamp(x['failure_timestamp']).isoformat(),'mode':str(x['failure_mode']),'severity':str(x['severity']).lower(),'riskScore':round(sf(x['risk_score'])*100),'downtimeHours':rn(x['downtime_hours']),'estimatedRepairCost':rn(x['estimated_repair_cost']),'rationale':str(x.get('scenario_rationale') or '')} for i,(_,x) in enumerate(fg.tail(12).iterrows())]
    item={'id':eid,'facilityId':norm_id(r['facility_id']),'name':f"{name_map.get(et,et)} · {str(r['model'])}",'type':type_map.get(et,'imaging'),'backendEquipmentType':et,'manufacturer':str(r['manufacturer']),'model':str(r['model']),'serialNumber':str(r['serial_number']),'installDate':str(r['installation_date'])[:10],'usageDays':round(max(0,sf(latest['operating_hours'])/24 if latest is not None else sf(r.get('operating_hours_at_start'))/24)),'counterUsage':rn(last_use['counter_reported_hours']) if last_use is not None else 0,'registerUsage':rn(last_use['register_reported_hours']) if last_use is not None else 0,'discrepancyPercent':round(discrepancy,2),'discrepancyFlagged':discrepancy_flag,'riskScore':risk,'riskLevel':rlevel(risk),'leadTimeDays':lead,'scenarioPattern':str(r['scenario_type']).replace('MaintenanceNeglect','maintenance-neglect').replace('UsageDiscrepancy','usage-discrepancy').replace('Normal','normal'),'scenarioRationale':str(r['scenario_rationale'] or ''),'lastMaintenanceDate':str(r['last_maintenance_date'])[:10],'maintenanceIntervalDays':si(r.get('maintenance_interval_days')),'criticality':str(r.get('criticality') or ''),'department':str(r.get('department') or ''),'maintenanceDue':maint_due,'operationalStatus':operational,'conditionStatus':condition,'degradationIndex':degradation,'rulHours':rul,'utilizationRate':utilization,'latestErrorCode':latest_error,'environment':env,'anomalyCounts':anomaly_counts,'telemetryHistory':telemetry_history,'maintenanceLog':maint_log,'usageHistory':usage_history,'failureEvents':failures,'failureCount':len(fg),'totalDowntimeHours':rn(fg['downtime_hours'].sum()) if len(fg) else 0,'estimatedRepairCost':rn(fg['estimated_repair_cost'].sum()) if len(fg) else 0}
    equipment.append(item)
    if risk>=60:
        alerts.append({'id':f'AL-{eid}-R','type':'risk','severity':item['riskLevel'],'equipmentId':eid,'facilityId':item['facilityId'],'message':f"{et} risk is {risk}/100 with {lead} usage-days of remaining useful life.",'scenarioRationale':item['scenarioRationale'],'createdAt':str(latest['timestamp']) if latest is not None else item['lastMaintenanceDate']})
    if discrepancy_flag:
        alerts.append({'id':f'AL-{eid}-D','type':'discrepancy','severity':'high' if discrepancy>=20 else 'medium','equipmentId':eid,'facilityId':item['facilityId'],'message':f'Counter-to-register discrepancy detected: {discrepancy:.1f}%.','scenarioRationale':item['scenarioRationale'],'createdAt':usage_history[-1]['date'] if usage_history else item['lastMaintenanceDate']})

alerts=sorted(alerts,key=lambda a:(0 if a['severity']=='critical' else 1 if a['severity']=='high' else 2,a['createdAt']))
meta={'source':'MaishaWatch backend data pipeline snapshot','generatedAt':pd.Timestamp.utcnow().isoformat(),'facilityCount':len(facilities),'equipmentCount':len(equipment),'alertCount':len(alerts),'telemetryRows':len(telem),'maintenanceRows':len(maint),'usageRows':len(usage),'failureRows':len(fail),'dataContract':'docs/data_contract.md'}
out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps({'meta':meta,'facilities':facilities,'equipment':equipment,'alerts':alerts},separators=(',',':')))
print(meta); print(f'snapshot={out.stat().st_size/1024/1024:.2f}MB alerts={len(alerts)}')
