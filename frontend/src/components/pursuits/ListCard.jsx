import React, { useState } from "react";
import LabelPill from "./LabelPill";
import usePursuitsStore from "../../stores/pursuitsStore";

export default function ListCard({ list, onOpenDetail, onEdit }) {
  const { commitments, createCommitment, updateCommitment, deleteCommitment } = usePursuitsStore();
  const [itemInput, setItemInput] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  if (!list) return null;

  const cardLabels = list.labels || [];

  const items = commitments
    .filter((c) => c.parent_id === list.id && (c.type === "sub-goal" || c.type === "task"))
    .filter((c) => showCompleted || c.status !== "completed")
    .sort((a, b) => {
      const aDone = a.status === "completed";
      const bDone = b.status === "completed";
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      if (aDone && bDone) {
        const timeA = new Date(a.updated_at || a.completed_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.completed_at || 0).getTime();
        return timeB - timeA;
      }
      const orderA = a.sort_order ?? 0;
      const orderB = b.sort_order ?? 0;
      return orderA - orderB;
    });
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const isBeforeToday = (item) => {
    if (item.status !== "completed") return false;
    const doneTime = item.updated_at || item.completed_at;
    if (!doneTime) return false;
    const d = new Date(doneTime);
    if (isNaN(d.getTime())) return false;
    const doneISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return doneISO < todayISO;
  };

  const handleToggleItem = async (item, e) => {
    e.stopPropagation();
    if (isBeforeToday(item)) {
      return;
    }
    const newStatus = item.status === "completed" ? "active" : "completed";
    try {
      await updateCommitment(item.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to update list item status:", err);
    }
  };

  const handleDeleteItem = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete item "${item.title}"?`)) {
      return;
    }
    try {
      await deleteCommitment(item.id);
    } catch (err) {
      console.error("Failed to delete list item:", err);
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const itemId = e.dataTransfer.getData("text/plain");
    const sourceType = e.dataTransfer.getData("source-type");
    const sourceParentId = e.dataTransfer.getData("source-parent-id");

    if ((sourceType === "list-item" && sourceParentId !== list.id) || sourceType === "task-card") {
      try {
        await updateCommitment(itemId, { parent_id: list.id, due_date: null });
      } catch (err) {
        console.error("Failed to move item to list:", err);
      }
    }
  };

  const handleItemDragStart = (e, item) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.setData("source-type", "list-item");
    e.dataTransfer.setData("source-parent-id", list.id);
    e.dataTransfer.setData("list-item", "true");
    e.dataTransfer.setData("parent-" + String(list.id).toLowerCase(), "true");
    
    window.dragManager = {
      draggedItemId: item.id,
      sourceType: "list-item",
      sourceParentId: list.id,
      sourceColumn: null,
    };
  };

  const handleItemDragOver = (e, targetItem) => {
    if (targetItem.status === "completed") return;
    const dm = window.dragManager;
    if (!dm) return;

    if (dm.sourceType === "list-item" && String(dm.sourceParentId) === String(list.id)) {
      e.preventDefault();
      if (dragOverItemId !== targetItem.id) {
        setDragOverItemId(targetItem.id);
      }
    } else if (dm.sourceType === "list-item" || dm.sourceType === "task-card") {
      e.preventDefault();
    }
  };

  const handleItemDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleItemDrop = async (e, targetItem) => {
    const sourceType = e.dataTransfer.getData("source-type");
    if (sourceType !== "list-item") {
      // Let it bubble up to handleDrop of ListCard container
      return;
    }

    const dragItemId = e.dataTransfer.getData("text/plain");
    const dragItem = items.find(it => it.id === dragItemId);
    if (!dragItem) {
      // It came from another list card! Let it bubble up to ListCard container's handleDrop!
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);

    if (dragItemId !== targetItem.id) {
      if (dragItem.status === "completed" || targetItem.status === "completed") return;

      const activeItems = items.filter(it => it.status !== "completed");
      const dragIndex = activeItems.findIndex(it => it.id === dragItemId);
      const targetIndex = activeItems.findIndex(it => it.id === targetItem.id);

      if (dragIndex !== -1 && targetIndex !== -1) {
        const reordered = [...activeItems];
        reordered.splice(dragIndex, 1);
        reordered.splice(targetIndex, 0, dragItem);

        const updates = reordered
          .map((it, i) => (it.sort_order !== i ? updateCommitment(it.id, { sort_order: i }) : null))
          .filter(Boolean);
        try {
          await Promise.all(updates);
        } catch (err) {
          console.error("Failed to update list item sort order:", err);
        }
      }
    }
  };

  const handleAddItem = async (e) => {
    if (e.key === "Enter" && itemInput.trim()) {
      e.preventDefault();
      e.stopPropagation();
      const text = itemInput.trim();
      setItemInput("");
      try {
        await createCommitment({
          title: text,
          type: "sub-goal",
          parent_id: list.id,
          status: "active",
        });
      } catch (err) {
        console.error("Failed to add list item:", err);
      }
    }
  };

  return (
    <div
      className="card"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragOver ? "2px dashed var(--accent)" : "1px solid var(--border)",
        boxShadow: isDragOver ? "0 0 0 4px var(--accent-glow)" : undefined,
        transition: "border var(--transition-fast), box-shadow var(--transition-fast)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, overflow: "visible", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
          <span
            style={{ cursor: onOpenDetail ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            onClick={() => onOpenDetail?.(list.id)}
            title="Open List details"
          >
            📋 {list.title}
          </span>
          {cardLabels.map((lbl) => (
            <LabelPill key={lbl.id || lbl.name} label={lbl} compact={cardLabels.length > 2} />
          ))}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            className="icon-btn"
            title={showCompleted ? "Hide completed items" : "Show completed items"}
            onClick={(e) => {
              e.stopPropagation();
              setShowCompleted(!showCompleted);
            }}
            style={{ opacity: showCompleted ? 0.8 : 0.4, width: 28, height: 28 }}
          >
            {showCompleted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
          <button
            className="icon-btn"
            title="Edit List"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(list);
            }}
            style={{ opacity: 0.6, width: 28, height: 28 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      {list.description && (
        <p className="text-muted text-sm" style={{ margin: "0 0 12px 0", fontSize: 13, lineHeight: 1.4 }}>
          {list.description}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => {
          const isDone = item.status === "completed";
          const isDoneBeforeToday = isBeforeToday(item);
          const itemRowLabels = item.labels || [];
          return (
            <div
              key={item.id}
              draggable={!isDone}
              onDragStart={(e) => handleItemDragStart(e, item)}
              onDragEnd={() => { window.dragManager = null; }}
              onDragOver={(e) => handleItemDragOver(e, item)}
              onDragLeave={handleItemDragLeave}
              onDrop={(e) => handleItemDrop(e, item)}
              style={{
                display: "flex",
                gap: 8,
                fontSize: 13,
                color: "var(--fg)",
                alignItems: "center",
                overflow: "visible",
                whiteSpace: "nowrap",
                minWidth: 0,
                cursor: isDone ? "default" : "grab",
                borderTop: dragOverItemId === item.id ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "border-top 0.1s ease",
              }}
            >
              <div
                className={`checkbox${isDone ? " checked" : ""}`}
                style={{
                  width: 14,
                  height: 14,
                  minWidth: 14,
                  cursor: isDoneBeforeToday ? "not-allowed" : "pointer",
                  opacity: isDoneBeforeToday ? 0.45 : 1,
                }}
                onClick={(e) => handleToggleItem(item, e)}
                title={isDoneBeforeToday ? "Items checked prior to today cannot be unchecked" : "Toggle item done/undo"}
              />
              <span
                style={{
                  textDecoration: isDone ? "line-through" : "none",
                  opacity: isDone ? 0.6 : 1,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: isDoneBeforeToday ? "default" : "pointer",
                }}
                onClick={(e) => handleToggleItem(item, e)}
                title={isDoneBeforeToday ? "Items checked prior to today cannot be unchecked" : "Toggle item done/undo"}
              >
                {item.title}
              </span>
              {itemRowLabels.map((lbl) => (
                <LabelPill key={lbl.id || lbl.name} label={lbl} compact={itemRowLabels.length > 2} />
              ))}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  minWidth: 46,
                  textAlign: "right",
                  opacity: 0.8,
                  display: "inline-block",
                }}
              >
                {isDone
                  ? new Date(item.updated_at || item.completed_at || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <button
                className="icon-btn"
                title="Edit item"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                style={{ opacity: 0.6, width: 22, height: 22 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                className="icon-btn"
                title="Delete item"
                onClick={(e) => handleDeleteItem(item, e)}
                style={{ opacity: 0.6, width: 22, height: 22 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Add Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          opacity: 0.85,
        }}
      >
        <span style={{ fontSize: 16, width: 14, textAlign: "center", fontWeight: 500, color: "var(--fg-muted)" }}>+</span>
        <input
          type="text"
          value={itemInput}
          onChange={(e) => setItemInput(e.target.value)}
          onKeyDown={handleAddItem}
          placeholder="Quick add item..."
          style={{
            border: "none",
            background: "transparent",
            fontSize: 13,
            outline: "none",
            color: "var(--fg)",
            width: "100%",
            cursor: "text",
            padding: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
