import { describe, expect, it } from "vitest";

import {
  addChildNode,
  countNodes,
  deleteNode,
  duplicateNode,
  findNodeById,
  findNodeDepth,
  formatDate,
  moveNodeAmongSiblings,
  moveNodeToParent,
  normalizeThemeId,
  parseImportedProjects,
  withFreshProjectIds,
  type OrgNode,
  type OrgProject,
} from "@/lib/org-chart";

function sampleTree(): OrgNode {
  return {
    id: "root",
    name: "Nameless",
    title: "CEO",
    children: [
      {
        id: "a",
        name: "Alice",
        title: "VP Engineering",
        children: [
          {
            id: "a1",
            name: "Sam",
            title: "Engineering Manager",
            children: [],
          },
        ],
      },
      {
        id: "b",
        name: "Bob",
        title: "VP Sales",
        children: [],
      },
    ],
  };
}

describe("org-chart unit", () => {
  it("adds a child beneath the target node", () => {
    const tree = sampleTree();
    const updated = addChildNode(tree, "a");

    expect(tree.children[0].children).toHaveLength(1);
    expect(updated.children[0].children).toHaveLength(2);
    expect(countNodes(updated)).toBe(5);
  });

  it("duplicates a node branch with fresh ids", () => {
    const tree = sampleTree();
    const updated = duplicateNode(tree, "a");

    expect(updated.children).toHaveLength(3);
    expect(updated.children[1].name).toBe("Alice Copy");
    expect(updated.children[1].id).not.toBe("a");
    expect(updated.children[1].children[0].id).not.toBe("a1");
    expect(countNodes(updated)).toBe(6);
  });

  it("deletes a node and all descendants", () => {
    const tree = sampleTree();
    const updated = deleteNode(tree, "a");

    expect(updated.children).toHaveLength(1);
    expect(updated.children[0].id).toBe("b");
    expect(countNodes(updated)).toBe(2);
  });

  it("parses exported project payloads", () => {
    const payload = {
      type: "org-chart-project",
      project: {
        id: "p1",
        name: "Exec Team",
        themeId: "forest",
        root: sampleTree(),
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    };

    const parsed = parseImportedProjects(payload);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Exec Team");
    expect(parsed[0].themeId).toBe("forest");
    expect(parsed[0].root.name).toBe("Nameless");
    expect(parsed[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(parsed[0].updatedAt).toBe("2026-01-15T00:00:00.000Z");
    expect(parsed[0].windowZoom).toBe(1);
    expect(parsed[0].printSettings.paperSize).toBe("a4");
    expect(parsed[0].fontSizes.titlePx).toBe(16);
    expect(parsed[0].fontSizes.namePx).toBe(14);
  });

  it("parses raw node payloads into a project", () => {
    const parsed = parseImportedProjects({
      name: "Root",
      title: "Top",
      children: [{ name: "Leaf", title: "Role", children: [] }],
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Imported Project");
    expect(parsed[0].root.name).toBe("Root");
    expect(parsed[0].root.children).toHaveLength(1);
  });

  it("normalizes unknown themes back to ocean", () => {
    expect(normalizeThemeId("sunset")).toBe("sunset");
    expect(normalizeThemeId("unknown-theme")).toBe("ocean");
  });

  it("formats timestamps as dd/mm/yyyy hh:mm", () => {
    expect(formatDate("2026-01-05T12:34:56")).toBe("05/01/2026 12:34");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("clones imported projects with new project and node ids", () => {
    const project: OrgProject = {
      id: "project-1",
      name: "Original",
      themeId: "ocean",
      spreadTillLevel: 3,
      fontSizes: {
        titlePx: 16,
        namePx: 14,
      },
      printSettings: {
        paperSize: "a4",
        orientation: "landscape",
        scaleMode: "fit",
        horizontalAlign: "center",
        verticalAlign: "top",
        customScalePercent: 100,
      },
      windowZoom: 1,
      root: sampleTree(),
      legend: {
        title: "Original",
        createdBy: "Alice",
        revisedBy: "Bob",
        date: "2026-01-01",
        revisionNumber: "2",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const cloned = withFreshProjectIds(project);

    expect(cloned.id).not.toBe(project.id);
    expect(cloned.root.id).not.toBe(project.root.id);
    expect(cloned.root.children[0].id).not.toBe(project.root.children[0].id);
    expect(cloned.name).toBe(project.name);
  });

  it("moves a node under a new parent", () => {
    const tree = sampleTree();
    const moved = moveNodeToParent(tree, "a1", "b");

    expect(moved.status).toBe("moved");

    const parentA = findNodeById(moved.root, "a");
    const parentB = findNodeById(moved.root, "b");

    expect(parentA?.children).toHaveLength(0);
    expect(parentB?.children.map((node) => node.id)).toContain("a1");
  });

  it("prevents moving the root", () => {
    const tree = sampleTree();
    const moved = moveNodeToParent(tree, "root", "b");

    expect(moved.status).toBe("source_is_root");
    expect(moved.root).toEqual(tree);
  });

  it("prevents cycle moves into descendants", () => {
    const tree = sampleTree();
    const moved = moveNodeToParent(tree, "a", "a1");

    expect(moved.status).toBe("invalid_cycle");
    expect(moved.root).toEqual(tree);
  });

  it("returns same_parent when destination is unchanged", () => {
    const tree = sampleTree();
    const moved = moveNodeToParent(tree, "a1", "a");

    expect(moved.status).toBe("same_parent");
    expect(moved.root).toEqual(tree);
  });

  it("moves nodes among siblings in forward and backward directions", () => {
    const tree = sampleTree();
    const movedRight = moveNodeAmongSiblings(tree, "a", 1);

    expect(movedRight.status).toBe("moved");
    expect(movedRight.root.children.map((node) => node.id)).toEqual(["b", "a"]);

    const movedLeft = moveNodeAmongSiblings(movedRight.root, "a", -1);

    expect(movedLeft.status).toBe("moved");
    expect(movedLeft.root.children.map((node) => node.id)).toEqual(["a", "b"]);
  });

  it("returns at_boundary when sibling move would go out of range", () => {
    const tree = sampleTree();
    const moved = moveNodeAmongSiblings(tree, "a", -1);

    expect(moved.status).toBe("at_boundary");
    expect(moved.root).toEqual(tree);
  });

  it("returns source_is_root when trying to reorder root", () => {
    const tree = sampleTree();
    const moved = moveNodeAmongSiblings(tree, "root", 1);

    expect(moved.status).toBe("source_is_root");
    expect(moved.root).toEqual(tree);
  });

  it("finds node depth in the hierarchy", () => {
    const tree = sampleTree();

    expect(findNodeDepth(tree, "root")).toBe(1);
    expect(findNodeDepth(tree, "a")).toBe(2);
    expect(findNodeDepth(tree, "a1")).toBe(3);
    expect(findNodeDepth(tree, "missing")).toBeNull();
  });
});
