"use client";

import { useEffect, useMemo, useState } from "react";
import { demoUnits } from "../lib/demo-data";
import { STAGES, type City, type PipelineStage, type Unit } from "../lib/types";

const daysSince = (date: string | null) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : null;
const stageDate = (unit: Unit, stage: PipelineStage) => ({
  notice: unit.notice_at,
  move_out: unit.move_out_at,
  listed: unit.listed_at,
  showing: unit.first_showing_at,
  application: unit.application_at,
  lease_signed: unit.lease_signed_at
}[stage]);
const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
const csvValue = (value: string | number) => `"${String(value).replace(/"/g, "\"\"")}"`;
const downloadCsv = (units: Unit[]) => {
  const rows = [
    ["Unit", "Property", "Address", "City", "Current stage", "Days in stage", "Monthly rent", "Owner"],
    ...units.map((unit) => {
      const current = STAGES.slice().reverse().find((stage) => stageDate(unit, stage.key) && !unit.lease_signed_at) ?? STAGES[0];
      return [
        unit.unit_number,
        unit.property_name,
        unit.address,
        unit.city,
        current.label,
        daysSince(stageDate(unit, current.key)) ?? 0,
        unit.monthly_rent,
        ["J. Lee", "A. Chen", "R. Miller", "T. Singh"][Number(unit.id.replace(/\D/g, "")) % 4]
      ];
    })
  ];
  const blob = new Blob([rows.map((row) => row.map(csvValue).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ko-realty-units.csv";
  link.click();
  URL.revokeObjectURL(url);
};
type Page = "pipeline" | "units" | "tasks" | "performance" | "settings";

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>(demoUnits);
  const [page, setPage] = useState<Page>("pipeline");
  const [city, setCity] = useState<City | "All">("All");
  const [filter, setFilter] = useState("All units");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/units").then((response) => response.json()).then((result) => {
      if (Array.isArray(result.units)) setUnits(result.units);
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => units.filter((unit) => {
    const matchesCity = city === "All" || unit.city === city;
    const matchesQuery = `${unit.property_name} ${unit.unit_number} ${unit.address}`.toLowerCase().includes(query.toLowerCase());
    const vacant = unit.move_out_at && !unit.lease_signed_at;
    const stuck = vacant && ((daysSince(unit.move_out_at) ?? 0) > 30 || (!unit.listed_at && (daysSince(unit.move_out_at) ?? 0) > 3));
    return matchesCity && matchesQuery && (filter === "All units" || (filter === "Stuck" && stuck) || (filter === "Vacant" && vacant));
  }), [city, filter, query, units]);

  const vacant = units.filter((unit) => unit.move_out_at && !unit.lease_signed_at);
  const stuck = vacant.filter((unit) => (daysSince(unit.move_out_at) ?? 0) > 30 || (!unit.listed_at && (daysSince(unit.move_out_at) ?? 0) > 3));
  const totalRentAtRisk = vacant.reduce((sum, unit) => sum + unit.monthly_rent, 0);
  const avgVacancy = vacant.length ? Math.round(vacant.reduce((sum, unit) => sum + (daysSince(unit.move_out_at) ?? 0), 0) / vacant.length) : 0;

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">K</div><div><strong>KO REALTY</strong><span>OPERATIONS</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav><NavItem page="pipeline" current={page} onClick={setPage} icon="◈" label="Vacancy pipeline"/><NavItem page="units" current={page} onClick={setPage} icon="▦" label="All units"/><NavItem page="tasks" current={page} onClick={setPage} icon="✓" label="Turnover tasks" badge="12"/></nav>
      <div className="workspace-label">REPORTING</div>
      <nav><NavItem page="performance" current={page} onClick={setPage} icon="↗" label="Performance"/><NavItem page="settings" current={page} onClick={setPage} icon="⚙" label="Settings"/></nav>
      <div className="sidebar-bottom"><div className="sync-dot"/><div><strong>Data synced</strong><small>{loading ? "Connecting..." : "Just now · Supabase"}</small></div><button aria-label="More options">•••</button></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><div className="eyebrow">OPERATIONS / TURNOVER</div><h1>{pageTitle(page)}</h1><p>{pageDescription(page)}</p></div><div className="header-actions"><button className="icon-button" aria-label="Help">?</button><div className="avatar">MS</div></div></header>
      {page === "tasks" && <TasksPage units={units} onOpenPipeline={() => setPage("pipeline")}/>}
      {page === "performance" && <PerformancePage units={units}/>}
      {page === "settings" && <SettingsPage/>}
      {page !== "tasks" && page !== "performance" && page !== "settings" && <>
      <div className="toolbar"><div className="tabs"><button className={filter === "All units" ? "selected" : ""} onClick={() => setFilter("All units")}>All units <span>{units.length}</span></button><button className={filter === "Vacant" ? "selected" : ""} onClick={() => setFilter("Vacant")}>Vacant <span>{vacant.length}</span></button><button className={filter === "Stuck" ? "selected" : ""} onClick={() => setFilter("Stuck")}>Stuck <span className="alert-count">{stuck.length}</span></button></div><div className="filters"><div className="search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units..." /></div><select value={city} onChange={(event) => setCity(event.target.value as City | "All")}><option value="All">All cities</option><option value="Calgary">Calgary</option><option value="Edmonton">Edmonton</option></select><button className="filter-button">≡ Filters</button></div></div>
      <div className="metric-grid"><Metric label="Vacant now" value={vacant.length} detail={`${Math.round((vacant.length / units.length) * 100)}% of portfolio`} tone="purple" icon="◇"/><Metric label="Avg. days vacant" value={avgVacancy} detail="Target is under 21 days" tone="orange" icon="◷"/><Metric label="Rent at risk" value={money(totalRentAtRisk)} detail="Monthly opportunity cost" tone="blue" icon="$"/><Metric label="Need attention" value={stuck.length} detail="Units past SLA" tone="red" icon="!" alert/></div>
      <section className="pipeline-section" id="pipeline"><div className="section-heading"><div><h2>Pipeline health</h2><p>Days in each stage across active turnovers</p></div><div className="legend"><span><i className="dot green"/>On track</span><span><i className="dot yellow"/>At risk</span><span><i className="dot red"/>Stuck</span></div></div><div className="pipeline">{STAGES.map((stage) => {
        const active = units.filter((unit) => stageDate(unit, stage.key) && (stage.key === "lease_signed" || !unit.lease_signed_at));
        const average = active.length ? Math.round(active.reduce((sum, unit) => sum + (daysSince(stageDate(unit, stage.key)) ?? 0), 0) / active.length) : 0;
        const longest = active.reduce((max, unit) => Math.max(max, daysSince(stageDate(unit, stage.key)) ?? 0), 0);
        const status = average > 30 ? "red" : average > 21 ? "yellow" : "green";
        return <div className="stage" key={stage.key}><div className="stage-top"><span className="stage-icon" style={{ backgroundColor: `${stage.color}18`, color: stage.color }}>○</span><span className={`stage-status ${status}`}/></div><strong>{active.length}</strong><span className="stage-name">{stage.label}</span><div className="stage-days"><b>{average}d</b> avg · <b>{longest}d</b> longest</div></div>;
      })}</div></section>
      <section className="table-section" id="units"><div className="section-heading"><div><h2>{filter === "All units" ? "Units in motion" : filter}</h2><p>Recent activity and blockers requiring action</p></div><button className="export" onClick={() => downloadCsv(filtered)}>Export CSV ↗</button></div><div className="table-wrap"><table><thead><tr><th>Unit</th><th>City</th><th>Current stage</th><th>Days in stage</th><th>Monthly rent</th><th>Owner</th><th></th></tr></thead><tbody>{filtered.slice(0, page === "units" ? filtered.length : 12).map((unit) => {
        const current = STAGES.slice().reverse().find((stage) => stageDate(unit, stage.key) && !unit.lease_signed_at) ?? STAGES[0];
        const days = daysSince(stageDate(unit, current.key)) ?? 0;
        const isStuck = days > 30 || (current.key === "move_out" && days > 3);
        return <tr key={unit.id}><td><div className="unit-name"><span className="unit-symbol">{unit.bedrooms === 0 ? "S" : unit.bedrooms + "B"}</span><div><strong>{unit.property_name}</strong><small>{unit.unit_number} · {unit.address}</small></div></div></td><td>{unit.city}</td><td><span className="stage-pill" style={{ color: current.color, backgroundColor: `${current.color}15` }}><i/> {current.label}</span></td><td><span className={isStuck ? "days stuck" : "days"}>{days} days {isStuck && "!"}</span></td><td>{money(unit.monthly_rent)}</td><td><div className="owner"><span>{["JL", "AC", "RM", "TS"][Number(unit.id.replace(/\D/g, "")) % 4]}</span>{["J. Lee", "A. Chen", "R. Miller", "T. Singh"][Number(unit.id.replace(/\D/g, "")) % 4]}</div></td><td><button className="row-menu">•••</button></td></tr>;
      })}</tbody></table></div><div className="table-footer">Showing {Math.min(filtered.length, page === "units" ? filtered.length : 12)} of {filtered.length} units {page === "pipeline" && <button onClick={() => setPage("units")}>View all units →</button>}</div></section>
      </>}
    </section>
  </main>;
}

function pageTitle(page: Page) {
  return { pipeline: "Vacancy pipeline", units: "All units", tasks: "Turnover tasks", performance: "Performance", settings: "Settings" }[page];
}

function pageDescription(page: Page) {
  return { pipeline: "Track every home from notice to new lease.", units: "Browse and filter every home in your portfolio.", tasks: "Keep every turnover moving with clear next steps.", performance: "Understand vacancy trends and portfolio health.", settings: "Manage workspace preferences and integrations." }[page];
}

function NavItem({ page, current, onClick, icon, label, badge }: { page: Page; current: Page; onClick: (page: Page) => void; icon: string; label: string; badge?: string }) {
  return <a href={`#${page}`} className={current === page ? "active" : ""} onClick={(event) => { event.preventDefault(); onClick(page); }}><span>{icon}</span>{label}{badge && <b>{badge}</b>}</a>;
}

function TasksPage({ units, onOpenPipeline }: { units: Unit[]; onOpenPipeline: () => void }) {
  const tasks = units.filter((unit) => unit.move_out_at && !unit.lease_signed_at).slice(0, 12);
  return <section className="page-panel" id="tasks"><div className="section-heading"><div><h2>Open turnover tasks</h2><p>Prioritized actions for homes that need attention.</p></div><button className="export" onClick={onOpenPipeline}>View pipeline</button></div><div className="task-list">{tasks.map((unit, index) => <div className="task-row" key={unit.id}><button className="task-check" aria-label={`Complete task for ${unit.property_name}`}>○</button><div><strong>{index % 3 === 0 ? "Schedule turnover inspection" : index % 3 === 1 ? "Confirm listing is live" : "Follow up on application"}</strong><small>{unit.property_name} · {unit.unit_number} · {unit.city}</small></div><span className={index < 4 ? "task-due overdue" : "task-due"}>{index < 4 ? "Overdue" : `Due in ${index - 3} days`}</span></div>)}</div></section>;
}

function PerformancePage({ units }: { units: Unit[] }) {
  const leased = units.filter((unit) => unit.lease_signed_at);
  const vacant = units.filter((unit) => unit.move_out_at && !unit.lease_signed_at);
  const leasedDays = leased.length ? Math.round(leased.reduce((sum, unit) => sum + (daysSince(unit.lease_signed_at) ?? 0), 0) / leased.length) : 0;
  return <section className="page-panel" id="performance"><div className="metric-grid"><Metric label="Lease conversions" value={leased.length} detail={`${Math.round((leased.length / units.length) * 100)}% of portfolio`} tone="purple" icon="↗"/><Metric label="Active vacancies" value={vacant.length} detail="Currently in turnover" tone="orange" icon="◇"/><Metric label="Avg. lease age" value={`${leasedDays}d`} detail="Since lease signed" tone="blue" icon="◷"/><Metric label="Portfolio rent" value={money(units.reduce((sum, unit) => sum + unit.monthly_rent, 0))} detail="Monthly scheduled rent" tone="red" icon="$"/></div><div className="report-card"><h2>Portfolio overview</h2><p>Performance reporting is based on the latest synced unit data.</p><div className="bar-chart"><i style={{ height: "72%" }}/><i style={{ height: "54%" }}/><i style={{ height: "81%" }}/><i style={{ height: "63%" }}/><i style={{ height: "92%" }}/><i style={{ height: "68%" }}/></div></div></section>;
}

function SettingsPage() {
  return <section className="page-panel" id="settings"><div className="settings-card"><h2>Workspace settings</h2><p>These preferences apply to the KO Realty operations workspace.</p><label>Workspace name<input defaultValue="KO Realty" /></label><label>Default city<select defaultValue="All"><option value="All">All cities</option><option>Calgary</option><option>Edmonton</option></select></label><label className="setting-toggle"><span><strong>Daily turnover alerts</strong><small>Notify the operations team about overdue units.</small></span><input type="checkbox" defaultChecked /></label><button className="save-button" onClick={() => alert("Settings saved")}>Save settings</button></div></section>;
}

function Metric({ label, value, detail, tone, icon, alert = false }: { label: string; value: string | number; detail: string; tone: string; icon: string; alert?: boolean }) {
  return <div className={`metric ${tone}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small className={alert ? "red-text" : ""}>{detail}</small></div></div>;
}
