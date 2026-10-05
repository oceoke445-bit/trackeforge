"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  reportMetrics,
  reportTableRows,
  selectedSections,
  type ReportDocInput,
} from "./report-export";

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

function buildPdfPages(doc: ReportDocInput) {
  const sections = selectedSections(doc.sectionIds);
  const metrics = reportMetrics();
  const chunkSize = doc.layout === "Compact" ? 4 : 3;
  const sectionChunks: typeof sections[] = [];
  for (let index = 0; index < Math.max(sections.length, 1); index += chunkSize) {
    sectionChunks.push(sections.slice(index, index + chunkSize));
  }

  type Page =
    | { kind: "cover" }
    | { kind: "sections"; items: typeof sections; part: number; parts: number }
    | { kind: "map" };

  const pages: Page[] = [{ kind: "cover" }];
  sectionChunks.forEach((items, index) => {
    pages.push({ kind: "sections", items, part: index + 1, parts: sectionChunks.length });
  });
  if (doc.includeMap) pages.push({ kind: "map" });
  return { pages, metrics, sections };
}

export default function ReportPreview({
  doc,
  mode = "paper",
}: {
  doc: ReportDocInput;
  mode?: "paper" | "sheet";
}) {
  const rows = reportTableRows(doc);
  const showSheet = mode === "sheet" || doc.format === "CSV";
  const { pages, metrics } = useMemo(() => buildPdfPages(doc), [doc]);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(75);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState(false);

  useEffect(() => {
    setPage(1);
    setRotation(0);
  }, [doc.name, doc.format, doc.layout, doc.includeMap, doc.sectionIds.join("|")]);

  const totalPages = Math.max(pages.length, 1);
  const current = Math.min(Math.max(page, 1), totalPages);
  const active = pages[current - 1] ?? pages[0];
  const zoomValue = fit ? 100 : zoom;

  function changeZoom(next: number) {
    setFit(false);
    const clamped = Math.min(200, Math.max(50, next));
    const nearest = ZOOM_STEPS.reduce((best, step) =>
      Math.abs(step - clamped) < Math.abs(best - clamped) ? step : best,
    );
    setZoom(nearest);
  }

  const toolbar = (
    <div className="rpt2-viewer-bar" role="toolbar" aria-label="Document preview controls">
      <button type="button" className="rpt2-viewer-icon" aria-label="Document menu" title="Menu">
        <Icon name="menu" size={15} />
      </button>

      <div className="rpt2-viewer-page">
        <button
          type="button"
          className="rpt2-viewer-icon"
          aria-label="Previous page"
          disabled={current <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          <Icon name="chevron" size={14} />
        </button>
        <span>
          <input
            aria-label="Page number"
            value={current}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              setPage(Math.min(totalPages, Math.max(1, Math.round(next))));
            }}
          />
          <em>/ {totalPages}</em>
        </span>
        <button
          type="button"
          className="rpt2-viewer-icon next"
          aria-label="Next page"
          disabled={current >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>

      <button type="button" className="rpt2-viewer-icon" aria-label="Search" title="Search">
        <Icon name="search" size={14} />
      </button>

      <div className="rpt2-viewer-zoom">
        <button
          type="button"
          className="rpt2-viewer-icon"
          aria-label="Zoom out"
          disabled={zoomValue <= 50}
          onClick={() => changeZoom(zoomValue - 25)}
        >
          <span aria-hidden="true">−</span>
        </button>
        <select
          aria-label="Zoom level"
          value={fit ? "fit" : String(zoom)}
          onChange={(event) => {
            if (event.target.value === "fit") {
              setFit(true);
              return;
            }
            setFit(false);
            setZoom(Number(event.target.value));
          }}
        >
          <option value="fit">Fit</option>
          {ZOOM_STEPS.map((step) => (
            <option key={step} value={step}>{step}%</option>
          ))}
        </select>
        <button
          type="button"
          className="rpt2-viewer-icon"
          aria-label="Zoom in"
          disabled={zoomValue >= 200}
          onClick={() => changeZoom(zoomValue + 25)}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <button
        type="button"
        className={`rpt2-viewer-icon${fit ? " on" : ""}`}
        aria-label="Fit to page"
        title="Fit to page"
        onClick={() => setFit((value) => !value)}
      >
        <Icon name="monitor" size={14} />
      </button>
      <button
        type="button"
        className="rpt2-viewer-icon"
        aria-label="Rotate clockwise"
        title="Rotate"
        onClick={() => setRotation((value) => (value + 90) % 360)}
      >
        <Icon name="refresh" size={14} />
      </button>
      <button type="button" className="rpt2-viewer-icon" aria-label="More options" title="More">
        <Icon name="more" size={14} />
      </button>
    </div>
  );

  if (showSheet) {
    return (
      <div className="rpt2-viewer" aria-label="CSV document preview">
        {toolbar}
        <div className="rpt2-viewer-stage">
          <div
            className="rpt2-sheet"
            style={{ transform: `scale(${zoomValue / 100}) rotate(${rotation}deg)`, transformOrigin: "top center" }}
          >
            <header>
              <strong>{doc.name}.csv</strong>
              <small>{rows.length} rows · UTF-8</small>
            </header>
            <div className="rpt2-sheet-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Item</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.section}-${row.item}-${index}`}>
                      <td>{row.section}</td>
                      <td>{row.item}</td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rpt2-viewer" aria-label="PDF document preview">
      {toolbar}
      <div className="rpt2-viewer-stage">
        <div
          className={`rpt2-paper${doc.layout === "Compact" ? " compact" : ""}`}
          style={{
            transform: `scale(${zoomValue / 100}) rotate(${rotation}deg)`,
            transformOrigin: "top center",
          }}
        >
          <div className="rpt2-paper-page">
            {active?.kind === "cover" ? (
              <>
                <header className="rpt2-paper-banner">
                  <small>TRAXON TACTICAL OPS</small>
                  <h3>{doc.name}</h3>
                </header>
                <p className="rpt2-paper-lead">{doc.description || "Operational report document."}</p>
                <dl className="rpt2-paper-meta">
                  <div><dt>Type</dt><dd>{doc.typeLabel}</dd></div>
                  <div><dt>Operation</dt><dd>{doc.operation}</dd></div>
                  <div><dt>Period</dt><dd>{doc.period}</dd></div>
                  <div><dt>Generated</dt><dd>{doc.generatedBy} · {doc.generatedAt}</dd></div>
                  <div><dt>Language</dt><dd>{doc.language}</dd></div>
                  <div><dt>Detail</dt><dd>{doc.detailLevel} · {doc.layout}</dd></div>
                </dl>
                <section>
                  <h4>Key Metrics</h4>
                  <div className="rpt2-paper-metrics">
                    {metrics.map((item) => (
                      <article key={item.label}>
                        <strong>{item.value}</strong>
                        <small>{item.label}</small>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {active?.kind === "sections" ? (
              <>
                <header className="rpt2-paper-banner">
                  <small>SECTIONS · PART {active.part}/{active.parts}</small>
                  <h3>{doc.name}</h3>
                </header>
                <section>
                  <h4>Included Sections</h4>
                  <ol>
                    {active.items.map((item) => (
                      <li key={item.id}>
                        <strong>{item.label}</strong>
                        <span>{item.hint}</span>
                      </li>
                    ))}
                    {!active.items.length ? <li className="empty">No sections selected.</li> : null}
                  </ol>
                </section>
              </>
            ) : null}

            {active?.kind === "map" ? (
              <>
                <header className="rpt2-paper-banner">
                  <small>MAP VISUALIZATION</small>
                  <h3>{doc.name}</h3>
                </header>
                <section>
                  <h4>Operational Area</h4>
                  <div className="rpt2-paper-map tall">
                    <strong>Map page</strong>
                    <span>{doc.showLayers ? "Groups · Personnel · Geofences" : "Base map only"}</span>
                  </div>
                </section>
              </>
            ) : null}

            <footer>
              Generated by Traxon Reports · Confidential · Page {current} of {totalPages}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
