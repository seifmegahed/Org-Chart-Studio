export type PaperSizeId =
  | "a0"
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6"
  | "tabloid"
  | "letter"
  | "legal"
  | "ledger"
  | "executive";

export type PrintOrientation = "portrait" | "landscape";
export type PrintScaleMode = "fit" | "fit-width" | "fit-height" | "custom";
export type PrintHorizontalAlign = "left" | "center" | "right";
export type PrintVerticalAlign = "top" | "center" | "bottom";

export interface PrintSettings {
  paperSize: PaperSizeId;
  orientation: PrintOrientation;
  scaleMode: PrintScaleMode;
  horizontalAlign: PrintHorizontalAlign;
  verticalAlign: PrintVerticalAlign;
  customScalePercent: number;
  showLegendOnPrint: boolean;
}

export interface ChartDimensions {
  widthPx: number;
  heightPx: number;
}

export interface PrintLayout {
  scale: number;
  offsetX: number;
  offsetY: number;
  printableArea: ChartDimensions;
  scaledChart: ChartDimensions;
}

const MM_TO_CSS_PX = 96 / 25.4;
export const PRINT_PAGE_MARGIN_MM = 8;
const MIN_PRINT_SCALE = 0.1;
const MAX_PRINT_SCALE = 2;
const DEFAULT_PRINT_SCALE_PERCENT = 100;
const PRINT_CHART_HORIZONTAL_RESERVED_PX = 8;
const PRINT_CHART_VERTICAL_RESERVED_PX = 96;

export const PAPER_SIZE_OPTIONS: Record<
  PaperSizeId,
  { label: string; widthMm: number; heightMm: number }
> = {
  a0: { label: "A0", widthMm: 841, heightMm: 1189 },
  a1: { label: "A1", widthMm: 594, heightMm: 841 },
  a2: { label: "A2", widthMm: 420, heightMm: 594 },
  a3: { label: "A3", widthMm: 297, heightMm: 420 },
  a4: { label: "A4", widthMm: 210, heightMm: 297 },
  a5: { label: "A5", widthMm: 148, heightMm: 210 },
  a6: { label: "A6", widthMm: 105, heightMm: 148 },
  tabloid: { label: "Tabloid", widthMm: 279.4, heightMm: 431.8 },
  letter: { label: "Letter", widthMm: 215.9, heightMm: 279.4 },
  legal: { label: "Legal", widthMm: 215.9, heightMm: 355.6 },
  ledger: { label: "Ledger", widthMm: 279.4, heightMm: 431.8 },
  executive: { label: "Executive", widthMm: 184.15, heightMm: 266.7 },
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: "a4",
  orientation: "landscape",
  scaleMode: "fit",
  horizontalAlign: "center",
  verticalAlign: "top",
  customScalePercent: DEFAULT_PRINT_SCALE_PERCENT,
  showLegendOnPrint: true,
};

export function getPaperDimensionsMm(settings: PrintSettings): {
  widthMm: number;
  heightMm: number;
} {
  const base = PAPER_SIZE_OPTIONS[settings.paperSize];
  if (settings.orientation === "landscape") {
    return {
      widthMm: Math.max(base.widthMm, base.heightMm),
      heightMm: Math.min(base.widthMm, base.heightMm),
    };
  }

  return {
    widthMm: Math.min(base.widthMm, base.heightMm),
    heightMm: Math.max(base.widthMm, base.heightMm),
  };
}

export function getPrintableAreaPx(settings: PrintSettings): {
  widthPx: number;
  heightPx: number;
} {
  const paper = getPaperDimensionsMm(settings);
  const printableWidthPx =
    (paper.widthMm - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_CSS_PX;
  const printableHeightPx =
    (paper.heightMm - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_CSS_PX;

  return {
    widthPx: Math.max(120, printableWidthPx - PRINT_CHART_HORIZONTAL_RESERVED_PX),
    heightPx: Math.max(120, printableHeightPx - PRINT_CHART_VERTICAL_RESERVED_PX),
  };
}

export function measureChartDimensions(chartContent: HTMLElement): ChartDimensions {
  return {
    widthPx: Math.max(chartContent.scrollWidth, chartContent.offsetWidth),
    heightPx: Math.max(chartContent.scrollHeight, chartContent.offsetHeight),
  };
}

export function computePrintScale(
  chartDimensions: ChartDimensions,
  settings: PrintSettings,
): number {
  const printableArea = getPrintableAreaPx(settings);
  const widthScale =
    printableArea.widthPx / Math.max(1, chartDimensions.widthPx);
  const heightScale =
    printableArea.heightPx / Math.max(1, chartDimensions.heightPx);

  let nextScale: number;
  switch (settings.scaleMode) {
    case "fit-width":
      nextScale = widthScale;
      break;
    case "fit-height":
      nextScale = heightScale;
      break;
    case "custom":
      nextScale = settings.customScalePercent / 100;
      break;
    case "fit":
    default:
      nextScale = Math.min(widthScale, heightScale);
      break;
  }

  if (!Number.isFinite(nextScale)) {
    return 1;
  }

  return Math.min(MAX_PRINT_SCALE, Math.max(MIN_PRINT_SCALE, nextScale));
}

function resolveHorizontalOffset(
  align: PrintHorizontalAlign,
  remainingWidth: number,
): number {
  switch (align) {
    case "center":
      return remainingWidth / 2;
    case "right":
      return remainingWidth;
    case "left":
    default:
      return 0;
  }
}

function resolveVerticalOffset(
  align: PrintVerticalAlign,
  remainingHeight: number,
): number {
  switch (align) {
    case "center":
      return remainingHeight / 2;
    case "bottom":
      return remainingHeight;
    case "top":
    default:
      return 0;
  }
}

export function computePrintLayout(
  chartDimensions: ChartDimensions,
  settings: PrintSettings,
): PrintLayout {
  const printableArea = getPrintableAreaPx(settings);
  const scale = computePrintScale(chartDimensions, settings);
  const scaledChart = {
    widthPx: chartDimensions.widthPx * scale,
    heightPx: chartDimensions.heightPx * scale,
  };
  const remainingWidth = printableArea.widthPx - scaledChart.widthPx;
  const remainingHeight = printableArea.heightPx - scaledChart.heightPx;

  return {
    scale,
    offsetX: resolveHorizontalOffset(settings.horizontalAlign, remainingWidth),
    offsetY: resolveVerticalOffset(settings.verticalAlign, remainingHeight),
    printableArea,
    scaledChart,
  };
}

export function buildPrintPageRule(settings: PrintSettings): string {
  const paper = getPaperDimensionsMm(settings);
  return `@media print { @page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: ${PRINT_PAGE_MARGIN_MM}mm; } }`;
}
