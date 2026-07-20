import React from "react";

export default function GoalCard({ goal, onOpenDetail, onEdit, showSubGoals = false }) {
  if (!goal) return null;
  const percent = Math.round(goal.progress?.percent ?? 0);

  let fillColor = "var(--accent)";
  if (percent >= 100) fillColor = "var(--success)";
  else if (percent >= 60) fillColor = "var(--success)";
  else if (percent >= 30) fillColor = "var(--warning)";

  return (
    <div className="card" onClick={() => onOpenDetail?.(goal.id)} style={{ cursor: onOpenDetail ? "pointer" : "default" }}>
      <div className="goal-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          🎯 {goal.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="text-muted">{percent}%</span>
          <button className="icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit?.(goal); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="progress-track" style={{ margin: "12px 0" }}>
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, background: fillColor, transition: "width 1s ease-out" }}
        />
      </div>

      {goal.due_date && (
        <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
          Due: {new Date(goal.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}

      {showSubGoals && (
        <div className="sub-tasks">
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, opacity: 0.6 }}>
            <span style={{ fontSize: 16, width: 14, textAlign: "center", fontWeight: 500 }}>+</span>
            <input
              type="text"
              placeholder="Add sub-goal..."
              style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", color: "var(--fg)", width: "100%", cursor: "text", padding: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
