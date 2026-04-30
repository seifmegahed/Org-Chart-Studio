"use client";

import Link from "next/link";

import { THEMES, formatDate, type OrgProject } from "@/lib/org-chart";
import { CircleHelp, Plus, Trash2, Upload } from "lucide-react";

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
    <section className="p-5 md:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[--muted-text]">
            INP Org Chart Studio
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[--main-text] md:text-4xl">
            Build and manage your organization charts
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[--muted-text] md:text-base">
            Create multiple local projects, edit nodes with right-click
            controls, import/export JSON files, and print any chart as PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/help"
            className="secondary-btn"
            title="Help"
            aria-label="Help"
          >
            <CircleHelp />
          </Link>
          <button
            className="secondary-btn"
            onClick={onImportClick}
            title="Import"
            aria-label="Import"
          >
            <Upload />
          </button>
          <button
            className="primary-btn"
            onClick={onCreateNewProject}
            title="New Project"
            aria-label="New Project"
          >
            <Plus />
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--panel-border] bg-white/60 px-6 py-12 text-center text-sm text-[--muted-text]">
          No local projects yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-[--panel-border] bg-white/80 p-4 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[--main-text]">
                  {project.name}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-[0.13em] text-[--muted-text]">
                  Theme:{" "}
                  {THEMES.find((theme) => theme.id === project.themeId)?.name}
                </p>
                <p className="mt-3 text-xs text-[--muted-text]">
                  Created {formatDate(project.createdAt)}
                </p>
                <p className="mt-1 text-xs text-[--muted-text]">
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
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
