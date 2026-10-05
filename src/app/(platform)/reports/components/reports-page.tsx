"use client";

import { useMemo, useState } from "react";
import CalendarRange from "@/components/ui/calendar";
import Icon from "@/components/ui/icon";
import {
  downloadReport,
  estimateSizeLabel,
  type ReportDocInput,
} from "./report-export";
import ReportPreview from "./report-preview";
import {
  REPORTS,
  REPORT_OPERATIONS,
  REPORT_SECTIONS,
  REPORT_TYPES,
  type ReportRecord,
  type ReportStatus,
  type ReportTypeId,
} from "./reports-data";

type View = "list" | "create" | "detail";

const STEPS = ["Type", "Configuration", "Data Selection", "Options", "Preview"] as const;
const STATUS_OPTS: Array<"All Status" | ReportStatus> = ["All Status", "COMPLETED", "FAILED", "PROCESSING"];
const TYPE_OPTS = ["All Types", ...REPORT_TYPES.map((item) => item.label)];

function statusClass(status: ReportStatus) {
  return status.toLowerCase();
}

function typeTone(typeId: ReportTypeId) {
  return REPORT_TYPES.find((item) => item.id === typeId)?.tone ?? "blue";
}

function prettyPeriod(from: string, to: string) {
  if (!from && !to) return "—";
  if (from && to && from !== to) return `${from} – ${to}`;
  return from || to;
}

function recordToDoc(record: ReportRecord): ReportDocInput {
  return {
    name: record.name,
    typeLabel: record.typeLabel,
    description: record.description,
    operation: record.operation,
    period: record.period,
    generatedBy: record.generatedBy,
    generatedAt: record.generatedAt,
    format: record.file,
    layout: record.layout ?? "Standard",
    language: record.language ?? "English",
    detailLevel: record.detailLevel ?? "Standard",
    includeMap: record.includeMap ?? true,
    showLayers: record.showLayers ?? true,
    sectionIds: record.sectionIds ?? REPORT_SECTIONS.map((item) => item.id),
  };
}

export default function ReportsView() {
  const [view, setView] = useState<View>("list");
  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [rows, setRows] = useState(REPORTS);
  const [selectedId, setSelectedId] = useState(REPORTS[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState<"All Status" | ReportStatus>("All Status");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-07");
  const [category, setCategory] = useState<ReportTypeId | "all">("all");

  const [typeId, setTypeId] = useState<ReportTypeId>("operational");
  const [name, setName] = useState("Operation Alpha - Daily Report");
  const [description, setDescription] = useState("Daily operational summary for selected mission window.");
  const [operation, setOperation] = useState(REPORT_OPERATIONS[0]);
  const [periodFrom, setPeriodFrom] = useState("2026-10-05");
  const [periodTo, setPeriodTo] = useState("2026-10-05");
  const [sections, setSections] = useState(REPORT_SECTIONS.map((item) => item.id));
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [layout, setLayout] = useState<"Standard" | "Compact">("Standard");
  const [includeMap, setIncludeMap] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [detailLevel, setDetailLevel] = useState("Standard");
  const [language, setLanguage] = useState("English");
  const [detailTab, setDetailTab] = useState<"overview" | "content">("overview");
  const isEditing = Boolean(editingId);

  const selectedType = REPORT_TYPES.find((item) => item.id === typeId) ?? REPORT_TYPES[0];
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null;

  const draftDoc = useMemo<ReportDocInput>(() => ({
    name: name.trim() || `${selectedType.label} Report`,
    typeLabel: selectedType.label,
    description: description.trim() || "Operational report document.",
    operation,
    period: prettyPeriod(periodFrom, periodTo),
    generatedBy: "Admin User",
    generatedAt: "05 Oct 2026 16:20",
    format,
    layout,
    language,
    detailLevel,
    includeMap,
    showLayers,
    sectionIds: sections,
  }), [
    description,
    detailLevel,
    format,
    includeMap,
    language,
    layout,
    name,
    operation,
    periodFrom,
    periodTo,
    sections,
    selectedType.label,
    showLayers,
  ]);

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      if (category !== "all" && item.typeId !== category) return false;
      if (typeFilter !== "All Types" && item.typeLabel !== typeFilter) return false;
      if (statusFilter !== "All Status" && item.status !== statusFilter) return false;
      const q = query.trim().toLowerCase();
      if (q && !`${item.name} ${item.generatedBy} ${item.typeLabel}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, query, rows, statusFilter, typeFilter]);

  function resetFilters() {
    setQuery("");
    setTypeFilter("All Types");
    setStatusFilter("All Status");
    setFrom("2026-10-01");
    setTo("2026-10-07");
    setCategory("all");
  }

  function openCreate(preset?: ReportTypeId) {
    const next = preset ?? "operational";
    const card = REPORT_TYPES.find((item) => item.id === next) ?? REPORT_TYPES[0];
    setEditingId(null);
    setTypeId(card.id);
    setName(`${card.label} Report - ${card.hint.split(" ").slice(0, 3).join(" ")}`);
    setDescription("");
    setOperation(REPORT_OPERATIONS[0]);
    setPeriodFrom("2026-10-05");
    setPeriodTo("2026-10-05");
    setSections(REPORT_SECTIONS.map((item) => item.id));
    setFormat("PDF");
    setLayout("Standard");
    setIncludeMap(true);
    setShowLayers(true);
    setDetailLevel("Standard");
    setLanguage("English");
    setStep(preset ? 1 : 0);
    setView("create");
  }

  function openEdit(id: string) {
    const report = rows.find((item) => item.id === id);
    if (!report) return;
    setEditingId(report.id);
    setSelectedId(report.id);
    setMenuId(null);
    setTypeId(report.typeId);
    setName(report.name);
    setDescription(report.description);
    setOperation(report.operation);
    setPeriodFrom(report.periodFrom || "2026-10-05");
    setPeriodTo(report.periodTo || report.periodFrom || "2026-10-05");
    setSections(report.sectionIds?.length ? report.sectionIds : REPORT_SECTIONS.map((item) => item.id));
    setFormat(report.file);
    setLayout(report.layout ?? "Standard");
    setIncludeMap(report.includeMap ?? true);
    setShowLayers(report.showLayers ?? true);
    setDetailLevel(report.detailLevel ?? "Standard");
    setLanguage(report.language ?? "English");
    setStep(1);
    setView("create");
  }

  function openDetail(id: string) {
    setSelectedId(id);
    setMenuId(null);
    setDetailTab("overview");
    setView("detail");
  }

  function toggleSection(id: string) {
    setSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function saveReport(shouldDownload: boolean) {
    const result = shouldDownload
      ? downloadReport(draftDoc)
      : { sizeLabel: estimateSizeLabel(format) };
    const stamp = "05 Oct 2026 16:20";
    const next: ReportRecord = {
      id: editingId || `r-${Date.now()}`,
      name: draftDoc.name,
      typeId,
      typeLabel: selectedType.label,
      generatedBy: draftDoc.generatedBy,
      generatedAt: stamp,
      period: draftDoc.period,
      periodFrom,
      periodTo,
      status: "COMPLETED",
      file: format,
      size: result.sizeLabel,
      description: draftDoc.description,
      operation,
      sectionIds: sections,
      layout,
      language,
      detailLevel,
      includeMap,
      showLayers,
    };
    setRows((current) => {
      if (editingId) return current.map((item) => (item.id === editingId ? next : item));
      return [next, ...current];
    });
    setSelectedId(next.id);
    setEditingId(null);
    setDetailTab("overview");
    setView("detail");
  }

  function downloadSelected() {
    if (!selected || selected.status !== "COMPLETED") return;
    const result = downloadReport(recordToDoc(selected));
    setRows((current) =>
      current.map((item) => (item.id === selected.id ? { ...item, size: result.sizeLabel } : item)),
    );
  }

  if (view === "create") {
    return (
      <div className="rpt2-page">
        <header className="rpt2-create-head">
          <button
            type="button"
            className="rpt2-back"
            onClick={() => {
              if (editingId) {
                setEditingId(null);
                setView("detail");
                return;
              }
              setView("list");
            }}
          >
            <Icon name="arrow" size={14} />
          </button>
          <div className="rpt2-create-title">
            <span className="rpt2-create-eyebrow">{isEditing ? "Edit mode" : "New report"}</span>
            <h1>{isEditing ? "Edit Report" : "Create Report"}</h1>
            <p>
              {isEditing
                ? "Update report settings, sections, and export options."
                : "Build a structured export from operational data."}
            </p>
          </div>
        </header>

        <nav className="rpt2-steps" aria-label="Create report steps">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === step ? "on" : index < step ? "done" : ""}
              onClick={() => setStep(index)}
            >
              <i>{index + 1}</i>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="rpt2-panel">
          {step === 0 ? (
            <>
              <header className="rpt2-panel-head">
                <h2>Select Report Type</h2>
                <p>Choose the category that best matches this export.</p>
              </header>
              <div className="rpt2-type-grid">
                {REPORT_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rpt2-type-card ${item.tone}${typeId === item.id ? " on" : ""}`}
                    onClick={() => {
                      setTypeId(item.id);
                      setName(`${item.label} Report`);
                    }}
                  >
                    <span><Icon name={item.icon} size={18} /></span>
                    <strong>{item.label} Report</strong>
                    <small>{item.hint}</small>
                    {typeId === item.id ? <em className="rpt2-check"><Icon name="check" size={12} /></em> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <header className="rpt2-panel-head">
                <h2>Configuration</h2>
                <p>Set report identity, linked operation, and period.</p>
              </header>
              <div className="rpt2-form">
                <label>
                  <span>Report Name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Operation Alpha - Daily Report" />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Optional notes for this report..."
                  />
                </label>
                <label>
                  <span>Operation</span>
                  <select value={operation} onChange={(event) => setOperation(event.target.value)}>
                    {REPORT_OPERATIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Report Period</span>
                  <div className="rpt2-period">
                    <CalendarRange
                      from={periodFrom}
                      to={periodTo}
                      onChange={(nextFrom, nextTo) => {
                        setPeriodFrom(nextFrom);
                        setPeriodTo(nextTo);
                      }}
                    />
                  </div>
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <header className="rpt2-panel-head">
                <h2>Data Selection</h2>
                <p>Choose which sections are included in the report.</p>
              </header>
              <ul className="rpt2-section-list">
                {REPORT_SECTIONS.map((item) => {
                  const checked = sections.includes(item.id);
                  return (
                    <li key={item.id}>
                      <label className={checked ? "on" : ""}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSection(item.id)} />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.hint}</small>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <header className="rpt2-panel-head">
                <h2>Options</h2>
                <p>Configure output format, layout, and map settings.</p>
              </header>
              <div className="rpt2-options">
                <fieldset>
                  <legend>Output Format</legend>
                  <label className={format === "PDF" ? "on" : ""}>
                    <input type="radio" name="format" checked={format === "PDF"} onChange={() => setFormat("PDF")} />
                    <span>
                      <strong>PDF</strong>
                      <small>Recommended for briefings</small>
                    </span>
                  </label>
                  <label className={format === "CSV" ? "on" : ""}>
                    <input type="radio" name="format" checked={format === "CSV"} onChange={() => setFormat("CSV")} />
                    <span>
                      <strong>CSV</strong>
                      <small>Raw tabular export</small>
                    </span>
                  </label>
                </fieldset>
                <fieldset>
                  <legend>Layout</legend>
                  <label className={layout === "Standard" ? "on" : ""}>
                    <input type="radio" name="layout" checked={layout === "Standard"} onChange={() => setLayout("Standard")} />
                    <span>
                      <strong>Standard</strong>
                      <small>Full spacing and maps</small>
                    </span>
                  </label>
                  <label className={layout === "Compact" ? "on" : ""}>
                    <input type="radio" name="layout" checked={layout === "Compact"} onChange={() => setLayout("Compact")} />
                    <span>
                      <strong>Compact</strong>
                      <small>Dense printable layout</small>
                    </span>
                  </label>
                </fieldset>
                <div className="rpt2-toggles">
                  <label>
                    <input type="checkbox" checked={includeMap} onChange={() => setIncludeMap((value) => !value)} />
                    <span>Include map visualization</span>
                  </label>
                  <label>
                    <input type="checkbox" checked={showLayers} onChange={() => setShowLayers((value) => !value)} />
                    <span>Show groups, personnel and geofences</span>
                  </label>
                </div>
                <div className="rpt2-form-row">
                  <label>
                    <span>Data Detail Level</span>
                    <select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value)}>
                      <option>Summary</option>
                      <option>Standard</option>
                      <option>Detailed</option>
                    </select>
                  </label>
                  <label>
                    <span>Language</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                      <option>English</option>
                      <option>Bahasa Indonesia</option>
                    </select>
                  </label>
                </div>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <header className="rpt2-panel-head">
                <div>
                  <h2>Document Preview</h2>
                  <p>
                    {format === "PDF"
                      ? "Preview of the PDF document page. Download creates a real .pdf file."
                      : "Preview of the CSV spreadsheet. Download creates a real .csv file."}
                  </p>
                </div>
                <button type="button" className="rpt2-ghost" onClick={() => downloadReport(draftDoc)}>
                  <Icon name="download" size={14} />
                  Download {format}
                </button>
              </header>
              <div className="rpt2-preview">
                <aside>
                  <h3>Export summary</h3>
                  <ul>
                    {REPORT_SECTIONS.filter((item) => sections.includes(item.id)).map((item) => (
                      <li key={item.id}>
                        <Icon name="check" size={12} />
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  <dl>
                    <div><dt>Type</dt><dd>{selectedType.label}</dd></div>
                    <div><dt>Operation</dt><dd>{operation}</dd></div>
                    <div><dt>Format</dt><dd>{format} · {layout}</dd></div>
                    <div><dt>Period</dt><dd>{prettyPeriod(periodFrom, periodTo)}</dd></div>
                    <div><dt>Est. size</dt><dd>{estimateSizeLabel(format)}</dd></div>
                  </dl>
                </aside>
                <ReportPreview doc={draftDoc} />
              </div>
            </>
          ) : null}
        </section>

        <footer className="rpt2-create-actions">
          <button type="button" className="rpt2-ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="rpt2-primary" onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}>
              Next
            </button>
          ) : (
            <div className="rpt2-create-final">
              <button type="button" className="rpt2-ghost" onClick={() => downloadReport(draftDoc)}>
                <Icon name="download" size={14} />
                Download {format}
              </button>
              <button type="button" className="rpt2-primary" onClick={() => saveReport(!isEditing)}>
                <Icon name="check" size={14} />
                {isEditing ? "Save changes" : "Save & Download"}
              </button>
            </div>
          )}
        </footer>
      </div>
    );
  }

  if (view === "detail" && selected) {
    return (
      <div className="rpt2-page">
        <header className="rpt2-detail-head">
          <div className="rpt2-detail-title">
            <button type="button" className="rpt2-back" onClick={() => setView("list")}>
              <Icon name="arrow" size={14} />
            </button>
            <div>
              <div className="rpt2-title-row">
                <h1>{selected.name}</h1>
                <em className={`rpt2-pill ${statusClass(selected.status)}`}>{selected.status}</em>
              </div>
              <p>{selected.description}</p>
            </div>
          </div>
          <div className="rpt2-detail-actions">
            <button
              type="button"
              className="rpt2-ghost"
              disabled={selected.status === "PROCESSING"}
              onClick={() => openEdit(selected.id)}
            >
              <Icon name="pencil" size={14} />
              Edit
            </button>
            <button
              type="button"
              className="rpt2-primary"
              disabled={selected.status !== "COMPLETED"}
              onClick={downloadSelected}
            >
              <Icon name="download" size={14} />
              Download {selected.file}
            </button>
          </div>
        </header>

        <nav className="rpt2-tabs">
          <button type="button" className={detailTab === "overview" ? "on" : ""} onClick={() => setDetailTab("overview")}>Overview</button>
          <button type="button" className={detailTab === "content" ? "on" : ""} onClick={() => setDetailTab("content")}>Document</button>
        </nav>

        <div className="rpt2-detail-grid">
          <section className="rpt2-panel">
            <h2>Report Information</h2>
            <dl className="rpt2-meta">
              <div><dt>Name</dt><dd>{selected.name}</dd></div>
              <div><dt>Type</dt><dd><em className={`rpt2-type ${typeTone(selected.typeId)}`}>{selected.typeLabel}</em></dd></div>
              <div><dt>Description</dt><dd>{selected.description}</dd></div>
              <div><dt>Operation</dt><dd>{selected.operation}</dd></div>
              <div><dt>Period</dt><dd>{selected.period}</dd></div>
              <div><dt>Generated By</dt><dd>{selected.generatedBy}</dd></div>
              <div><dt>Generated At</dt><dd>{selected.generatedAt}</dd></div>
              <div><dt>File</dt><dd>{selected.file} · {selected.size}</dd></div>
            </dl>
          </section>

          <section className="rpt2-panel rpt2-detail-preview">
            <header className="rpt2-panel-head">
              <div>
                <h2>{selected.file === "CSV" ? "CSV Preview" : "PDF Preview"}</h2>
                <p>
                  {selected.status === "COMPLETED"
                    ? `Document preview · download saves a real ${selected.file} file.`
                    : "Preview unavailable until the report is completed."}
                </p>
              </div>
            </header>
            {selected.status === "COMPLETED" ? (
              <ReportPreview
                doc={recordToDoc(selected)}
                mode={detailTab === "content" || selected.file === "CSV" ? "sheet" : "paper"}
              />
            ) : (
              <p className="rpt2-empty">This report has no downloadable document yet.</p>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="rpt2-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="chart" size={15} /></span>
        <div>
          <h1>Reports</h1>
          <p>Generate and manage operational, personnel, and system reports.</p>
        </div>
        <button type="button" className="rpt2-primary" onClick={() => openCreate()}>
          <Icon name="plus" size={14} />
          Create Report
        </button>
      </header>

      <section className="rpt2-cats" aria-label="Report categories">
        {REPORT_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rpt2-cat ${item.tone}${category === item.id ? " on" : ""}`}
            onClick={() => setCategory((current) => (current === item.id ? "all" : item.id))}
            onDoubleClick={() => openCreate(item.id)}
          >
            <span><Icon name={item.icon} size={16} /></span>
            <strong>{item.label}</strong>
            <small>{item.hint}</small>
          </button>
        ))}
      </section>

      <section className="rpt2-filters">
        <label className="rpt2-search">
          <Icon name="search" size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search report name..."
          />
        </label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {TYPE_OPTS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          {STATUS_OPTS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="rpt2-period">
          <CalendarRange from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
        </div>
        <button type="button" className="rpt2-reset" onClick={resetFilters}>Reset</button>
      </section>

      <section className="rpt2-table-card">
        <div className="rpt2-table-wrap">
          <table className="rpt2-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Report Name</th>
                <th>Type</th>
                <th>Generated By</th>
                <th>Generated At</th>
                <th>Period</th>
                <th>Status</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id} onClick={() => openDetail(item.id)}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.operation}</small>
                  </td>
                  <td><em className={`rpt2-type ${typeTone(item.typeId)}`}>{item.typeLabel}</em></td>
                  <td>{item.generatedBy}</td>
                  <td>{item.generatedAt}</td>
                  <td>{item.period}</td>
                  <td><em className={`rpt2-pill ${statusClass(item.status)}`}>{item.status}</em></td>
                  <td>
                    <span className="rpt2-file">
                      <Icon name="download" size={13} />
                      {item.file}
                      <small>{item.size}</small>
                    </span>
                  </td>
                  <td className="rpt2-actions-cell" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="rpt2-more"
                      aria-label={`Actions for ${item.name}`}
                      aria-expanded={menuId === item.id}
                      onClick={() => setMenuId((current) => (current === item.id ? null : item.id))}
                    >
                      <Icon name="more" size={14} />
                    </button>
                    {menuId === item.id ? (
                      <div className="rpt2-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => openDetail(item.id)}>Open</button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={item.status === "PROCESSING"}
                          onClick={() => openEdit(item.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={item.status !== "COMPLETED"}
                          onClick={() => {
                            setMenuId(null);
                            downloadReport(recordToDoc(item));
                          }}
                        >
                          Download
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={9} className="rpt2-empty">No reports match the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
