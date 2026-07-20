import React from "react";

export default function HabitChecklist({ habit, checked, streak, onCheckIn, onOpenDetail }) {
  if (!habit) return null;

  const isChecked = checked ?? (habit.status === "completed" || habit.checkedToday);
  const displayStreak = streak ?? habit.progress?.streak ?? 0;

  return (
    <div className="habit-item" onClick={onOpenDetail} style={{ cursor: onOpenDetail ? "pointer" : "default" }}>
      <div className="habit-left">
        <div
          className={`checkbox${isChecked ? " checked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn?.(habit.id);
          }}
          title={isChecked ? "Mark incomplete" : "Mark complete"}
        />
        <span>{habit.title}</span>
        {habit.config?.tags?.map((tag) => (
          <span key={tag} className={`tag ${tag}`}>{tag}</span>
        ))}
      </div>
      <div style={{ minWidth: 80, textAlign: "right" }}>
        {displayStreak > 0 ? (
          <span className="text-xs text-muted">🔥 {displayStreak} days</span>
        ) : (
          <span className="text-xs text-muted" style={{ visibility: "hidden" }}>🔥 0 days</span>
        )}
      </div>
    </div>
  );
}
