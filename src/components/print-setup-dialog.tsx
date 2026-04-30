"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ChartDimensions,
  type PaperSizeId,
  type PrintHorizontalAlign,
  type PrintOrientation,
  type PrintScaleMode,
  type PrintSettings,
  type PrintVerticalAlign,
  computePrintLayout,
  getPaperDimensionsMm,
  PAPER_SIZE_OPTIONS,
  PRINT_PAGE_MARGIN_MM,
} from "@/lib/print-layout";

interface PrintSetupDialogProps {
  open: boolean;
  settings: PrintSettings;
  chartDimensions: ChartDimensions | null;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: PrintSettings) => void;
  onConfirmPrint: () => void;
}

export function PrintSetupDialog({
  open,
  settings,
  chartDimensions,
  onOpenChange,
  onSettingsChange,
  onConfirmPrint,
}: PrintSetupDialogProps) {
  const previewChartDimensions = chartDimensions ?? {
    widthPx: 1200,
    heightPx: 700,
  };
  const previewLayout = computePrintLayout(previewChartDimensions, settings);
  const previewPaperDimensions = getPaperDimensionsMm(settings);
  const previewPrintableArea = previewLayout.printableArea;
  const previewScale = previewLayout.scale;
  const previewScaledChartWidthPx = previewLayout.scaledChart.widthPx;
  const previewScaledChartHeightPx = previewLayout.scaledChart.heightPx;
  const previewOverflowX =
    previewScaledChartWidthPx > previewPrintableArea.widthPx + 0.5;
  const previewOverflowY =
    previewScaledChartHeightPx > previewPrintableArea.heightPx + 0.5;
  const previewPaperFit = Math.min(
    240 / previewPaperDimensions.widthMm,
    150 / previewPaperDimensions.heightMm,
  );
  const previewPaperWidth = previewPaperDimensions.widthMm * previewPaperFit;
  const previewPaperHeight = previewPaperDimensions.heightMm * previewPaperFit;
  const previewMarginX =
    (PRINT_PAGE_MARGIN_MM / previewPaperDimensions.widthMm) * previewPaperWidth;
  const previewMarginY =
    (PRINT_PAGE_MARGIN_MM / previewPaperDimensions.heightMm) * previewPaperHeight;
  const previewPrintableWidth = Math.max(1, previewPaperWidth - previewMarginX * 2);
  const previewPrintableHeight = Math.max(
    1,
    previewPaperHeight - previewMarginY * 2,
  );
  const previewScaleX =
    previewPrintableWidth / Math.max(1, previewPrintableArea.widthPx);
  const previewScaleY =
    previewPrintableHeight / Math.max(1, previewPrintableArea.heightPx);
  const previewChartWidth = Math.max(2, previewScaledChartWidthPx * previewScaleX);
  const previewChartHeight = Math.max(
    2,
    previewScaledChartHeightPx * previewScaleY,
  );
  const previewChartOffsetX = previewLayout.offsetX * previewScaleX;
  const previewChartOffsetY = previewLayout.offsetY * previewScaleY;
  const previewScalePercent = Math.round(previewScale * 100);

  const updateSettings = (next: Partial<PrintSettings>) => {
    onSettingsChange({
      ...settings,
      ...next,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-180">
        <DialogHeader>
          <DialogTitle>Print Setup</DialogTitle>
          <DialogDescription>
            Choose paper size, orientation, scale, and chart placement before
            printing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">Paper Size</span>
            <Select
              value={settings.paperSize}
              onValueChange={(nextSize) => {
                updateSettings({
                  paperSize: nextSize as PaperSizeId,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_SIZE_OPTIONS).map(([id, sizeOption]) => (
                  <SelectItem key={id} value={id}>
                    {sizeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">Orientation</span>
            <Select
              value={settings.orientation}
              onValueChange={(nextOrientation) => {
                updateSettings({
                  orientation: nextOrientation as PrintOrientation,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">Scale Mode</span>
            <Select
              value={settings.scaleMode}
              onValueChange={(nextMode) => {
                updateSettings({
                  scaleMode: nextMode as PrintScaleMode,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scale mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fit">Fit Width + Height</SelectItem>
                <SelectItem value="fit-width">Fit Width</SelectItem>
                <SelectItem value="fit-height">Fit Height</SelectItem>
                <SelectItem value="custom">Custom %</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">
              Horizontal Position
            </span>
            <Select
              value={settings.horizontalAlign}
              onValueChange={(nextAlign) => {
                updateSettings({
                  horizontalAlign: nextAlign as PrintHorizontalAlign,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select horizontal position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">
              Vertical Position
            </span>
            <Select
              value={settings.verticalAlign}
              onValueChange={(nextAlign) => {
                updateSettings({
                  verticalAlign: nextAlign as PrintVerticalAlign,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vertical position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-[--muted-text]">
              Legend On Print
            </span>
            <Select
              value={settings.showLegendOnPrint === false ? "hide" : "show"}
              onValueChange={(nextValue) => {
                updateSettings({
                  showLegendOnPrint: nextValue === "show",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select legend visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="show">Show</SelectItem>
                <SelectItem value="hide">Hide</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        {settings.scaleMode === "custom" ? (
          <label className="mt-4 grid gap-2 text-sm">
            <span className="font-semibold text-[--muted-text]">Scale Percent</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={200}
                value={settings.customScalePercent}
                onChange={(event) => {
                  const nextPercent = Number.parseInt(event.target.value, 10);
                  updateSettings({
                    customScalePercent: Math.max(10, Math.min(200, nextPercent)),
                  });
                }}
                className="flex-1"
              />
              <input
                type="number"
                min={10}
                max={200}
                value={settings.customScalePercent}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  const nextPercent = Number.isFinite(parsed) ? parsed : 100;
                  updateSettings({
                    customScalePercent: Math.max(10, Math.min(200, nextPercent)),
                  });
                }}
                className="w-20 rounded-lg border border-[--panel-border] bg-white px-2 py-1 font-semibold text-[--main-text] outline-none ring-[--accent-color] focus:ring-2"
              />
              <span className="text-xs font-semibold text-[--muted-text]">%</span>
            </div>
          </label>
        ) : null}

        <div className="mt-4 grid gap-3 rounded-lg border border-[--panel-border] bg-[--button-muted] p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[--muted-text]">
            <span>Preview</span>
            <span>Computed Scale: {previewScalePercent}%</span>
          </div>
          <div className="flex items-center justify-center rounded-md border border-dashed border-[--panel-border] bg-white/80 p-3">
            <div
              className="relative rounded-sm border-2 border-[#4f4f4f] bg-white shadow-sm"
              style={{
                width: `${previewPaperWidth}px`,
                height: `${previewPaperHeight}px`,
              }}
            >
              <div
                className="absolute border border-dashed border-[#939393]"
                style={{
                  left: `${previewMarginX}px`,
                  top: `${previewMarginY}px`,
                  width: `${previewPrintableWidth}px`,
                  height: `${previewPrintableHeight}px`,
                }}
              />
              <div
                className="absolute overflow-hidden"
                style={{
                  left: `${previewMarginX}px`,
                  top: `${previewMarginY}px`,
                  width: `${previewPrintableWidth}px`,
                  height: `${previewPrintableHeight}px`,
                }}
              >
                <div
                  className="absolute rounded-sm border border-[#1566cc] bg-[#1566cc]/18"
                  style={{
                    left: `${previewChartOffsetX}px`,
                    top: `${previewChartOffsetY}px`,
                    width: `${previewChartWidth}px`,
                    height: `${previewChartHeight}px`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--muted-text]">
            <span>
              Chart: {Math.round(previewChartDimensions.widthPx)} x{" "}
              {Math.round(previewChartDimensions.heightPx)} px
            </span>
            <span>
              Paper: {PAPER_SIZE_OPTIONS[settings.paperSize].label}{" "}
              {settings.orientation}
            </span>
            <span>
              Position: {settings.verticalAlign} {settings.horizontalAlign}
            </span>
            {previewOverflowX || previewOverflowY ? (
              <span className="font-semibold text-[#b73333]">
                Warning: clipped in preview
              </span>
            ) : (
              <span className="font-semibold text-[#226b33]">Fits page</span>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[--panel-border] bg-white px-4 text-sm font-semibold text-[--main-text] transition-colors hover:bg-[--button-muted]"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={onConfirmPrint}
            className="primary-btn min-w-30"
          >
            Print
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
