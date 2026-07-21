import React from "react";
import LabelPill from "./LabelPill";

export default function HabitChecklist({ habit, checked, streak, onCheckIn, onOpenDetail }) {
  if (!habit) return null;

  const isChecked = checked ?? (habit.status === "completed" || habit.checkedToday);
  const displayStreak = streak ?? habit.progress?.streak ?? 0;
  const days = displayStreak % 7;
  const weeks = Math.floor(displayStreak / 7);
  const itemLabels = habit.labels || [];
  const isCompact = itemLabels.length > 2;

  return (
    <div className="habit-item" onClick={onOpenDetail} style={{ cursor: onOpenDetail ? "pointer" : "default" }}>
      <div className="habit-left" style={{ display: "flex", alignItems: "center", gap: 8, overflow: "visible", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
        <div
          className={`checkbox${isChecked ? " checked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn?.(habit.id);
          }}
          title={isChecked ? "Mark incomplete" : "Mark complete"}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{habit.title}</span>
        {itemLabels.map((lbl) => (
          <LabelPill key={lbl.id || lbl.name} label={lbl} compact={isCompact} />
        ))}
      </div>
      <div style={{ minWidth: 100, textAlign: "right" }}>
        <span className="streak-badge" style={{ opacity: displayStreak > 0 ? 1 : 0.5 }}>
          🔥 {days}d {weeks}w
        </span>
      </div>
    </div>
  );
}
