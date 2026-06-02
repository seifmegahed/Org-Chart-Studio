"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type OrgNode } from "@/lib/org-chart";
import { MoreVertical } from "lucide-react";

type TreeNodeProps = {
  node: OrgNode;
  depth: number;
  spreadTillLevel: number;
  titleFontSizePx: number;
  nameFontSizePx: number;
  onNodeFieldChange: (
    nodeId: string,
    field: "name" | "title",
    value: string,
  ) => void;
  onOpenMenu: (nodeId: string, x: number, y: number, depth: number) => void;
};

let measurementElement: HTMLSpanElement | null | undefined;
const TITLE_MAX_LENGTH = 30;
const MEMBER_NAME_MAX_LENGTH = 30;

function getMeasurementElement(): HTMLSpanElement | null {
  if (measurementElement !== undefined) {
    return measurementElement;
  }

  if (typeof document === "undefined" || !document.body) {
    measurementElement = null;
    return measurementElement;
  }

  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-99999px";
  span.style.top = "-99999px";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "pre";
  span.style.pointerEvents = "none";
  document.body.appendChild(span);
  measurementElement = span;

  return measurementElement;
}

function measureTextWidthPx(
  text: string,
  fontWeight: string,
  fontSizePx: number,
  letterSpacingEm = 0,
): number {
  const span = getMeasurementElement();
  if (!span) {
    return text.length * 8;
  }

  span.style.fontFamily =
    '"Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif';
  span.style.fontWeight = fontWeight;
  span.style.fontSize = `${fontSizePx}px`;
  span.style.letterSpacing = `${letterSpacingEm}em`;
  span.textContent = text;

  return span.getBoundingClientRect().width;
}

function splitMemberLines(value: string): string[] {
  const lines = value
    .split("\n")
    .map((line) => line.slice(0, MEMBER_NAME_MAX_LENGTH));

  return lines.length > 0 ? lines : [""];
}

export function TreeNode({
  node,
  depth,
  spreadTillLevel,
  titleFontSizePx,
  nameFontSizePx,
  onNodeFieldChange,
  onOpenMenu,
}: TreeNodeProps) {
  const headerRoleText = node.title.trim() || "Role";
  const memberLines = useMemo(() => splitMemberLines(node.name), [node.name]);
  const bodyNameText = memberLines.reduce(
    (longestLine, line) =>
      line.length > longestLine.length ? line : longestLine,
    "",
  );
  const isHorizontalNode = depth > spreadTillLevel;
  const childListHorizontal = depth >= spreadTillLevel;
  const nodeItemClassName = isHorizontalNode
    ? "org-tree-horizontal-node"
    : "org-tree-centered-node";
  const horizontalIndentRem = 1.45;
  const childListRef = useRef<HTMLUListElement | null>(null);
  const memberInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusRowIndexRef = useRef<number | null>(null);
  const [childrenLastMidPx, setChildrenLastMidPx] = useState(0);
  const childSignature = useMemo(
    () => node.children.map((child) => child.id).join("|"),
    [node.children],
  );

  useEffect(() => {
    if (!childListHorizontal || node.children.length === 0) {
      return;
    }

    const listElement = childListRef.current;
    if (!listElement) {
      return;
    }

    let frameId = 0;
    const syncLastChildMidpoint = () => {
      const lastItem = listElement.lastElementChild;
      if (!(lastItem instanceof HTMLElement)) {
        setChildrenLastMidPx(0);
        return;
      }

      const lastCard = lastItem.firstElementChild;
      if (
        !(lastCard instanceof HTMLElement) ||
        !lastCard.classList.contains("node-card")
      ) {
        setChildrenLastMidPx(0);
        return;
      }

      const listRect = listElement.getBoundingClientRect();
      const cardRect = lastCard.getBoundingClientRect();
      const midpoint = cardRect.top - listRect.top + cardRect.height / 2;

      setChildrenLastMidPx((currentValue) => {
        if (Math.abs(currentValue - midpoint) < 0.5) {
          return currentValue;
        }

        return midpoint;
      });
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncLastChildMidpoint);
    };

    scheduleSync();
    window.addEventListener("resize", scheduleSync);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleSync);
      observer.observe(listElement);

      Array.from(listElement.children).forEach((childElement) => {
        if (!(childElement instanceof HTMLElement)) {
          return;
        }

        const directCard = childElement.firstElementChild;
        if (
          directCard instanceof HTMLElement &&
          directCard.classList.contains("node-card")
        ) {
          observer?.observe(directCard);
        }
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleSync);
      observer?.disconnect();
    };
  }, [childListHorizontal, childSignature, node.children.length]);

  useEffect(() => {
    const pendingFocusRowIndex = pendingFocusRowIndexRef.current;
    if (pendingFocusRowIndex === null) {
      return;
    }

    const targetInput = memberInputRefs.current[pendingFocusRowIndex];
    targetInput?.focus();
    pendingFocusRowIndexRef.current = null;
  }, [memberLines]);

  const nameWidthPx = measureTextWidthPx(
    headerRoleText,
    "800",
    titleFontSizePx,
    0.01,
  );
  const roleWidthPx = measureTextWidthPx(bodyNameText, "600", nameFontSizePx);

  const headerHorizontalPaddingPx = 16 * 2;
  const bodyHorizontalPaddingPx = 14.08 * 2;
  const bodyIconAndGapPx = 21.6 + 8.8;
  const headerWidthPx = nameWidthPx + headerHorizontalPaddingPx;
  const bodyWidthPx = roleWidthPx + bodyIconAndGapPx + bodyHorizontalPaddingPx;
  const widthSafetyBufferPx = 10;
  const nodeCardWidthPx = Math.ceil(
    Math.max(headerWidthPx, bodyWidthPx) + widthSafetyBufferPx,
  );

  const nodeCardStyle = {
    "--node-card-width": `${nodeCardWidthPx}px`,
    "--node-title-font-size": `${titleFontSizePx}px`,
    "--node-name-font-size": `${nameFontSizePx}px`,
  } as CSSProperties;

  const nodeListItemStyle = {
    "--node-card-width": `${nodeCardWidthPx}px`,
    ...(isHorizontalNode
      ? {
          "--horizontal-indent": `${horizontalIndentRem}rem`,
        }
      : {}),
  } as CSSProperties;
  const childListStyle = childListHorizontal
    ? ({
        "--children-last-mid": `${Math.max(0, childrenLastMidPx)}px`,
      } as CSSProperties)
    : undefined;

  const updateMemberLine = (lineIndex: number, value: string) => {
    const nextLines = [...memberLines];
    nextLines[lineIndex] = value.slice(0, MEMBER_NAME_MAX_LENGTH);
    onNodeFieldChange(node.id, "name", nextLines.join("\n"));
  };

  const insertMemberLineBelow = (lineIndex: number) => {
    const nextLines = [...memberLines];
    nextLines.splice(lineIndex + 1, 0, "");
    onNodeFieldChange(node.id, "name", nextLines.join("\n"));
    pendingFocusRowIndexRef.current = lineIndex + 1;
  };

  const deleteMemberLine = (lineIndex: number) => {
    if (lineIndex <= 0 || lineIndex >= memberLines.length) {
      return;
    }

    const nextLines = [...memberLines];
    nextLines.splice(lineIndex, 1);
    onNodeFieldChange(node.id, "name", nextLines.join("\n"));
    pendingFocusRowIndexRef.current = lineIndex - 1;
  };

  return (
    <li
      className={nodeItemClassName}
      style={nodeListItemStyle}
      data-node-id={node.id}
      data-node-depth={depth}
    >
      <article
        className="node-card"
        style={nodeCardStyle}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenMenu(node.id, event.clientX, event.clientY, depth);
        }}
      >
        <button
          type="button"
          className="node-menu-trigger print-hidden"
          aria-label="Open node menu"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const anchorRect = event.currentTarget.getBoundingClientRect();
            onOpenMenu(node.id, anchorRect.left, anchorRect.bottom + 6, depth);
          }}
        >
          <MoreVertical  className="h-4"/>
        </button>
        <div className="node-header">
          <input
            value={node.title}
            onChange={(event) =>
              onNodeFieldChange(
                node.id,
                "title",
                event.target.value.slice(0, TITLE_MAX_LENGTH),
              )
            }
            className="node-role-input"
            placeholder="Role"
            maxLength={TITLE_MAX_LENGTH}
          />
        </div>

        <div className="node-body">
          {memberLines.map((memberLine, lineIndex) => (
            <div
              key={`${node.id}-member-${lineIndex}`}
              className="node-person-row"
            >
              <span className="node-person-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M12 12.25a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.25Zm0 1.5c-4.29 0-7.75 2.43-7.75 5.43a.82.82 0 0 0 .82.82h13.86a.82.82 0 0 0 .82-.82c0-3-3.46-5.43-7.75-5.43Z" />
                </svg>
              </span>
              <input
                ref={(element) => {
                  memberInputRefs.current[lineIndex] = element;
                }}
                value={memberLine}
                onChange={(event) => {
                  updateMemberLine(lineIndex, event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.shiftKey) {
                    event.preventDefault();
                    insertMemberLineBelow(lineIndex);
                    return;
                  }

                  if (
                    event.key === "Backspace" &&
                    lineIndex > 0 &&
                    memberLine.length === 0
                  ) {
                    event.preventDefault();
                    deleteMemberLine(lineIndex);
                  }
                }}
                className="node-name-input"
                placeholder="Name"
                maxLength={MEMBER_NAME_MAX_LENGTH}
              />
            </div>
          ))}
        </div>
      </article>

      {node.children.length > 0 ? (
        <ul
          ref={childListHorizontal ? childListRef : undefined}
          className={
            childListHorizontal ? "org-tree-horizontal-list" : undefined
          }
          style={childListStyle}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              spreadTillLevel={spreadTillLevel}
              titleFontSizePx={titleFontSizePx}
              nameFontSizePx={nameFontSizePx}
              onNodeFieldChange={onNodeFieldChange}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
