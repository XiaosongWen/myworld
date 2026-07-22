import React, { useState } from "react";
import LabelPill from "./LabelPill";
import usePursuitsStore from "../../stores/pursuitsStore";
import { formatLocalDateLong } from "../../utils/date";

export default function GoalCard({ goal, onOpenDetail, onEdit, showSubGoals = false }) {
  const { commitments, createCommitment, updateCommitment, deleteCommitment } = usePursuitsStore();
  const [subTaskInput, setSubTaskInput] = useState("");

  if (!goal) return null;

  // Retrieve sub-goals linked to this goal via parent_id
  const subGoals = commitments
    .filter((c) => c.parent_id === goal.id || (c.type === "sub-goal" && c.parent_id === goal.id))
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

  // Compute percentage from subGoals if available, else fallback to goal.progress.percent
  let percent = Math.round(goal.progress?.percent ?? 0);
  if (subGoals.length > 0) {
    const doneCount = subGoals.filter((s) => s.status === "completed").length;
    percent = Math.round((doneCount / subGoals.length) * 100);
  }

  let fillColor = "var(--accent)";
  if (percent >= 100) fillColor = "var(--success)";
  else if (percent >= 60) fillColor = "var(--success)";
  else if (percent >= 30) fillColor = "var(--warning)";

  const handleAddSubGoal = async (e) => {
    if (e.key === "Enter" && subTaskInput.trim()) {
      e.preventDefault();
      e.stopPropagation();
      const title = subTaskInput.trim();
      setSubTaskInput("");
      try {
        await createCommitment({
          title,
          type: "sub-goal",
          status: "active",
          parent_id: goal.id,
        });
      } catch (err) {
        console.error("Failed to create sub-goal commitment:", err);
      }
    }
  };

  const handleToggleSubGoal = async (subGoal, e) => {
    e.stopPropagation();
    const isDone = subGoal.status === "completed";
    const newStatus = isDone ? "active" : "completed";
    try {
      await updateCommitment(subGoal.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle sub-goal status:", err);
    }
  };

  const handleDeleteSubGoal = async (subGoal, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete sub-goal "${subGoal.title}"?`)) {
      return;
    }
    try {
      await deleteCommitment(subGoal.id);
    } catch (err) {
      console.error("Failed to delete sub-goal:", err);
    }
  };

  const [dragOverSubGoalId, setDragOverSubGoalId] = useState(null);

  const handleSubGoalDragStart = (e, sub) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", sub.id);
    e.dataTransfer.setData("source-type", "goal-subgoal");
    e.dataTransfer.setData("source-parent-id", goal.id);
    e.dataTransfer.setData("parent-" + String(goal.id).toLowerCase(), "true");
    
    window.dragManager = {
      draggedItemId: sub.id,
      sourceType: "goal-subgoal",
      sourceParentId: goal.id,
      sourceColumn: null,
    };
  };

  const handleSubGoalDragOver = (e, targetSub) => {
    if (targetSub.status === "completed") return;
    const dm = window.dragManager;
    if (!dm || dm.sourceType !== "goal-subgoal" || String(dm.sourceParentId) !== String(goal.id)) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragOverSubGoalId !== targetSub.id) {
      setDragOverSubGoalId(targetSub.id);
    }
  };

  const handleSubGoalDragLeave = (e) => {
    e.stopPropagation();
    setDragOverSubGoalId(null);
  };

  const handleSubGoalDrop = async (e, targetSub) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSubGoalId(null);

    const dragSubId = e.dataTransfer.getData("text/plain");
    const sourceType = e.dataTransfer.getData("source-type");
    const sourceParentId = e.dataTransfer.getData("source-parent-id");

    if (sourceType === "goal-subgoal" && sourceParentId === goal.id && dragSubId !== targetSub.id) {
      const dragSub = subGoals.find(s => s.id === dragSubId);
      if (!dragSub || dragSub.status === "completed" || targetSub.status === "completed") return;

      const activeSubs = subGoals.filter(s => s.status !== "completed");
      const dragIndex = activeSubs.findIndex(s => s.id === dragSubId);
      const targetIndex = activeSubs.findIndex(s => s.id === targetSub.id);

      if (dragIndex !== -1 && targetIndex !== -1) {
        const reordered = [...activeSubs];
        reordered.splice(dragIndex, 1);
        reordered.splice(targetIndex, 0, dragSub);

        for (let i = 0; i < reordered.length; i++) {
          const s = reordered[i];
          if (s.sort_order !== i) {
            try {
              await updateCommitment(s.id, { sort_order: i });
            } catch (err) {
              console.error("Failed to update sub-goal sort order:", err);
            }
          }
        }
      }
    }
  };

  return (
    <div className="card" onClick={() => onOpenDetail?.(goal.id)} style={{ cursor: onOpenDetail ? "pointer" : "default" }}>
      <div className="goal-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, overflow: "visible", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.config?.icon || "🎯"} {goal.title}</span>
          {(goal.labels || []).map((lbl) => (
            <LabelPill key={lbl.id || lbl.name} label={lbl} compact={(goal.labels || []).length > 2} />
          ))}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="text-muted">{percent}%</span>
          {onEdit && (
            <button className="icon-btn" title="Edit Goal" onClick={(e) => { e.stopPropagation(); onEdit?.(goal); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="progress-track" style={{ margin: "12px 0" }}>
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, background: fillColor, transition: "width 0.4s ease-out" }}
        />
      </div>

      {goal.due_date && (
        <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
          Due: {formatLocalDateLong(goal.due_date)}
        </div>
      )}

      {showSubGoals && (
        <div className="sub-tasks" style={{ marginTop: 8 }}>
          {subGoals.map((sub) => {
            const isDone = sub.status === "completed";
            const doneDate = isDone && sub.updated_at
              ? new Date(sub.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : null;

            return (
              <div
                key={sub.id}
                draggable={!isDone}
                onDragStart={(e) => handleSubGoalDragStart(e, sub)}
                onDragEnd={() => { window.dragManager = null; }}
                onDragOver={(e) => handleSubGoalDragOver(e, sub)}
                onDragLeave={handleSubGoalDragLeave}
                onDrop={(e) => handleSubGoalDrop(e, sub)}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--fg)",
                  marginBottom: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                  cursor: isDone ? "default" : "grab",
                  borderTop: dragOverSubGoalId === sub.id ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "border-top 0.1s ease",
                }}
              >
                <div
                  className={`checkbox${isDone ? " checked" : ""}`}
                  style={{ width: 14, height: 14, minWidth: 14, cursor: "pointer" }}
                  onClick={(e) => handleToggleSubGoal(sub, e)}
                />
                <span
                  style={{
                    textDecoration: isDone ? "line-through" : "none",
                    opacity: isDone ? 0.6 : 1,
                  }}
                >
                  {sub.title}
                </span>

                {(sub.labels || []).map((lbl) => (
                  <LabelPill key={lbl.id || lbl.name} label={lbl} compact={(sub.labels || []).length > 2} />
                ))}

                <div style={{ flex: 1 }} />

                {isDone && doneDate && (
                  <span className="text-muted" style={{ fontSize: "11px", opacity: 0.7, marginRight: 4 }}>
                    ✓ {doneDate}
                  </span>
                )}

                <button
                  className="icon-btn"
                  title="Edit sub-goal"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(sub); }}
                  style={{ opacity: 0.6, width: 24, height: 24 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  title="Delete sub-goal"
                  onClick={(e) => handleDeleteSubGoal(sub, e)}
                  style={{ opacity: 0.6, width: 24, height: 24 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, opacity: 0.8 }}>
            <span style={{ fontSize: 16, width: 14, textAlign: "center", fontWeight: 500, color: "var(--fg-muted)" }}>+</span>
            <input
              type="text"
              value={subTaskInput}
              onChange={(e) => setSubTaskInput(e.target.value)}
              onKeyDown={handleAddSubGoal}
              placeholder="Add sub-goal..."
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
      )}
    </div>
  );
}
