"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { NodeContextMenu } from "@/components/node-context-menu";
import { NoticeToast } from "@/components/notice-toast";
import { ProjectEditor } from "@/components/project-editor";
import { ProjectsHome } from "@/components/projects-home";
import {
  EXPORT_VERSION,
  LAST_PROJECT_KEY,
  STORAGE_KEY,
  addChildNode,
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
  type OrgProject,
} from "@/lib/org-chart";

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
  depth: number;
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
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const activeTheme = activeProject?.themeId ?? "ocean";

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

      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const horizontalPrintMarginPx = 48;
      const availableWidth = Math.max(320, viewportWidth - horizontalPrintMarginPx);
      const contentWidth = Math.max(chartContent.scrollWidth, chartContent.offsetWidth);
      const nextScale = Math.min(1, availableWidth / contentWidth);

      document.documentElement.style.setProperty(
        "--print-scale",
        `${Math.max(0.55, nextScale)}`,
      );
    };

    const clearPrintScale = () => {
      document.documentElement.style.removeProperty("--print-scale");
    };

    window.addEventListener("beforeprint", applyPrintScale);
    window.addEventListener("afterprint", clearPrintScale);

    return () => {
      window.removeEventListener("beforeprint", applyPrintScale);
      window.removeEventListener("afterprint", clearPrintScale);
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
    const requestedName = window.prompt("Project name", suggestedName);

    if (requestedName === null) {
      return;
    }

    const safeName = requestedName.trim() || suggestedName;
    const project = createProject(safeName);

    setProjects((currentProjects) => [project, ...currentProjects]);
    setActiveProjectId(project.id);
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

    const confirmed = window.confirm("Delete this node and all sub-nodes?");
    if (!confirmed) {
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

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((candidate) => candidate.id === projectId);

    if (!project) {
      return;
    }

    const confirmed = window.confirm(`Delete project \"${project.name}\"?`);
    if (!confirmed) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((candidate) => candidate.id !== projectId),
    );

    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }

    setNotice(`Deleted ${project.name}.`);
  };

  if (!ready) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-6 py-4 text-sm font-medium text-[var(--muted-text)]">
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
  const useHorizontalMoveLabels = contextNodeDepth !== null ? contextNodeDepth <= 3 : true;
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
          ? "app-shell h-screen min-h-screen overflow-hidden"
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
            onImportClick={handleImportClick}
            onExportProject={handleExportProject}
            onPrint={handlePrint}
            onNodeFieldChange={handleNodeFieldChange}
            onOpenMenu={openContextMenu}
          />
        )}

        {activeProject && reparentSourceNode ? (
          <div className="print-hidden mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--panel-border)] bg-white/90 px-4 py-2 text-sm text-[var(--main-text)]">
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

        {/* {activeProject ? (
          <div className="print-hidden bg-white/80 px-4 py-2 text-xs font-medium text-[var(--muted-text)]">
            Right-click nodes to add, rearrange, duplicate, delete, or reparent.
          </div>
        ) : null} */}

        <NoticeToast message={notice} />
      </div>

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
