"use client";

type NodeContextMenuProps = {
  x: number;
  y: number;
  nodeId: string;
  disableDuplicateDelete: boolean;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  moveBackwardLabel: string;
  moveForwardLabel: string;
  canStartReparent: boolean;
  isReparentMode: boolean;
  canMoveSelectedHere: boolean;
  onMoveBackward: (nodeId: string) => void;
  onMoveForward: (nodeId: string) => void;
  onAddBeneath: (nodeId: string) => void;
  onStartReparent: (nodeId: string) => void;
  onMoveSelectedHere: (nodeId: string) => void;
  onCancelReparent: () => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
};

export function NodeContextMenu({
  x,
  y,
  nodeId,
  disableDuplicateDelete,
  canMoveBackward,
  canMoveForward,
  moveBackwardLabel,
  moveForwardLabel,
  canStartReparent,
  isReparentMode,
  canMoveSelectedHere,
  onMoveBackward,
  onMoveForward,
  onAddBeneath,
  onStartReparent,
  onMoveSelectedHere,
  onCancelReparent,
  onDuplicate,
  onDelete,
}: NodeContextMenuProps) {
  return (
    <div
      className="context-menu print-hidden"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button onClick={() => onAddBeneath(nodeId)}>Add Node Beneath</button>
      <button
        onClick={() => onMoveBackward(nodeId)}
        disabled={!canMoveBackward}
        title={canMoveBackward ? undefined : "Cannot move further"}
      >
        {moveBackwardLabel}
      </button>
      <button
        onClick={() => onMoveForward(nodeId)}
        disabled={!canMoveForward}
        title={canMoveForward ? undefined : "Cannot move further"}
      >
        {moveForwardLabel}
      </button>
      <button
        onClick={() => onStartReparent(nodeId)}
        disabled={!canStartReparent}
        title={canStartReparent ? undefined : "Root node cannot be moved"}
      >
        Select New Parent
      </button>
      {isReparentMode ? (
        <button
          onClick={() => onMoveSelectedHere(nodeId)}
          disabled={!canMoveSelectedHere}
          title={
            canMoveSelectedHere
              ? undefined
              : "Choose a node that is not the selected node or its descendant"
          }
        >
          Move Selected Node Here
        </button>
      ) : null}
      <button
        onClick={() => onDuplicate(nodeId)}
        disabled={disableDuplicateDelete}
        title={disableDuplicateDelete ? "Root node cannot be duplicated" : undefined}
      >
        Duplicate Node
      </button>
      <button
        className="danger"
        onClick={() => onDelete(nodeId)}
        disabled={disableDuplicateDelete}
        title={disableDuplicateDelete ? "Root node cannot be deleted" : undefined}
      >
        Delete Node
      </button>
      {isReparentMode ? (
        <button onClick={onCancelReparent}>Cancel Parent Selection</button>
      ) : null}
    </div>
  );
}
