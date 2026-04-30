import {
  DEFAULT_PRINT_SETTINGS,
  type PrintSettings,
} from "@/lib/print-layout";

export type ThemeId =
  | "ocean"
  | "forest"
  | "sunset"
  | "midnight"
  | "inp"
  | "aurora"
  | "graphite"
  | "desert"
  | "ruby";

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  children: OrgNode[];
}

export interface OrgProject {
  id: string;
  name: string;
  themeId: ThemeId;
  spreadTillLevel: number;
  fontSizes: NodeFontSizes;
  printSettings: PrintSettings;
  windowZoom: number;
  root: OrgNode;
  legend: ChartLegend;
  createdAt: string;
  updatedAt: string;
}

export interface ChartLegend {
  title: string;
  createdBy: string;
  revisedBy: string;
  date: string;
  revisionNumber: string;
}

export interface NodeFontSizes {
  titlePx: number;
  namePx: number;
}

export const STORAGE_KEY = "org-chart-projects-v1";
export const LAST_PROJECT_KEY = "org-chart-last-project-v1";
export const EXPORT_VERSION = 1;
export const MENU_WIDTH = 196;
export const MENU_HEIGHT = 356;
export const MIN_SPREAD_TILL_LEVEL = 2;
export const MAX_SPREAD_TILL_LEVEL = 8;
export const DEFAULT_SPREAD_TILL_LEVEL = 3;
export const MIN_WINDOW_ZOOM = 0.35;
export const MAX_WINDOW_ZOOM = 2.4;
export const DEFAULT_WINDOW_ZOOM = 1;
export const MIN_TITLE_FONT_SIZE_PX = 12;
export const MAX_TITLE_FONT_SIZE_PX = 24;
export const DEFAULT_TITLE_FONT_SIZE_PX = 16;
export const MIN_NAME_FONT_SIZE_PX = 11;
export const MAX_NAME_FONT_SIZE_PX = 22;
export const DEFAULT_NAME_FONT_SIZE_PX = 14;

export const THEMES: { id: ThemeId; name: string }[] = [
  { id: "ocean", name: "Ocean" },
  { id: "forest", name: "Forest" },
  { id: "sunset", name: "Sunset" },
  { id: "midnight", name: "Midnight" },
  { id: "inp", name: "INP" },
  { id: "aurora", name: "Aurora" },
  { id: "graphite", name: "Graphite" },
  { id: "desert", name: "Desert" },
  { id: "ruby", name: "Ruby" },
];

function getRandomThemeId(): ThemeId {
  const index = Math.floor(Math.random() * THEMES.length);
  return THEMES[index]?.id ?? "ocean";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function looksLikeNodeInput(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "name" in value ||
    "title" in value ||
    "children" in value ||
    "id" in value
  );
}

function clonePrintSettings(settings: PrintSettings): PrintSettings {
  return {
    paperSize: settings.paperSize,
    orientation: settings.orientation,
    scaleMode: settings.scaleMode,
    horizontalAlign: settings.horizontalAlign,
    verticalAlign: settings.verticalAlign,
    customScalePercent: settings.customScalePercent,
  };
}

function normalizePrintSettings(value: unknown): PrintSettings {
  if (!isRecord(value)) {
    return clonePrintSettings(DEFAULT_PRINT_SETTINGS);
  }

  const paperSize =
    value.paperSize === "a0" ||
    value.paperSize === "a1" ||
    value.paperSize === "a2" ||
    value.paperSize === "a3" ||
    value.paperSize === "a4" ||
    value.paperSize === "a5" ||
    value.paperSize === "a6" ||
    value.paperSize === "tabloid" ||
    value.paperSize === "letter" ||
    value.paperSize === "legal" ||
    value.paperSize === "ledger" ||
    value.paperSize === "executive"
      ? value.paperSize
      : DEFAULT_PRINT_SETTINGS.paperSize;

  const orientation =
    value.orientation === "portrait" || value.orientation === "landscape"
      ? value.orientation
      : DEFAULT_PRINT_SETTINGS.orientation;

  const scaleMode =
    value.scaleMode === "fit" ||
    value.scaleMode === "fit-width" ||
    value.scaleMode === "fit-height" ||
    value.scaleMode === "custom"
      ? value.scaleMode
      : DEFAULT_PRINT_SETTINGS.scaleMode;

  const horizontalAlign =
    value.horizontalAlign === "left" ||
    value.horizontalAlign === "center" ||
    value.horizontalAlign === "right"
      ? value.horizontalAlign
      : DEFAULT_PRINT_SETTINGS.horizontalAlign;

  const verticalAlign =
    value.verticalAlign === "top" ||
    value.verticalAlign === "center" ||
    value.verticalAlign === "bottom"
      ? value.verticalAlign
      : DEFAULT_PRINT_SETTINGS.verticalAlign;

  const customScaleRaw =
    typeof value.customScalePercent === "number"
      ? value.customScalePercent
      : typeof value.customScalePercent === "string"
        ? Number.parseInt(value.customScalePercent, 10)
        : Number.NaN;
  const customScalePercent = Number.isFinite(customScaleRaw)
    ? Math.max(10, Math.min(200, Math.round(customScaleRaw)))
    : DEFAULT_PRINT_SETTINGS.customScalePercent;

  return {
    paperSize,
    orientation,
    scaleMode,
    horizontalAlign,
    verticalAlign,
    customScalePercent,
  };
}

function clampFontSize(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(numeric)));
}

export function normalizeNodeFontSizes(value: unknown): NodeFontSizes {
  if (!isRecord(value)) {
    return {
      titlePx: DEFAULT_TITLE_FONT_SIZE_PX,
      namePx: DEFAULT_NAME_FONT_SIZE_PX,
    };
  }

  return {
    titlePx: clampFontSize(
      value.titlePx,
      MIN_TITLE_FONT_SIZE_PX,
      MAX_TITLE_FONT_SIZE_PX,
      DEFAULT_TITLE_FONT_SIZE_PX,
    ),
    namePx: clampFontSize(
      value.namePx,
      MIN_NAME_FONT_SIZE_PX,
      MAX_NAME_FONT_SIZE_PX,
      DEFAULT_NAME_FONT_SIZE_PX,
    ),
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

function isoDateFromTimestamp(value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function normalizeLegendDate(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return value;
}

export function createDefaultLegend(
  projectName = "Org Chart",
  createdAt = nowISO(),
): ChartLegend {
  return {
    title: projectName,
    createdBy: "",
    revisedBy: "",
    date: isoDateFromTimestamp(createdAt),
    revisionNumber: "1",
  };
}

function normalizeLegend(
  input: unknown,
  projectName: string,
  createdAt: string,
): ChartLegend {
  if (!isRecord(input)) {
    return createDefaultLegend(projectName, createdAt);
  }

  const fallbackLegend = createDefaultLegend(projectName, createdAt);

  return {
    title:
      typeof input.title === "string" ? input.title : fallbackLegend.title,
    createdBy:
      typeof input.createdBy === "string"
        ? input.createdBy
        : fallbackLegend.createdBy,
    revisedBy:
      typeof input.revisedBy === "string"
        ? input.revisedBy
        : fallbackLegend.revisedBy,
    date: normalizeLegendDate(input.date, fallbackLegend.date),
    revisionNumber:
      typeof input.revisionNumber === "string"
        ? input.revisionNumber
        : fallbackLegend.revisionNumber,
  };
}

export function createNode(name = "", title = ""): OrgNode {
  return {
    id: createId(),
    name,
    title,
    children: [],
  };
}

export function createProject(name: string, root?: OrgNode): OrgProject {
  const timestamp = nowISO();

  return {
    id: createId(),
    name,
    themeId: getRandomThemeId(),
    spreadTillLevel: DEFAULT_SPREAD_TILL_LEVEL,
    fontSizes: normalizeNodeFontSizes(null),
    printSettings: clonePrintSettings(DEFAULT_PRINT_SETTINGS),
    windowZoom: DEFAULT_WINDOW_ZOOM,
    root: root ?? createNode(),
    legend: createDefaultLegend(name, timestamp),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function clampWindowZoom(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return DEFAULT_WINDOW_ZOOM;
  }

  return Math.min(MAX_WINDOW_ZOOM, Math.max(MIN_WINDOW_ZOOM, numeric));
}

export function clampSpreadTillLevel(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return DEFAULT_SPREAD_TILL_LEVEL;
  }

  const rounded = Math.round(numeric);
  return Math.min(MAX_SPREAD_TILL_LEVEL, Math.max(MIN_SPREAD_TILL_LEVEL, rounded));
}

export function normalizeThemeId(value: unknown): ThemeId {
  if (
    typeof value === "string" &&
    THEMES.some((themeOption) => themeOption.id === value)
  ) {
    return value as ThemeId;
  }

  return "ocean";
}

export function cloneSubtreeWithFreshIds(node: OrgNode): OrgNode {
  return {
    id: createId(),
    name: node.name,
    title: node.title,
    children: node.children.map(cloneSubtreeWithFreshIds),
  };
}

function cloneSubtreeKeepingIds(node: OrgNode): OrgNode {
  return {
    id: node.id,
    name: node.name,
    title: node.title,
    children: node.children.map(cloneSubtreeKeepingIds),
  };
}

export function withFreshProjectIds(project: OrgProject): OrgProject {
  const timestamp = nowISO();

  return {
    ...project,
    id: createId(),
    root: cloneSubtreeWithFreshIds(project.root),
    legend: {
      ...project.legend,
      date: isoDateFromTimestamp(timestamp),
    },
    fontSizes: normalizeNodeFontSizes(project.fontSizes),
    printSettings: normalizePrintSettings(project.printSettings),
    windowZoom: clampWindowZoom(project.windowZoom),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeNode(input: unknown): OrgNode | null {
  if (!looksLikeNodeInput(input)) {
    return null;
  }

  const name =
    typeof input.name === "string" && input.name.trim().length > 0
      ? input.name
      : "Unnamed";
  const title = typeof input.title === "string" ? input.title : "";
  const childrenCandidates = Array.isArray(input.children) ? input.children : [];

  const children = childrenCandidates
    .map((child) => normalizeNode(child))
    .filter((node): node is OrgNode => node !== null);

  return {
    id:
      typeof input.id === "string" && input.id.trim().length > 0
        ? input.id
        : createId(),
    name,
    title,
    children,
  };
}

export function normalizeProject(input: unknown): OrgProject | null {
  if (!isRecord(input)) {
    return null;
  }

  const rootCandidate = "root" in input ? input.root : input.rootNode;
  const normalizedRoot = normalizeNode(rootCandidate);

  if (!normalizedRoot) {
    return null;
  }

  const name =
    typeof input.name === "string" && input.name.trim().length > 0
      ? input.name
      : "Imported Project";

  const createdAt =
    typeof input.createdAt === "string" && input.createdAt.trim().length > 0
      ? input.createdAt
      : nowISO();
  const updatedAt =
    typeof input.updatedAt === "string" && input.updatedAt.trim().length > 0
      ? input.updatedAt
      : createdAt;
  const legend = normalizeLegend(input.legend, name, createdAt);

  return {
    id:
      typeof input.id === "string" && input.id.trim().length > 0
        ? input.id
        : createId(),
    name,
    themeId: normalizeThemeId(input.themeId),
    spreadTillLevel: clampSpreadTillLevel(input.spreadTillLevel),
    fontSizes: normalizeNodeFontSizes(input.fontSizes),
    printSettings: normalizePrintSettings(input.printSettings),
    windowZoom: clampWindowZoom(input.windowZoom),
    root: normalizedRoot,
    legend,
    createdAt,
    updatedAt,
  };
}

export function parseImportedProjects(payload: unknown): OrgProject[] {
  if (Array.isArray(payload)) {
    return payload
      .map((candidate) => normalizeProject(candidate))
      .filter((project): project is OrgProject => project !== null);
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (payload.type === "org-chart-project" && "project" in payload) {
    const imported = normalizeProject(payload.project);
    return imported ? [imported] : [];
  }

  if (payload.type === "org-chart-projects" && Array.isArray(payload.projects)) {
    return payload.projects
      .map((candidate) => normalizeProject(candidate))
      .filter((project): project is OrgProject => project !== null);
  }

  const standaloneProject = normalizeProject(payload);
  if (standaloneProject) {
    return [standaloneProject];
  }

  const standaloneNode = normalizeNode(payload);
  if (standaloneNode) {
    return [
      createProject("Imported Project", cloneSubtreeKeepingIds(standaloneNode)),
    ];
  }

  return [];
}

export function loadProjectsFromStorage(): OrgProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return parseImportedProjects(parsed);
  } catch {
    return [];
  }
}

export function sanitizeFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "org-chart"
  );
}

export function countNodes(root: OrgNode): number {
  return (
    1 + root.children.reduce((count, child) => count + countNodes(child), 0)
  );
}

export function updateNode(
  root: OrgNode,
  targetId: string,
  updater: (node: OrgNode) => OrgNode,
): OrgNode {
  if (root.id === targetId) {
    return updater(root);
  }

  return {
    ...root,
    children: root.children.map((child) => updateNode(child, targetId, updater)),
  };
}

export function addChildNode(root: OrgNode, parentId: string): OrgNode {
  return updateNode(root, parentId, (node) => ({
    ...node,
    children: [...node.children, createNode()],
  }));
}

function duplicateNodeInChildren(current: OrgNode, targetId: string): OrgNode {
  return {
    ...current,
    children: current.children.flatMap((child) => {
      const refreshedChild = duplicateNodeInChildren(child, targetId);

      if (child.id !== targetId) {
        return [refreshedChild];
      }

      const copied = cloneSubtreeWithFreshIds(child);
      copied.name = `${child.name} Copy`;
      return [refreshedChild, copied];
    }),
  };
}

export function duplicateNode(root: OrgNode, targetId: string): OrgNode {
  return duplicateNodeInChildren(root, targetId);
}

export function deleteNode(root: OrgNode, targetId: string): OrgNode {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== targetId)
      .map((child) => deleteNode(child, targetId)),
  };
}

export function findNodeById(root: OrgNode, targetId: string): OrgNode | null {
  if (root.id === targetId) {
    return root;
  }

  for (const child of root.children) {
    const found = findNodeById(child, targetId);
    if (found) {
      return found;
    }
  }

  return null;
}

export function findNodeDepth(
  root: OrgNode,
  targetId: string,
  depth = 1,
): number | null {
  if (root.id === targetId) {
    return depth;
  }

  for (const child of root.children) {
    const nextDepth = findNodeDepth(child, targetId, depth + 1);
    if (nextDepth !== null) {
      return nextDepth;
    }
  }

  return null;
}

interface DetachResult {
  parentId: string | null;
  removedNode: OrgNode | null;
  tree: OrgNode;
}

function detachNode(root: OrgNode, targetId: string): DetachResult {
  let removedNode: OrgNode | null = null;
  let parentId: string | null = null;

  const nextChildren: OrgNode[] = [];

  for (const child of root.children) {
    if (child.id === targetId) {
      removedNode = child;
      parentId = root.id;
      continue;
    }

    const detached = detachNode(child, targetId);

    if (!removedNode && detached.removedNode) {
      removedNode = detached.removedNode;
      parentId = detached.parentId;
    }

    nextChildren.push(detached.tree);
  }

  return {
    parentId,
    removedNode,
    tree: {
      ...root,
      children: nextChildren,
    },
  };
}

interface AttachResult {
  attached: boolean;
  tree: OrgNode;
}

function attachNode(root: OrgNode, parentId: string, nodeToAttach: OrgNode): AttachResult {
  if (root.id === parentId) {
    return {
      attached: true,
      tree: {
        ...root,
        children: [...root.children, nodeToAttach],
      },
    };
  }

  let attached = false;
  const nextChildren = root.children.map((child) => {
    const attachedChild = attachNode(child, parentId, nodeToAttach);
    if (attachedChild.attached) {
      attached = true;
    }

    return attachedChild.tree;
  });

  return {
    attached,
    tree: {
      ...root,
      children: nextChildren,
    },
  };
}

export type MoveNodeStatus =
  | "moved"
  | "source_is_root"
  | "source_not_found"
  | "parent_not_found"
  | "same_parent"
  | "invalid_cycle";

export interface MoveNodeResult {
  root: OrgNode;
  status: MoveNodeStatus;
}

type SiblingReorderTraversalResult = {
  node: OrgNode;
  found: boolean;
  moved: boolean;
};

function reorderNodeAmongSiblingsRecursive(
  root: OrgNode,
  sourceId: string,
  direction: -1 | 1,
): SiblingReorderTraversalResult {
  const sourceIndex = root.children.findIndex((child) => child.id === sourceId);

  if (sourceIndex >= 0) {
    const targetIndex = sourceIndex + direction;
    if (targetIndex < 0 || targetIndex >= root.children.length) {
      return {
        node: root,
        found: true,
        moved: false,
      };
    }

    const nextChildren = [...root.children];
    [nextChildren[sourceIndex], nextChildren[targetIndex]] = [
      nextChildren[targetIndex],
      nextChildren[sourceIndex],
    ];

    return {
      node: {
        ...root,
        children: nextChildren,
      },
      found: true,
      moved: true,
    };
  }

  let found = false;
  let moved = false;
  let hasChanges = false;

  const nextChildren = root.children.map((child) => {
    if (found) {
      return child;
    }

    const reordered = reorderNodeAmongSiblingsRecursive(child, sourceId, direction);
    if (reordered.found) {
      found = true;
      moved = reordered.moved;
    }

    if (reordered.node !== child) {
      hasChanges = true;
    }

    return reordered.node;
  });

  if (!found || !hasChanges) {
    return {
      node: root,
      found,
      moved,
    };
  }

  return {
    node: {
      ...root,
      children: nextChildren,
    },
    found,
    moved,
  };
}

export type ReorderNodeStatus =
  | "moved"
  | "source_is_root"
  | "source_not_found"
  | "at_boundary";

export interface ReorderNodeResult {
  root: OrgNode;
  status: ReorderNodeStatus;
}

export function moveNodeAmongSiblings(
  root: OrgNode,
  sourceId: string,
  direction: -1 | 1,
): ReorderNodeResult {
  if (root.id === sourceId) {
    return { root, status: "source_is_root" };
  }

  const reordered = reorderNodeAmongSiblingsRecursive(root, sourceId, direction);

  if (!reordered.found) {
    return { root, status: "source_not_found" };
  }

  if (!reordered.moved) {
    return { root, status: "at_boundary" };
  }

  return {
    root: reordered.node,
    status: "moved",
  };
}

export function moveNodeToParent(
  root: OrgNode,
  sourceId: string,
  newParentId: string,
): MoveNodeResult {
  if (root.id === sourceId) {
    return { root, status: "source_is_root" };
  }

  const sourceNode = findNodeById(root, sourceId);
  if (!sourceNode) {
    return { root, status: "source_not_found" };
  }

  const newParentNode = findNodeById(root, newParentId);
  if (!newParentNode) {
    return { root, status: "parent_not_found" };
  }

  if (sourceId === newParentId || findNodeById(sourceNode, newParentId)) {
    return { root, status: "invalid_cycle" };
  }

  const detached = detachNode(root, sourceId);
  if (!detached.removedNode || !detached.parentId) {
    return { root, status: "source_not_found" };
  }

  if (detached.parentId === newParentId) {
    return { root, status: "same_parent" };
  }

  const attached = attachNode(detached.tree, newParentId, detached.removedNode);

  if (!attached.attached) {
    return { root, status: "parent_not_found" };
  }

  return {
    root: attached.tree,
    status: "moved",
  };
}

export function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const day = `${parsed.getDate()}`.padStart(2, "0");
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const year = `${parsed.getFullYear()}`;
  return `${day}/${month}/${year}`;
}

export function downloadJson(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function clampMenuPosition(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") {
    return { x, y };
  }

  const margin = 12;

  const safeX = Math.max(
    margin,
    Math.min(x, window.innerWidth - MENU_WIDTH - margin),
  );
  const safeY = Math.max(
    margin,
    Math.min(y, window.innerHeight - MENU_HEIGHT - margin),
  );

  return { x: safeX, y: safeY };
}
