import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { LAST_PROJECT_KEY, STORAGE_KEY } from "@/lib/org-chart";

describe("Home integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "prompt").mockReturnValue("Acme Org");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "print").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("creates a project and adds a child node via context menu actions", async () => {
    const user = userEvent.setup();

    render(<Home />);

    await user.click(await screen.findByRole("button", { name: "New Project" }));

    expect(await screen.findByDisplayValue("Acme Org")).toBeInTheDocument();
    expect(screen.getByText("1 nodes in this chart")).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole("article"));
    await user.click(screen.getByRole("button", { name: "Add Node Beneath" }));

    expect(await screen.findByText("2 nodes in this chart")).toBeInTheDocument();
  });

  it("restores the last active local project and allows theme switching", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "project-1",
          name: "Stored Team",
          themeId: "forest",
          root: {
            id: "root-1",
            name: "CEO",
            title: "Leader",
            children: [],
          },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
    localStorage.setItem(LAST_PROJECT_KEY, "project-1");

    const user = userEvent.setup();
    render(<Home />);

    expect(await screen.findByDisplayValue("Stored Team")).toBeInTheDocument();
    expect(document.querySelector('main[data-theme="forest"]')).toBeTruthy();

    await user.selectOptions(screen.getByRole("combobox"), "sunset");

    expect(document.querySelector('main[data-theme="sunset"]')).toBeTruthy();
  });

  it("moves a node to a selected new parent", async () => {
    const user = userEvent.setup();

    render(<Home />);

    await user.click(await screen.findByRole("button", { name: "New Project" }));

    fireEvent.contextMenu(screen.getAllByRole("article")[0]);
    await user.click(screen.getByRole("button", { name: "Add Node Beneath" }));

    fireEvent.contextMenu(screen.getAllByRole("article")[0]);
    await user.click(screen.getByRole("button", { name: "Add Node Beneath" }));

    fireEvent.contextMenu(screen.getAllByRole("article")[1]);
    await user.click(screen.getByRole("button", { name: "Add Node Beneath" }));

    expect(await screen.findByText("4 nodes in this chart")).toBeInTheDocument();

    fireEvent.contextMenu(screen.getAllByRole("article")[2]);
    await user.click(screen.getByRole("button", { name: "Select New Parent" }));

    fireEvent.contextMenu(screen.getAllByRole("article")[3]);
    await user.click(
      screen.getByRole("button", { name: "Move Selected Node Here" }),
    );

    await waitFor(() => {
      const storedProjects = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as Array<{ root: { children: Array<{ children: unknown[] }> } }>;

      expect(storedProjects[0].root.children[0].children).toHaveLength(0);
      expect(storedProjects[0].root.children[1].children).toHaveLength(1);
    });
  });
});
