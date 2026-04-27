"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { THEMES, type OrgProject } from "@/lib/org-chart";

import { TreeNode } from "@/components/tree-node";

type ProjectEditorProps = {
  activeProject: OrgProject;
  nodeCount: number;
  onGoHome: () => void;
  onProjectNameChange: (nextName: string) => void;
  onThemeChange: (nextTheme: string) => void;
  onImportClick: () => void;
  onExportProject: () => void;
  onPrint: () => void;
  onNodeFieldChange: (nodeId: string, field: "name" | "title", value: string) => void;
  onOpenMenu: (nodeId: string, x: number, y: number, depth: number) => void;
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;
const ZOOM_FACTOR = 1.15;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function ProjectEditor({
  activeProject,
  nodeCount,
  onGoHome,
  onProjectNameChange,
  onThemeChange,
  onImportClick,
  onExportProject,
  onPrint,
  onNodeFieldChange,
  onOpenMenu,
}: ProjectEditorProps) {
  const chartViewportRef = useRef<HTMLDivElement | null>(null);
  const chartContentRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const contentElement = chartContentRef.current;
    if (!contentElement) {
      return;
    }

    let frameId = 0;
    const syncChartSize = () => {
      const width = Math.max(contentElement.scrollWidth, contentElement.offsetWidth);
      const height = Math.max(contentElement.scrollHeight, contentElement.offsetHeight);

      setChartSize((current) => {
        if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) {
          return current;
        }

        return { width, height };
      });
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncChartSize);
    };

    scheduleSync();
    window.addEventListener("resize", scheduleSync);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleSync);
      observer.observe(contentElement);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleSync);
      observer?.disconnect();
    };
  }, [activeProject.id, nodeCount]);

  const zoomFrameStyle =
    chartSize.width > 0 && chartSize.height > 0
      ? ({
          width: `${Math.max(1, chartSize.width * zoom)}px`,
          height: `${Math.max(1, chartSize.height * zoom)}px`,
        } as CSSProperties)
      : undefined;
  const zoomContentStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: "top left",
  } as CSSProperties;

  const handleZoomIn = () => {
    setZoom((currentZoom) => clampZoom(currentZoom * ZOOM_FACTOR));
  };

  const handleZoomOut = () => {
    setZoom((currentZoom) => clampZoom(currentZoom / ZOOM_FACTOR));
  };

  const handleZoomToFit = () => {
    const viewportElement = chartViewportRef.current;
    if (!viewportElement || chartSize.width <= 0 || chartSize.height <= 0) {
      return;
    }

    const widthScale = Math.max(
      0.05,
      (viewportElement.clientWidth - 16) / chartSize.width,
    );
    const heightScale = Math.max(
      0.05,
      (viewportElement.clientHeight - 16) / chartSize.height,
    );

    setZoom(clampZoom(Math.min(widthScale, heightScale)));
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="editor-workspace flex min-h-0 flex-1 flex-col">
      <header className="editor-toolbar print-hidden rounded-t-[14px] border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-3 shadow-sm md:px-4 md:py-3">
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
          <button
            type="button"
            className="secondary-btn inline-flex h-9 w-9 items-center justify-center px-0"
            onClick={onGoHome}
            title="Home"
            aria-label="Home"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="h-4 w-4 fill-current">
              <path d="M10 2.7 2.7 8.9a1 1 0 1 0 1.3 1.52l.95-.81V16a1 1 0 0 0 1 1h2.8a1 1 0 0 0 1-1v-3.2h1.6V16a1 1 0 0 0 1 1h2.8a1 1 0 0 0 1-1V9.61l.95.81a1 1 0 0 0 1.3-1.52L10.65 2.7a1 1 0 0 0-1.3 0Z" />
            </svg>
          </button>
          <input
            className="min-w-[220px] flex-1 rounded-lg border border-[var(--panel-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--main-text)] outline-none ring-[var(--accent-color)] focus:ring-2"
            value={activeProject.name}
            onChange={(event) => {
              onProjectNameChange(event.target.value);
            }}
            placeholder="Project name"
          />
          <select
            className="rounded-lg border border-[var(--panel-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--main-text)] outline-none ring-[var(--accent-color)] focus:ring-2"
            value={activeProject.themeId}
            onChange={(event) => {
              onThemeChange(event.target.value);
            }}
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <button className="secondary-btn" onClick={onImportClick}>
            Import JSON
          </button>
          <button className="secondary-btn" onClick={onExportProject}>
            Export Project
          </button>
          <button className="primary-btn" onClick={onPrint}>
            Print / Save PDF
          </button>
        </div>
      </header>

      <section
        className="chart-surface relative min-h-0 flex-1 border border-t-0 p-3 md:p-4"
        id="chart-print-area"
      >
        <div className="zoom-controls print-hidden" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="zoom-icon-btn"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M4 10a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" />
            </svg>
          </button>
          <button
            type="button"
            className="zoom-icon-btn"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
          <button
            type="button"
            className="zoom-icon-btn"
            onClick={handleZoomToFit}
            title="Zoom to fit"
            aria-label="Zoom to fit"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M4 4h5v2H6v3H4V4Zm7 0h5v5h-2V6h-3V4ZM4 11h2v3h3v2H4v-5Zm10 0h2v5h-5v-2h3v-3Z" />
            </svg>
          </button>
          <span className="zoom-percent" aria-live="polite">
            {zoomPercent}%
          </span>
        </div>
        <div className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-text)]">
          {nodeCount} nodes in this chart
        </div>
        <div ref={chartViewportRef} className="chart-viewport">
          <div className="chart-print-scale">
            <div className="chart-zoom-frame" style={zoomFrameStyle}>
              <div
                ref={chartContentRef}
                className="chart-content min-w-max pb-4"
                style={zoomContentStyle}
              >
                <ul className="org-tree-root">
                  <TreeNode
                    node={activeProject.root}
                    depth={1}
                    onNodeFieldChange={onNodeFieldChange}
                    onOpenMenu={onOpenMenu}
                  />
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
