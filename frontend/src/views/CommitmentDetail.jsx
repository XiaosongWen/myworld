import React, { useEffect, useState } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import Timeline from "../components/pursuits/Timeline";

export default function CommitmentDetail({ commitmentId, onClose, onEdit }) {
  const { commitments, deleteCommitment, fetchRecords, records } = usePursuitsStore();

  const commitment = commitments.find((c) => c.id === commitmentId);

  useEffect(() => {
    if (commitmentId) {
      fetchRecords({ commitment_id: commitmentId });
    }
  }, [commitmentId, fetchRecords]);

  const commitmentRecords = records.filter((r) => r.commitment_id === commitmentId);

  if (!commitmentId || !commitment) return null;

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

  const percent = Math.round(commitment.progress?.percent ?? 0);
  const streak = commitment.progress?.streak ?? 0;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>{commitment.title}</h2>
        <button className="icon-btn" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="text-muted text-sm mb-4" style={{ marginBottom: "16px" }}>
        {commitment.type.toUpperCase()} · Status: {commitment.status}
      </div>

      {commitment.description && (
        <p className="text-sm" style={{ color: "var(--fg-muted)", marginBottom: "20px" }}>
          {commitment.description}
        </p>
      )}

      {commitment.type === "goal" && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
            <span>Overall Progress</span>
            <span style={{ fontWeight: 600, color: "var(--accent)" }}>{percent}%</span>
          </div>
          <div className="progress-track" style={{ height: "10px", backgroundColor: "var(--surface)" }}>
            <div className="progress-fill blue" style={{ width: `${percent}%`, backgroundColor: "var(--accent)" }} />
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

      {/* Recent Records section */}
      <h3 style={{ fontSize: "15px", fontWeight: "600", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginTop: "12px", marginBottom: "16px" }}>
        Activity History ({commitmentRecords.length})
      </h3>
      <div style={{ flex: 1 }}>
        <Timeline records={commitmentRecords} />
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
