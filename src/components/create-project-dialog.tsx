"use client";

import type { FormEvent } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateProjectDialogProps {
  open: boolean;
  projectName: string;
  suggestedName: string;
  onOpenChange: (open: boolean) => void;
  onProjectNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CreateProjectDialog({
  open,
  projectName,
  suggestedName,
  onOpenChange,
  onProjectNameChange,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Pick a project name. You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <input
            className="mt-4 w-full rounded-lg border border-[--panel-border] px-3 py-2 text-sm font-semibold text-[--main-text] outline-none ring-[--accent-color] focus:ring-2"
            value={projectName}
            onChange={(event) => {
              onProjectNameChange(event.target.value);
            }}
            placeholder={suggestedName}
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
            <button type="submit" className="primary-btn min-w-30">
              Create Project
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
