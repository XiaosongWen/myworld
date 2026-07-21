import React, { useEffect, useState } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import Timeline from "../components/pursuits/Timeline";

export default function CommitmentDetail({ commitmentId, onClose, onEdit }) {
  const { commitments, deleteCommitment, fetchRecords, records, labels: storeLabels } = usePursuitsStore();

  const commitment = commitments.find((c) => c.id === commitmentId);

  useEffect(() => {
    if (commitmentId) {
      fetchRecords({ commitment_id: commitmentId });
    }
  }, [commitmentId, fetchRecords]);

  if (!commitmentId || !commitment) return null;

  const subGoals = commitments.filter(
    (c) => c.parent_id === commitment.id || (c.type === "sub-goal" && c.parent_id === commitment.id)
  );

  let percent = Math.round(commitment.progress?.percent ?? 0);
  if (commitment.type === "goal" && subGoals.length > 0) {
    const doneCount = subGoals.filter((s) => s.status === "completed").length;
    percent = Math.round((doneCount / subGoals.length) * 100);
  }

  const streak = commitment.progress?.streak ?? 0;

  const displayLabels = (commitment.labels && commitment.labels.length > 0)
    ? commitment.labels
    : (commitment.config?.tags || []).map((t) => storeLabels.find((l) => l.name.toLowerCase() === t.toLowerCase()) || { id: t, name: t, color: "#3b82f6" });

  const handleArchive = async () => {
    if (window.confirm(`Are you sure you want to archive "${commitment.title}"?`)) {
      try {
        await deleteCommitment(commitmentId);
        onClose?.();
      } catch (err) {
        console.error("Failed to archive commitment:", err);
      }
    }
  };

  // Build sorted activity timeline
  const activityEvents = [];

  // 1. Goal creation event
  if (commitment.created_at) {
    activityEvents.push({
      id: `${commitment.id}-created`,
      icon: commitment.type === "goal" ? "🎯" : "📌",
      content: `${commitment.type.charAt(0).toUpperCase() + commitment.type.slice(1)} created: "${commitment.title}"`,
      time: new Date(commitment.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date(commitment.created_at).getTime(),
    });
  }

  // 2. Main Commitment label activity events
  displayLabels.forEach((lbl) => {
    const color = lbl.color || "#3b82f6";
    activityEvents.push({
      id: `${commitment.id}-label-${lbl.id || lbl.name}`,
      icon: "🏷️",
      content: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          Label added:
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "1px 6px",
              borderRadius: "10px",
              background: `${color}18`,
              border: `1px solid ${color}40`,
              color: color,
              fontSize: "11px",
              fontWeight: "500",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
            {lbl.name}
          </span>
        </span>
      ),
      time: lbl.created_at
        ? new Date(lbl.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Label attached",
      timestamp: lbl.created_at ? new Date(lbl.created_at).getTime() : (new Date(commitment.created_at || Date.now()).getTime() + 100),
    });
  });

  // 3. Sub-goals creation, label, and completion events
  subGoals.forEach((sub) => {
    if (sub.created_at) {
      activityEvents.push({
        id: `${sub.id}-created`,
        icon: "➕",
        content: `Added sub-goal: "${sub.title}"`,
        time: new Date(sub.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(sub.created_at).getTime(),
      });
    }

    const subDisplayLabels = (sub.labels && sub.labels.length > 0)
      ? sub.labels
      : (sub.config?.tags || []).map((t) => storeLabels.find((l) => l.name.toLowerCase() === t.toLowerCase()) || { id: t, name: t, color: "#3b82f6" });

    subDisplayLabels.forEach((lbl) => {
      const color = lbl.color || "#3b82f6";
      activityEvents.push({
        id: `${sub.id}-label-${lbl.id || lbl.name}`,
        icon: "🏷️",
        content: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            Label
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 6px",
                borderRadius: "10px",
                background: `${color}18`,
                border: `1px solid ${color}40`,
                color: color,
                fontSize: "11px",
                fontWeight: "500",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
              {lbl.name}
            </span>
            added to sub-goal "{sub.title}"
          </span>
        ),
        time: lbl.created_at
          ? new Date(lbl.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : "Label attached",
        timestamp: lbl.created_at ? new Date(lbl.created_at).getTime() : (new Date(sub.created_at || Date.now()).getTime() + 100),
      });
    });

    if (sub.status === "completed" && sub.updated_at) {
      activityEvents.push({
        id: `${sub.id}-done`,
        icon: "✅",
        content: `Completed sub-goal: "${sub.title}"`,
        time: new Date(sub.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(sub.updated_at).getTime(),
      });
    }
  });

  // 4. DB Records
  const commitmentRecords = records.filter((r) => r.commitment_id === commitmentId);
  commitmentRecords.forEach((r) => {
    const dt = r.created_at ? new Date(r.created_at) : (r.date ? new Date(r.date) : null);
    activityEvents.push({
      id: r.id,
      icon: "⚡",
      content: r.value !== undefined ? `Log entry: ${r.value}` : "Recorded check-in",
      time: dt ? dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : r.date,
      timestamp: dt ? dt.getTime() : 0,
    });
  });

  // Sort timeline by timestamp descending (newest first)
  activityEvents.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "550px",
      backgroundColor: "var(--surface-raised)",
      borderLeft: "1px solid var(--border)",
      zIndex: 1000,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
      padding: "24px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>{commitment.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
          {commitment.due_date && (
            <span className="text-muted" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
              Due: {new Date(commitment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
          <button className="icon-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      <div className="text-muted text-sm" style={{ marginBottom: "12px" }}>
        {commitment.type.toUpperCase()} · Status: {commitment.status}
      </div>

      {/* Render Labels */}
      {displayLabels.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {displayLabels.map((lbl) => {
            const color = lbl.color || "#3b82f6";
            return (
              <span
                key={lbl.id || lbl.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  color: color,
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                {lbl.name}
              </span>
            );
          })}
        </div>
      )}

      {commitment.description && (
        <p className="text-sm" style={{ color: "var(--fg-muted)", marginBottom: "20px" }}>
          {commitment.description}
        </p>
      )}

      {commitment.type === "goal" && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
            <span>Overall Progress</span>
            <span style={{ fontWeight: 600, color: percent >= 100 ? "var(--success)" : "var(--accent)" }}>{percent}%</span>
          </div>
          <div className="progress-track" style={{ height: "10px", backgroundColor: "var(--surface)" }}>
            <div
              className="progress-fill blue"
              style={{
                width: `${percent}%`,
                backgroundColor: percent >= 100 ? "var(--success)" : "var(--accent)",
                transition: "width 0.4s ease-out",
              }}
            />
          </div>
        </div>
      )}

      {commitment.type === "habit" && (
        <div style={{ marginBottom: "24px", display: "flex", gap: "16px" }}>
          <div style={{ background: "var(--surface)", padding: "12px 16px", borderRadius: "8px", flex: 1 }}>
            <div className="text-xs text-muted">Current Streak</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--fg)" }}>🔥 {streak} days</div>
          </div>
          <div style={{ background: "var(--surface)", padding: "12px 16px", borderRadius: "8px", flex: 1 }}>
            <div className="text-xs text-muted">Target / Week</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--fg)" }}>{commitment.config?.target_count || 7} days</div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <h3 style={{ fontSize: "15px", fontWeight: "600", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginTop: "12px", marginBottom: "16px" }}>
        Activity Timeline ({activityEvents.length})
      </h3>
      <div style={{ flex: 1 }}>
        <Timeline records={activityEvents} />
      </div>

      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
        <button
          className="pill-btn"
          onClick={() => {
            onClose?.();
            onEdit?.(commitment);
          }}
        >
          Edit Commitment
        </button>
        <button
          className="pill-btn"
          onClick={handleArchive}
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          Archive
        </button>
      </div>
    </div>
  );
}
