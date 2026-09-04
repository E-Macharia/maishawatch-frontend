"use client";

import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { maishawatchData } from "@/lib/data";
import { getOverviewMetrics } from "@/lib/data/metrics";

function csvEscape(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function SnapshotButton() {
  const [open, setOpen] = useState(false);

  const exportCsv = () => {
    const metrics = getOverviewMetrics();
    const averageRisk = Math.round(maishawatchData.equipment.reduce((s, e) => s + e.riskScore, 0) / maishawatchData.equipment.length);
    const critical = maishawatchData.equipment.filter((e) => e.riskLevel === "critical").length;
    const discrepancy = maishawatchData.equipment.filter((e) => e.discrepancyFlagged).length;
    const header = ["Equipment", "Serial Number", "Facility", "County", "Type", "Risk Level", "Risk Score", "Lead Time Days", "Counter Usage", "Register Usage", "Discrepancy %", "Last Maintenance"].map(csvEscape).join(",");
    const rows = maishawatchData.equipment.slice().sort((a, b) => b.riskScore - a.riskScore).map((e) => {
      const facility = maishawatchData.facilities.find((f) => f.id === e.facilityId);
      return [e.name, e.serialNumber, facility?.name ?? "", facility?.county ?? "", e.type, e.riskLevel, e.riskScore, e.leadTimeDays, e.counterUsage, e.registerUsage, e.discrepancyPercent, e.lastMaintenanceDate].map(csvEscape).join(",");
    });
    const summary = [
      ["MaishaWatch Operational Snapshot"],
      ["Generated", new Date().toLocaleString("en-KE")],
      ["Equipment", metrics.equipmentCount],
      ["Critical assets", critical],
      ["Average risk", averageRisk],
      ["Usage discrepancies", discrepancy],
      [],
      ["Equipment portfolio"],
    ].map((row) => row.map((value) => csvEscape(value ?? "")).join(","));

    const csv = [...summary, header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maishawatch-operational-snapshot-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportHtml = () => {
    const metrics = getOverviewMetrics();
    const averageRisk = Math.round(maishawatchData.equipment.reduce((s, e) => s + e.riskScore, 0) / maishawatchData.equipment.length);
    const critical = maishawatchData.equipment.filter((e) => e.riskLevel === "critical").length;
    const discrepancy = maishawatchData.equipment.filter((e) => e.discrepancyFlagged).length;
    const rows = maishawatchData.equipment.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 20).map((e) => `<tr><td>${e.name}</td><td>${e.serialNumber}</td><td>${e.riskLevel}</td><td>${e.riskScore}</td><td>${e.leadTimeDays} days</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MaishaWatch Operational Snapshot</title><style>body{font-family:Inter,Arial,sans-serif;background:#0b1118;color:#e5edf6;padding:40px}h1{margin:0 0 6px}p{color:#8b98aa}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.card{border:1px solid #273240;padding:16px;border-radius:5px;background:#111923}.value{font-size:28px;font-weight:700;color:#fff}.label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#748196}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:10px;border-bottom:1px solid #273240;font-size:12px}th{color:#748196;text-transform:uppercase;font-size:10px;letter-spacing:.1em}</style></head><body><h1>MaishaWatch Operational Snapshot</h1><p>Generated ${new Date().toLocaleString("en-KE")}</p><div class="grid"><div class="card"><div class="label">Equipment</div><div class="value">${metrics.equipmentCount}</div></div><div class="card"><div class="label">Critical assets</div><div class="value">${critical}</div></div><div class="card"><div class="label">Average risk</div><div class="value">${averageRisk}</div></div><div class="card"><div class="label">Usage flags</div><div class="value">${discrepancy}</div></div></div><h2>Highest-priority equipment</h2><table><thead><tr><th>Equipment</th><th>Serial</th><th>Risk</th><th>Score</th><th>Lead time</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),500)</script></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maishawatch-snapshot-${new Date().toISOString().slice(0, 10)}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-stretch">
        <button onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-l-[5px] bg-white px-3 text-xs font-semibold text-slate-950 hover:bg-slate-200">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
        </button>
        <button onClick={() => setOpen((value) => !value)} aria-label="Export options" className="inline-flex h-9 w-9 items-center justify-center rounded-r-[5px] border-l border-slate-300/60 bg-white text-slate-700 hover:bg-slate-200">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-48 rounded-[5px] border border-white/[0.08] bg-[#0c131c] p-1.5 shadow-2xl">
          <button onClick={exportHtml} className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white"><FileText className="h-3.5 w-3.5" /> Export printable snapshot</button>
          <button onClick={exportCsv} className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white"><Download className="h-3.5 w-3.5" /> Export portfolio CSV</button>
        </div>
      )}
    </div>
  );
}
