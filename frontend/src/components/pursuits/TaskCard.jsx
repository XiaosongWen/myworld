import React from "react";
import LabelPill from "./LabelPill";

const STATUS_ICON = { "completed": "✓", "in-progress": "🔄", "in_progress": "🔄" };
const PRIORITY_CLASS = { high: "high", medium: "med", low: "low", none: "low" };

export default function TaskCard({ task, onToggleStatus, onOpenDetail, onEdit }) {
  if (!task) return null;
  const icon = STATUS_ICON[task.status] ?? "☐";
  const priorityClass = PRIORITY_CLASS[task.priority] ?? "low";
  const isDone = task.status === "completed";

  const itemLabels = task.labels || [];
  const isCompact = itemLabels.length > 2;

  return (
    <div className="task-item">
      <span
        className="task-status"
        onClick={(e) => { e.stopPropagation(); onToggleStatus?.(task.id); }}
        title="Toggle status"
      >
        {icon}
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, overflow: "visible", whiteSpace: "nowrap", minWidth: 0 }}>
        <span
          style={{ textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1, cursor: onOpenDetail ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          onClick={() => onOpenDetail?.(task.id)}
        >
          {task.title}
        </span>
        {itemLabels.map((lbl) => (
          <LabelPill key={lbl.id || lbl.name} label={lbl} compact={isCompact} />
        ))}
      </div>
      <div className={`priority-dot ${priorityClass}`} title={`${task.priority} priority`} />
      {task.due_date && (
        <span className="task-date">
          {isDone ? "Done" : new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}
      <button className="icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit?.(task); }} style={{ marginLeft: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
