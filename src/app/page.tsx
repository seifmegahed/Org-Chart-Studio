"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { NodeContextMenu } from "@/components/node-context-menu";
import { NoticeToast } from "@/components/notice-toast";
import { ProjectEditor } from "@/components/project-editor";
import { ProjectsHome } from "@/components/projects-home";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  EXPORT_VERSION,
  LAST_PROJECT_KEY,
  STORAGE_KEY,
  addChildNode,
  clampSpreadTillLevel,
  clampMenuPosition,
  countNodes,
  createProject,
  deleteNode,
  downloadJson,
  duplicateNode,
  findNodeById,
  findNodeDepth,
  loadProjectsFromStorage,
  moveNodeAmongSiblings,
  moveNodeToParent,
  normalizeThemeId,
  nowISO,
  parseImportedProjects,
  sanitizeFileName,
  updateNode,
  withFreshProjectIds,
  type ChartLegend,
  type OrgProject,
} from "@/lib/org-chart";

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
  depth: number;
}

interface DeleteNodeDialogState {
  nodeId: string;
  nodeName: string;
  childCount: number;
}

interface DeleteProjectDialogState {
  projectId: string;
  projectName: string;
}

const MM_TO_CSS_PX = 96 / 25.4;
const PRINT_PAGE_WIDTH_MM = 297;
const PRINT_PAGE_HEIGHT_MM = 210;
const PRINT_PAGE_MARGIN_MM = 8;
const MIN_PRINT_SCALE = 0.1;
const PRINT_CHART_VERTICAL_RESERVED_PX = 96;

function measureChartPrintScale(chartContent: HTMLElement): number {
  const contentWidth = Math.max(chartContent.scrollWidth, chartContent.offsetWidth);
  const contentHeight = Math.max(
    chartContent.scrollHeight,
    chartContent.offsetHeight,
  );

  const printableWidthPx =
    (PRINT_PAGE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_CSS_PX;
  const printableHeightPx =
    (PRINT_PAGE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_CSS_PX;

  const availableWidthPx = Math.max(120, printableWidthPx - 8);
  const availableHeightPx = Math.max(
    120,
    printableHeightPx - PRINT_CHART_VERTICAL_RESERVED_PX,
  );

  const widthScale = availableWidthPx / Math.max(1, contentWidth);
  const heightScale = availableHeightPx / Math.max(1, contentHeight);
  const fitScale = Math.min(widthScale, heightScale, 1);

  if (!Number.isFinite(fitScale)) {
    return 1;
  }

  return Math.max(MIN_PRINT_SCALE, fitScale);
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [reparentSourceNodeId, setReparentSourceNodeId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [createProjectSuggestedName, setCreateProjectSuggestedName] = useState(
    "Project 1",
  );
  const [createProjectName, setCreateProjectName] = useState("");
  const [deleteNodeDialog, setDeleteNodeDialog] =
    useState<DeleteNodeDialogState | null>(null);
  const [deleteProjectDialog, setDeleteProjectDialog] =
    useState<DeleteProjectDialogState | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const activeTheme = activeProject?.themeId ?? "ocean";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.setAttribute("data-theme", activeTheme);
    document.documentElement.setAttribute("data-theme", activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    const loadedProjects = loadProjectsFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(loadedProjects);

    if (typeof window !== "undefined") {
      const savedProject = window.localStorage.getItem(LAST_PROJECT_KEY);
      if (
        savedProject &&
        loadedProjects.some((project) => project.id === savedProject)
      ) {
        setActiveProjectId(savedProject);
      }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, ready]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    if (activeProjectId) {
      window.localStorage.setItem(LAST_PROJECT_KEY, activeProjectId);
      return;
    }

    window.localStorage.removeItem(LAST_PROJECT_KEY);
  }, [activeProjectId, ready]);

  useEffect(() => {
    const hideContextMenu = () => setContextMenu(null);

    window.addEventListener("click", hideContextMenu);
    window.addEventListener("scroll", hideContextMenu, true);
    window.addEventListener("resize", hideContextMenu);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", hideContextMenu);
      window.removeEventListener("scroll", hideContextMenu, true);
      window.removeEventListener("resize", hideContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [notice]);

  useEffect(() => {
    const applyPrintScale = () => {
      const chartContent = document.querySelector<HTMLElement>(
        "#chart-print-area .chart-content",
      );

      if (!chartContent) {
        return;
      }

      document.documentElement.style.setProperty(
        "--print-scale",
        `${measureChartPrintScale(chartContent)}`,
      );
    };

    const clearPrintScale = () => {
      document.documentElement.style.removeProperty("--print-scale");
    };

    const handleBeforePrint = () => {
      applyPrintScale();
      window.requestAnimationFrame(applyPrintScale);
    };

    const printMediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("print")
        : null;
    const handlePrintMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.requestAnimationFrame(applyPrintScale);
        return;
      }

      clearPrintScale();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", clearPrintScale);
    printMediaQuery?.addEventListener("change", handlePrintMediaChange);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", clearPrintScale);
      printMediaQuery?.removeEventListener("change", handlePrintMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!activeProject || !reparentSourceNodeId) {
      return;
    }

    const selectedNode = findNodeById(activeProject.root, reparentSourceNodeId);
    if (selectedNode) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReparentSourceNodeId(null);
  }, [activeProject, reparentSourceNodeId]);

  const updateActiveProject = (
    updater: (currentProject: OrgProject) => OrgProject,
  ) => {
    if (!activeProjectId) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== activeProjectId) {
          return project;
        }

        const updatedProject = updater(project);

        return {
          ...updatedProject,
          updatedAt: nowISO(),
        };
      }),
    );
  };

  const createNewProject = () => {
    const suggestedName = `Project ${projects.length + 1}`;
    setCreateProjectSuggestedName(suggestedName);
    setCreateProjectName(suggestedName);
    setCreateProjectDialogOpen(true);
  };

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const safeName = createProjectName.trim() || createProjectSuggestedName;
    const project = createProject(safeName);

    setProjects((currentProjects) => [project, ...currentProjects]);
    setActiveProjectId(project.id);
    setCreateProjectDialogOpen(false);
    setCreateProjectName("");
    setNotice(`Created ${safeName}.`);
  };

  const openContextMenu = (
    nodeId: string,
    x: number,
    y: number,
    depth: number,
  ) => {
    const position = clampMenuPosition(x, y);
    setContextMenu({ nodeId, x: position.x, y: position.y, depth });
  };

  const handleNodeFieldChange = (
    nodeId: string,
    field: "name" | "title",
    value: string,
  ) => {
    updateActiveProject((project) => ({
      ...project,
      root: updateNode(project.root, nodeId, (node) => ({
        ...node,
        [field]: value,
      })),
    }));
  };

  const handleLegendFieldChange = (
    field: keyof ChartLegend,
    value: string,
  ) => {
    updateActiveProject((project) => ({
      ...project,
      legend: {
        ...project.legend,
        [field]: value,
      },
    }));
  };

  const handleAddBeneath = (nodeId: string) => {
    updateActiveProject((project) => ({
      ...project,
      root: addChildNode(project.root, nodeId),
    }));

    setContextMenu(null);
  };

  const handleDuplicateNode = (nodeId: string) => {
    if (!activeProject) {
      return;
    }

    if (nodeId === activeProject.root.id) {
      setNotice("Root duplication is disabled. Duplicate child nodes instead.");
      setContextMenu(null);
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      root: duplicateNode(project.root, nodeId),
    }));

    setContextMenu(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeProject) {
      return;
    }

    if (nodeId === activeProject.root.id) {
      setNotice("The root node cannot be deleted.");
      setContextMenu(null);
      return;
    }

    const targetNode = findNodeById(activeProject.root, nodeId);
    const hasChildren = Boolean(targetNode?.children.length);

    if (hasChildren) {
      setDeleteNodeDialog({
        nodeId,
        nodeName: targetNode?.name ?? "this node",
        childCount: targetNode?.children.length ?? 0,
      });
      setContextMenu(null);
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      root: deleteNode(project.root, nodeId),
    }));

    setContextMenu(null);
  };

  const handleMoveNodeBackward = (nodeId: string) => {
    if (!activeProject) {
      return;
    }

    const moved = moveNodeAmongSiblings(activeProject.root, nodeId, -1);

    if (moved.status === "moved") {
      updateActiveProject((project) => ({
        ...project,
        root: moved.root,
      }));
      setContextMenu(null);
      return;
    }

    if (moved.status === "source_is_root") {
      setNotice("The root node cannot be rearranged.");
      setContextMenu(null);
      return;
    }

    if (moved.status === "at_boundary") {
      setNotice("This node is already at the start of its level.");
      setContextMenu(null);
      return;
    }

    setNotice("Could not move that node.");
    setContextMenu(null);
  };

  const handleMoveNodeForward = (nodeId: string) => {
    if (!activeProject) {
      return;
    }

    const moved = moveNodeAmongSiblings(activeProject.root, nodeId, 1);

    if (moved.status === "moved") {
      updateActiveProject((project) => ({
        ...project,
        root: moved.root,
      }));
      setContextMenu(null);
      return;
    }

    if (moved.status === "source_is_root") {
      setNotice("The root node cannot be rearranged.");
      setContextMenu(null);
      return;
    }

    if (moved.status === "at_boundary") {
      setNotice("This node is already at the end of its level.");
      setContextMenu(null);
      return;
    }

    setNotice("Could not move that node.");
    setContextMenu(null);
  };

  const handleStartSelectNewParent = (nodeId: string) => {
    if (!activeProject) {
      return;
    }

    if (nodeId === activeProject.root.id) {
      setNotice("The root node cannot be moved.");
      setContextMenu(null);
      return;
    }

    const sourceNode = findNodeById(activeProject.root, nodeId);
    if (!sourceNode) {
      setNotice("Could not find that node.");
      setContextMenu(null);
      return;
    }

    setReparentSourceNodeId(nodeId);
    setContextMenu(null);
    setNotice(
      `Selecting new parent for ${sourceNode.name}. Right-click a destination node and choose Move Selected Node Here.`,
    );
  };

  const handleCancelReparentSelection = () => {
    if (!reparentSourceNodeId) {
      return;
    }

    setReparentSourceNodeId(null);
    setContextMenu(null);
    setNotice("Parent selection cancelled.");
  };

  const handleMoveSelectedNodeHere = (newParentId: string) => {
    if (!activeProject || !reparentSourceNodeId) {
      return;
    }

    const sourceNode = findNodeById(activeProject.root, reparentSourceNodeId);
    const parentNode = findNodeById(activeProject.root, newParentId);

    const moveResult = moveNodeToParent(
      activeProject.root,
      reparentSourceNodeId,
      newParentId,
    );

    if (moveResult.status === "moved") {
      updateActiveProject((project) => ({
        ...project,
        root: moveResult.root,
      }));
      setReparentSourceNodeId(null);
      setContextMenu(null);
      setNotice(
        `Moved ${sourceNode?.name ?? "node"} under ${parentNode?.name ?? "parent"}.`,
      );
      return;
    }

    if (moveResult.status === "same_parent") {
      setContextMenu(null);
      setNotice("That node already has this parent.");
      return;
    }

    if (moveResult.status === "invalid_cycle") {
      setContextMenu(null);
      setNotice("You cannot move a node under itself or one of its descendants.");
      return;
    }

    setReparentSourceNodeId(null);
    setContextMenu(null);
    setNotice("Could not move the selected node.");
  };

  const handleExportProject = () => {
    if (!activeProject) {
      return;
    }

    downloadJson(`${sanitizeFileName(activeProject.name)}.json`, {
      type: "org-chart-project",
      version: EXPORT_VERSION,
      exportedAt: nowISO(),
      project: activeProject,
    });

    setNotice(`Exported ${activeProject.name}.`);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const payload: unknown = JSON.parse(rawText);
      const importedProjects = parseImportedProjects(payload).map(
        withFreshProjectIds,
      );

      if (importedProjects.length === 0) {
        setNotice("Could not read projects from this JSON file.");
        return;
      }

      setProjects((currentProjects) => [...importedProjects, ...currentProjects]);
      setActiveProjectId(importedProjects[0].id);
      setNotice(`Imported ${importedProjects.length} project(s).`);
    } catch {
      setNotice("Import failed. Please use a valid JSON export file.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePrint = () => {
    setContextMenu(null);
    window.print();
  };

  const confirmDeleteNode = () => {
    if (!activeProject || !deleteNodeDialog) {
      setDeleteNodeDialog(null);
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      root: deleteNode(project.root, deleteNodeDialog.nodeId),
    }));

    setDeleteNodeDialog(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((candidate) => candidate.id === projectId);

    if (!project) {
      return;
    }

    setDeleteProjectDialog({
      projectId,
      projectName: project.name,
    });
  };

  const confirmDeleteProject = () => {
    if (!deleteProjectDialog) {
      return;
    }

    const { projectId, projectName } = deleteProjectDialog;
    setProjects((currentProjects) =>
      currentProjects.filter((candidate) => candidate.id !== projectId),
    );

    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }

    setDeleteProjectDialog(null);
    setNotice(`Deleted ${projectName}.`);
  };

  if (!ready) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-[--panel-border] bg-[--panel-bg] px-6 py-4 text-sm font-medium text-[--muted-text]">
          Loading projects...
        </div>
      </main>
    );
  }

  const menuTargetsRoot =
    activeProject && contextMenu
      ? contextMenu.nodeId === activeProject.root.id
      : false;

  const reparentSourceNode =
    activeProject && reparentSourceNodeId
      ? findNodeById(activeProject.root, reparentSourceNodeId)
      : null;

  const canMoveSelectedHere =
    activeProject &&
    contextMenu &&
    reparentSourceNode &&
    contextMenu.nodeId !== reparentSourceNode.id &&
    !findNodeById(reparentSourceNode, contextMenu.nodeId)
      ? true
      : false;
  const contextNodeDepth =
    activeProject && contextMenu
      ? findNodeDepth(activeProject.root, contextMenu.nodeId) ?? contextMenu.depth
      : null;
  const spreadThreshold = activeProject?.spreadTillLevel ?? 3;
  const useHorizontalMoveLabels =
    contextNodeDepth !== null ? contextNodeDepth <= spreadThreshold : true;
  const moveBackwardLabel = useHorizontalMoveLabels ? "Move Left" : "Move Up";
  const moveForwardLabel = useHorizontalMoveLabels ? "Move Right" : "Move Down";
  const canMoveBackward =
    activeProject && contextMenu
      ? moveNodeAmongSiblings(activeProject.root, contextMenu.nodeId, -1).status ===
        "moved"
      : false;
  const canMoveForward =
    activeProject && contextMenu
      ? moveNodeAmongSiblings(activeProject.root, contextMenu.nodeId, 1).status ===
        "moved"
      : false;
  const isEditingProject = Boolean(activeProject);

  return (
    <main
      data-theme={activeTheme}
      className={
        isEditingProject
          ? "h-screen min-h-screen overflow-hidden"
          : "app-shell min-h-screen"
      }
    >
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div
        className={
          isEditingProject
            ? "print-canvas flex h-full min-h-0 w-full flex-col"
            : "print-canvas w-full"
        }
      >
        {!activeProject ? (
          <ProjectsHome
            projects={projects}
            onCreateNewProject={createNewProject}
            onImportClick={handleImportClick}
            onOpenProject={setActiveProjectId}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <ProjectEditor
            activeProject={activeProject}
            nodeCount={countNodes(activeProject.root)}
            onGoHome={() => {
              setReparentSourceNodeId(null);
              setActiveProjectId(null);
            }}
            onProjectNameChange={(nextName) => {
              updateActiveProject((project) => ({
                ...project,
                name: nextName,
              }));
            }}
            onThemeChange={(nextTheme) => {
              updateActiveProject((project) => ({
                ...project,
                themeId: normalizeThemeId(nextTheme),
              }));
            }}
            onSpreadTillLevelChange={(nextLevel) => {
              updateActiveProject((project) => ({
                ...project,
                spreadTillLevel: clampSpreadTillLevel(nextLevel),
              }));
            }}
            onImportClick={handleImportClick}
            onExportProject={handleExportProject}
            onPrint={handlePrint}
            onNodeFieldChange={handleNodeFieldChange}
            onLegendFieldChange={handleLegendFieldChange}
            onOpenMenu={openContextMenu}
          />
        )}

        {activeProject && reparentSourceNode ? (
          <div className="print-hidden mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[--panel-border] bg-white/90 px-4 py-2 text-sm text-[--main-text]">
            <span>
              Select a new parent for <strong>{reparentSourceNode.name}</strong>.
            </span>
            <button
              className="secondary-btn"
              onClick={handleCancelReparentSelection}
            >
              Cancel
            </button>
          </div>
        ) : null}
        <NoticeToast message={notice} />
      </div>

      <Dialog
        open={createProjectDialogOpen}
        onOpenChange={(open) => {
          setCreateProjectDialogOpen(open);
          if (!open) {
            setCreateProjectName("");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Pick a project name. You can rename it later.
              </DialogDescription>
            </DialogHeader>
            <input
              className="mt-4 w-full rounded-lg border border-[--panel-border] px-3 py-2 text-sm font-semibold text-[--main-text] outline-none ring-[--accent-color] focus:ring-2"
              value={createProjectName}
              onChange={(event) => {
                setCreateProjectName(event.target.value);
              }}
              placeholder={createProjectSuggestedName}
              autoFocus
            />
            <DialogFooter className="sticky bottom-0 mt-4 pt-3">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[--panel-border] bg-white px-4 text-sm font-semibold text-[--main-text] transition-colors hover:bg-[--button-muted] cursor-pointer"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                className="primary-btn min-w-30"
              >
                Create Project
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteNodeDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteNodeDialog(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete node and descendants?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteNodeDialog
                ? `Delete ${deleteNodeDialog.nodeName} and ${deleteNodeDialog.childCount} descendant node(s)? This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#b73333] hover:bg-[#a22a2a] cursor-pointer"
              onClick={confirmDeleteNode}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteProjectDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProjectDialog(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProjectDialog
                ? `Delete ${deleteProjectDialog.projectName}? This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#b73333] hover:bg-[#a22a2a] cursor-pointer"
              onClick={confirmDeleteProject}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {contextMenu && activeProject ? (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          disableDuplicateDelete={menuTargetsRoot}
          canMoveBackward={canMoveBackward}
          canMoveForward={canMoveForward}
          moveBackwardLabel={moveBackwardLabel}
          moveForwardLabel={moveForwardLabel}
          canStartReparent={!menuTargetsRoot}
          isReparentMode={Boolean(reparentSourceNodeId)}
          canMoveSelectedHere={canMoveSelectedHere}
          onMoveBackward={handleMoveNodeBackward}
          onMoveForward={handleMoveNodeForward}
          onAddBeneath={handleAddBeneath}
          onStartReparent={handleStartSelectNewParent}
          onMoveSelectedHere={handleMoveSelectedNodeHere}
          onCancelReparent={handleCancelReparentSelection}
          onDuplicate={handleDuplicateNode}
          onDelete={handleDeleteNode}
        />
      ) : null}
    </main>
  );
}
