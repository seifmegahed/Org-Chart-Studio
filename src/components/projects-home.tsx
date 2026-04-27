"use client";

import { THEMES, formatDate, type OrgProject } from "@/lib/org-chart";

type ProjectsHomeProps = {
  projects: OrgProject[];
  onCreateNewProject: () => void;
  onImportClick: () => void;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
};

export function ProjectsHome({
  projects,
  onCreateNewProject,
  onImportClick,
  onOpenProject,
  onDeleteProject,
}: ProjectsHomeProps) {
  return (
    <section className="rounded-[16px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-xl md:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-text)]">
            INP Org Chart Studio
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[var(--main-text)] md:text-4xl">
            Build and manage your organization charts
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-text)] md:text-base">
            Create multiple local projects, edit nodes with right-click
            controls, import/export JSON files, and print any chart as PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="primary-btn" onClick={onCreateNewProject}>
            New Project
          </button>
          <button className="secondary-btn" onClick={onImportClick}>
            Import JSON
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--panel-border)] bg-white/60 px-6 py-12 text-center text-sm text-[var(--muted-text)]">
          No local projects yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-[var(--panel-border)] bg-white/80 p-4 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[var(--main-text)]">
                  {project.name}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-[0.13em] text-[var(--muted-text)]">
                  Theme: {THEMES.find((theme) => theme.id === project.themeId)?.name}
                </p>
                <p className="mt-3 text-xs text-[var(--muted-text)]">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="primary-btn flex-1"
                  onClick={() => onOpenProject(project.id)}
                >
                  Open
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => onDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
