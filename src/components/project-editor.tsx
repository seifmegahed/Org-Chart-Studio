"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MAX_SPREAD_TILL_LEVEL,
  MIN_SPREAD_TILL_LEVEL,
  THEMES,
  type ChartLegend,
  type OrgProject,
} from "@/lib/org-chart";

import { TreeNode } from "@/components/tree-node";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Home, Printer, Upload } from "lucide-react";
import Image from "next/image";

type ProjectEditorProps = {
  activeProject: OrgProject;
  nodeCount: number;
  onGoHome: () => void;
  onProjectNameChange: (nextName: string) => void;
  onThemeChange: (nextTheme: string) => void;
  onSpreadTillLevelChange: (nextLevel: number) => void;
  onImportClick: () => void;
  onExportProject: () => void;
  onPrint: () => void;
  onNodeFieldChange: (
    nodeId: string,
    field: "name" | "title",
    value: string,
  ) => void;
  onLegendFieldChange: (field: keyof ChartLegend, value: string) => void;
  onOpenMenu: (nodeId: string, x: number, y: number, depth: number) => void;
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;
const ZOOM_FACTOR = 1.1;
const DEEP_LEVEL_LEFT_ANCHOR_INSET = 18;
const DEEP_LEVEL_PARENT_LINE_OFFSET = 5;
const DEEP_LEVEL_CHILD_LINE_OFFSET = 10;
const TITLE_MAX_LENGTH = 20;
const MEMBER_NAME_MAX_LENGTH = 30;

type PrintNodeShape = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  title: string;
  names: string[];
};

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function splitMemberLines(value: string): string[] {
  const lines = value
    .split("\n")
    .map((line) => line.slice(0, MEMBER_NAME_MAX_LENGTH));

  if (lines.length === 0) {
    return ["New Member"];
  }

  const allBlank = lines.every((line) => line.trim().length === 0);
  return allBlank ? ["New Member"] : lines;
}

export function ProjectEditor({
  activeProject,
  nodeCount,
  onGoHome,
  onProjectNameChange,
  onThemeChange,
  onSpreadTillLevelChange,
  onImportClick,
  onExportProject,
  onPrint,
  onNodeFieldChange,
  onLegendFieldChange,
  onOpenMenu,
}: ProjectEditorProps) {
  const chartViewportRef = useRef<HTMLDivElement | null>(null);
  const chartContentRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [connectorCanvasSize, setConnectorCanvasSize] = useState({
    width: 0,
    height: 0,
  });
  const [connectorPaths, setConnectorPaths] = useState<string[]>([]);
  const [printNodeShapes, setPrintNodeShapes] = useState<PrintNodeShape[]>([]);

  const nodeTextMap = useMemo(() => {
    const textMap = new Map<string, { title: string; names: string[] }>();
    const stack = [activeProject.root];

    while (stack.length > 0) {
      const currentNode = stack.pop();
      if (!currentNode) {
        continue;
      }

      textMap.set(currentNode.id, {
        title: (currentNode.title.trim() || "Role").slice(0, TITLE_MAX_LENGTH),
        names: splitMemberLines(currentNode.name),
      });

      currentNode.children.forEach((childNode) => {
        stack.push(childNode);
      });
    }

    return textMap;
  }, [activeProject.root]);

  useEffect(() => {
    const contentElement = chartContentRef.current;
    if (!contentElement) {
      return;
    }

    let frameId = 0;
    const syncChartSize = () => {
      const width = Math.max(
        contentElement.scrollWidth,
        contentElement.offsetWidth,
      );
      const height = Math.max(
        contentElement.scrollHeight,
        contentElement.offsetHeight,
      );

      setChartSize((current) => {
        if (
          Math.abs(current.width - width) < 0.5 &&
          Math.abs(current.height - height) < 0.5
        ) {
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

  useEffect(() => {
    const contentElement = chartContentRef.current;
    if (!contentElement) {
      return;
    }

    let frameId = 0;
    const syncConnectors = () => {
      const width = Math.max(
        contentElement.scrollWidth,
        contentElement.offsetWidth,
      );
      const height = Math.max(
        contentElement.scrollHeight,
        contentElement.offsetHeight,
      );

      const rootList = contentElement.querySelector<HTMLElement>(".org-tree-root");
      if (!rootList) {
        setConnectorCanvasSize({ width, height });
        setConnectorPaths([]);
        setPrintNodeShapes([]);
        return;
      }

      const contentRect = contentElement.getBoundingClientRect();
      const scaleX = Math.max(
        0.0001,
        contentRect.width / Math.max(1, contentElement.scrollWidth),
      );
      const scaleY = Math.max(
        0.0001,
        contentRect.height / Math.max(1, contentElement.scrollHeight),
      );
      const nextPaths: string[] = [];
      const nextPrintNodeShapes: PrintNodeShape[] = [];
      const parentItems = rootList.querySelectorAll<HTMLLIElement>("li");

      parentItems.forEach((parentItem) => {
        const parentCard = parentItem.querySelector<HTMLElement>(
          ":scope > .node-card",
        );
        const parentDepth = Number(parentItem.dataset.nodeDepth ?? "0");
        const usesIndentedLeftAnchors =
          parentDepth >= activeProject.spreadTillLevel;
        if (parentCard) {
          const parentRect = parentCard.getBoundingClientRect();
          const headerElement = parentCard.querySelector<HTMLElement>(
            ":scope > .node-header",
          );
          const nodeId = parentItem.dataset.nodeId ?? "";
          const nodeText = nodeTextMap.get(nodeId);

          nextPrintNodeShapes.push({
            id: nodeId || `node-${nextPrintNodeShapes.length + 1}`,
            x: (parentRect.left - contentRect.left) / scaleX,
            y: (parentRect.top - contentRect.top) / scaleY,
            width: parentRect.width / scaleX,
            height: parentRect.height / scaleY,
            headerHeight: Math.min(
              parentRect.height / scaleY,
              (headerElement?.getBoundingClientRect().height ?? 0) / scaleY ||
                Math.min(62, (parentRect.height / scaleY) * 0.5),
            ),
            title: nodeText?.title ?? "Role",
            names: nodeText?.names ?? ["New Member"],
          });
        }

        const childList = parentItem.querySelector<HTMLOListElement | HTMLUListElement>(
          ":scope > ul",
        );

        if (!parentCard || !childList) {
          return;
        }

        const childCards = childList.querySelectorAll<HTMLElement>(
          ":scope > li > .node-card",
        );
        if (childCards.length === 0) {
          return;
        }

        const parentRect = parentCard.getBoundingClientRect();
        const parentLeft = (parentRect.left - contentRect.left) / scaleX;
        const parentWidth = parentRect.width / scaleX;
        const parentAnchorX = usesIndentedLeftAnchors
          ? parentLeft + DEEP_LEVEL_LEFT_ANCHOR_INSET
          : parentLeft + parentWidth / 2;
        const startX = usesIndentedLeftAnchors
          ? parentAnchorX - DEEP_LEVEL_PARENT_LINE_OFFSET
          : parentAnchorX;
        const startY = (parentRect.bottom - contentRect.top) / scaleY;

        childCards.forEach((childCard) => {
          const childRect = childCard.getBoundingClientRect();
          const childLeft = (childRect.left - contentRect.left) / scaleX;
          const childWidth = childRect.width / scaleX;
          const childTop = (childRect.top - contentRect.top) / scaleY;
          const childHeight = childRect.height / scaleY;
          const childAnchorX = usesIndentedLeftAnchors
            ? childLeft
            : childLeft + childWidth / 2;
          const childAnchorY = usesIndentedLeftAnchors
            ? childTop + childHeight / 2
            : childTop;

          if (childAnchorY <= startY) {
            return;
          }

          const midY = startY + (childAnchorY - startY) / 2;
          const endX = usesIndentedLeftAnchors
            ? childAnchorX - DEEP_LEVEL_CHILD_LINE_OFFSET
            : childAnchorX;
          const deltaX = Math.abs(endX - startX);
          const path = usesIndentedLeftAnchors
            ? deltaX < 0.5
              ? `M ${parentAnchorX} ${startY} H ${startX} V ${childAnchorY} H ${childAnchorX}`
              : `M ${parentAnchorX} ${startY} H ${startX} V ${midY} H ${endX} V ${childAnchorY} H ${childAnchorX}`
            : deltaX < 0.5
              ? `M ${startX} ${startY} V ${childAnchorY}`
              : `M ${startX} ${startY} V ${midY} H ${endX} V ${childAnchorY}`;

          nextPaths.push(path);
        });
      });

      setConnectorCanvasSize((current) => {
        if (
          Math.abs(current.width - width) < 0.5 &&
          Math.abs(current.height - height) < 0.5
        ) {
          return current;
        }

        return { width, height };
      });
      setConnectorPaths(nextPaths);
      setPrintNodeShapes(nextPrintNodeShapes);
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncConnectors);
    };

    scheduleSync();
    window.addEventListener("resize", scheduleSync);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleSync);
      observer.observe(contentElement);
      const rootList = contentElement.querySelector<HTMLElement>(".org-tree-root");
      if (rootList) {
        observer.observe(rootList);
      }
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleSync);
      observer?.disconnect();
    };
  }, [
    activeProject.id,
    activeProject.root,
    activeProject.spreadTillLevel,
    nodeCount,
    nodeTextMap,
    zoom,
  ]);

  const zoomFrameStyle =
    chartSize.width > 0 && chartSize.height > 0
      ? ({
          width: `${Math.max(1, chartSize.width * zoom)}px`,
          height: `${Math.max(1, chartSize.height * zoom)}px`,
        } as CSSProperties)
      : undefined;
  const zoomContentStyle = {
    width: `${Math.max(1, Math.ceil(connectorCanvasSize.width || chartSize.width || 1))}px`,
    height: `${Math.max(1, Math.ceil(connectorCanvasSize.height || chartSize.height || 1))}px`,
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
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="print-hidden border-b border-[--panel-border] bg-[--panel-bg] px-3 py-3 shadow-sm md:px-4 md:py-3">
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
          <button
            type="button"
            className="secondary-btn"
            onClick={onGoHome}
            title="Home"
            aria-label="Home"
          >
            <Home />
          </button>
          <input
            className="min-w-55 flex-1 rounded-lg border border-[--panel-border] bg-white px-3 py-2 text-sm font-semibold text-[--main-text] outline-none ring-[--accent-color] focus:ring-2"
            value={activeProject.name}
            onChange={(event) => {
              onProjectNameChange(event.target.value);
            }}
            placeholder="Project name"
          />
          <Select value={activeProject.themeId} onValueChange={onThemeChange}>
            <SelectTrigger className="w-46 flex-none">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-[--panel-border] bg-white px-2.5 py-1.5 text-xs font-semibold text-[--muted-text]">
            <span>Spread Till</span>
            <input
              type="number"
              min={MIN_SPREAD_TILL_LEVEL}
              max={MAX_SPREAD_TILL_LEVEL}
              value={activeProject.spreadTillLevel}
              onChange={(event) => {
                onSpreadTillLevelChange(Number.parseInt(event.target.value, 10));
              }}
              className="w-14 rounded-md border border-[--panel-border] bg-white px-1.5 py-0.5 text-right text-xs font-bold text-[--main-text] outline-none ring-[--accent-color] focus:ring-2"
              title="Depth where horizontal spread starts"
              aria-label="Spread till level"
            />
          </label>
          <button
            className="secondary-btn"
            onClick={onImportClick}
            title="Import"
            aria-label="Import"
          >
            <Upload />
          </button>
          <button
            className="secondary-btn"
            onClick={onExportProject}
            title="Export"
            aria-label="Export"
          >
            <Download />
          </button>
          <button
            className="primary-btn"
            onClick={onPrint}
            title="Print as PDF"
            aria-label="Print as PDF"
          >
            <Printer />
          </button>
        </div>
      </header>
      <section
        className="chart-surface relative min-h-0 flex-1"
        id="chart-print-area"
      >
        <div
          className="zoom-controls print-hidden p-4"
          role="group"
          aria-label="Zoom controls"
        >
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
        <div className="print-only px-4 pb-2 pt-4">
          <Image
            src="/INP%20Egypt%20logo%20full%20flat.svg"
            alt="INP Egypt logo"
            width={220}
            height={62}
            priority
          />
        </div>
        <div ref={chartViewportRef} className="chart-viewport">
          <div className="chart-print-scale">
            <div className="chart-zoom-frame" style={zoomFrameStyle}>
              <div
                ref={chartContentRef}
                className="chart-content chart-content--svg-connectors inline-block w-max pb-4"
                style={zoomContentStyle}
              >
                <svg
                  className="chart-connector-layer"
                  width={Math.max(1, Math.ceil(connectorCanvasSize.width))}
                  height={Math.max(1, Math.ceil(connectorCanvasSize.height))}
                  viewBox={`0 0 ${Math.max(1, Math.ceil(connectorCanvasSize.width))} ${Math.max(1, Math.ceil(connectorCanvasSize.height))}`}
                  aria-hidden="true"
                  focusable="false"
                >
                  {connectorPaths.map((path, index) => (
                    <path
                      key={`${index}-${path}`}
                      d={path}
                      fill="none"
                      stroke="var(--print-line-color, var(--line-color))"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
                <svg
                  className="chart-print-node-layer"
                  width={Math.max(1, Math.ceil(connectorCanvasSize.width))}
                  height={Math.max(1, Math.ceil(connectorCanvasSize.height))}
                  viewBox={`0 0 ${Math.max(1, Math.ceil(connectorCanvasSize.width))} ${Math.max(1, Math.ceil(connectorCanvasSize.height))}`}
                  aria-hidden="true"
                  focusable="false"
                >
                  {printNodeShapes.map((node) => {
                    const headerHeight = Math.max(1, node.headerHeight);
                    const bodyStartY = node.y + headerHeight;
                    const bodyHeight = Math.max(0, node.height - headerHeight);
                    const names = node.names.length > 0 ? node.names : ["New Member"];
                    const rowGap = 18;
                    const blockHeight = (Math.max(1, names.length) - 1) * rowGap;
                    const firstRowY = bodyStartY + Math.max(14, (bodyHeight - blockHeight) / 2);
                    const maxRowY = node.y + node.height - 10;
                    const iconCenterX = node.x + 19;
                    const iconScale = 0.62;
                    const iconSize = 24 * iconScale;
                    const headerRadius = Math.min(10, headerHeight / 2, node.width / 2);
                    const headerPath = `M ${node.x + headerRadius} ${node.y} H ${node.x + node.width - headerRadius} Q ${node.x + node.width} ${node.y} ${node.x + node.width} ${node.y + headerRadius} V ${node.y + headerHeight} H ${node.x} V ${node.y + headerRadius} Q ${node.x} ${node.y} ${node.x + headerRadius} ${node.y} Z`;

                    return (
                      <g key={node.id}>
                        <rect
                          x={node.x}
                          y={node.y}
                          width={node.width}
                          height={node.height}
                          rx="10"
                          ry="10"
                          fill="var(--node-bg)"
                          stroke="var(--print-node-border, var(--node-border))"
                          strokeWidth="1.2"
                        />
                        <path
                          d={headerPath}
                          fill="var(--accent-color)"
                        />
                        <line
                          x1={node.x}
                          y1={bodyStartY}
                          x2={node.x + node.width}
                          y2={bodyStartY}
                          stroke="var(--print-line-color, var(--line-color))"
                          strokeWidth="1.2"
                        />
                        <text
                          x={node.x + 12}
                          y={node.y + headerHeight / 2}
                          fill="#ffffff"
                          fontSize="14"
                          fontWeight="800"
                          dominantBaseline="middle"
                        >
                          {node.title}
                        </text>
                        {names.map((personName, personIndex) => {
                          const rowY = Math.min(maxRowY, firstRowY + personIndex * rowGap);
                          const displayName =
                            personName.trim().length > 0
                              ? personName
                              : personIndex === 0
                                ? "New Member"
                                : "Member";

                          return (
                            <g key={`${node.id}-person-${personIndex}`}>
                              <circle
                                cx={iconCenterX}
                                cy={rowY}
                                r={9.5}
                                fill="var(--accent-color)"
                                fillOpacity="0.18"
                              />
                              <path
                                d="M12 12.25a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.25Zm0 1.5c-4.29 0-7.75 2.43-7.75 5.43a.82.82 0 0 0 .82.82h13.86a.82.82 0 0 0 .82-.82c0-3-3.46-5.43-7.75-5.43Z"
                                transform={`translate(${iconCenterX - iconSize / 2} ${rowY - iconSize / 2}) scale(${iconScale})`}
                                fill="var(--accent-color)"
                              />
                              <text
                                x={node.x + 36}
                                y={rowY}
                                fill="var(--main-text)"
                                fontSize="13"
                                fontWeight="600"
                                dominantBaseline="middle"
                              >
                                {displayName}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
                <ul className="org-tree-root">
                  <TreeNode
                    node={activeProject.root}
                    depth={1}
                    spreadTillLevel={activeProject.spreadTillLevel}
                    onNodeFieldChange={onNodeFieldChange}
                    onOpenMenu={onOpenMenu}
                  />
                </ul>
              </div>
            </div>
          </div>
        </div>
        <aside
          className="chart-legend"
          aria-label="Chart legend"
          id="chart-legend"
        >
          <label>
            <span>Title</span>
            <input
              value={activeProject.legend.title}
              onChange={(event) => {
                onLegendFieldChange("title", event.target.value);
              }}
              placeholder="Chart title"
            />
          </label>
          <label>
            <span>Created By</span>
            <input
              value={activeProject.legend.createdBy}
              onChange={(event) => {
                onLegendFieldChange("createdBy", event.target.value);
              }}
              placeholder="Author"
            />
          </label>
          <label>
            <span>Revised By</span>
            <input
              value={activeProject.legend.revisedBy}
              onChange={(event) => {
                onLegendFieldChange("revisedBy", event.target.value);
              }}
              placeholder="Reviewer"
            />
          </label>
          <label>
            <span>Date</span>
            <input
              type="date"
              value={activeProject.legend.date}
              onChange={(event) => {
                onLegendFieldChange("date", event.target.value);
              }}
            />
          </label>
          <label>
            <span>Revision</span>
            <input
              value={activeProject.legend.revisionNumber}
              onChange={(event) => {
                onLegendFieldChange("revisionNumber", event.target.value);
              }}
              placeholder="1"
            />
          </label>
          <div className="chart-legend-row chart-legend-static">
            <span>Nodes</span>
            <span>{nodeCount}</span>
          </div>
        </aside>
      </section>
    </section>
  );
}
