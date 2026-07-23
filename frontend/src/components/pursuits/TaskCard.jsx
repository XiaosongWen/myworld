import React from "react";
import LabelPill from "./LabelPill";
import { formatLocalDateShort } from "../../utils/date";

const STATUS_ICON = { "completed": "✓", "in-progress": "🔄", "in_progress": "🔄" };
const PRIORITY_CLASS = { high: "high", medium: "med", low: "low", none: "low" };

export default function TaskCard({ task, onToggleStatus, onOpenDetail, onEdit }) {
  if (!task) return null;

  const icon = STATUS_ICON[task.status] ?? "☐";
  const priorityClass = PRIORITY_CLASS[task.priority] ?? "low";
  const isDone = task.status === "completed";

  const itemLabels = task.labels || [];
  const isCompact = itemLabels.length > 2;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const isDoneTime = task.updated_at || task.completed_at;
  let isDoneBeforeToday = false;
  if (isDone && isDoneTime) {
    const d = new Date(isDoneTime);
    if (!isNaN(d.getTime())) {
      const doneISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (doneISO < todayISO) {
        isDoneBeforeToday = true;
      }
    }
  }

  const isPastDue = task.due_date && task.due_date < todayISO && !isDone;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.setData("source-type", "task-card");
    e.dataTransfer.setData("source-due-date", task.due_date || "");
    e.dataTransfer.setData("task-card", "true");
    if (!task.due_date) {
      e.dataTransfer.setData("column-inbox", "true");
    } else if (task.due_date === todayISO) {
      e.dataTransfer.setData("column-today", "true");
    } else {
      e.dataTransfer.setData("column-upcoming", "true");
    }
    
    window.dragManager = {
      draggedItemId: task.id,
      sourceType: "task-card",
      sourceParentId: task.parent_id,
      sourceColumn: !task.due_date ? "inbox" : (task.due_date === todayISO ? "today" : "upcoming"),
    };
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (isDoneBeforeToday) return;
    onToggleStatus?.(task.id);
  };

  return (
    <div
      className="task-item"
      draggable={!isDone}
      onDragStart={handleDragStart}
      onDragEnd={() => { window.dragManager = null; }}
      style={{ cursor: isDone ? "default" : "grab" }}
    >
      <span
        className="task-status"
        onClick={handleStatusClick}
        style={{
          cursor: isDoneBeforeToday ? "not-allowed" : "pointer",
          opacity: isDoneBeforeToday ? 0.45 : 1,
        }}
        title={isDoneBeforeToday ? "Tasks completed prior to today cannot be unchecked" : "Toggle status"}
      >
        {icon}
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, overflow: "visible", whiteSpace: "nowrap", minWidth: 0 }}>
        <span
          style={{
            textDecoration: isDone ? "line-through" : "none",
            opacity: isDone ? 0.6 : 1,
            cursor: onOpenDetail ? "pointer" : "default",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={() => onOpenDetail?.(task.id)}
          title="Open Task details"
        >
          {task.config?.icon ? `${task.config.icon} ` : ""}{task.title}
        </span>
        {itemLabels.map((lbl) => (
          <LabelPill key={lbl.id || lbl.name} label={lbl} compact={isCompact} />
        ))}
      </div>
      <div className={`priority-dot ${priorityClass}`} title={`${task.priority} priority`} />
      {task.due_date && (
        <span
          className="task-date"
          style={{ color: isPastDue ? "var(--danger)" : undefined, fontWeight: isPastDue ? "600" : undefined }}
          title={isPastDue ? "Overdue" : "Due Date"}
        >
          {formatLocalDateShort(task.due_date)}
        </span>
      )}
      <button className="icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit?.(task); }} style={{ marginLeft: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
