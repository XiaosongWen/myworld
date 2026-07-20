import React, { useEffect, useState } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import Timeline from "../components/pursuits/Timeline";

export default function CommitmentDetail({ commitmentId, onClose }) {
  const { commitments, fetchRecords } = usePursuitsStore();
  const [records, setRecords] = useState([]);

  const commitment = commitments.find(c => c.id === commitmentId);

  useEffect(() => {
    if (commitmentId) {
      // Simulate fetching records for this specific commitment
      // In a real implementation, you'd filter by commitmentId
      fetchRecords({ commitment_id: commitmentId }).then((data) => {
        // Assume store doesn't return the promise data directly in this mock unless we change the store.
        // Actually fetchRecords just sets store.records. We can just use the store's records.
      });
    }
  }, [commitmentId, fetchRecords]);

  // Read records from store
  const allRecords = usePursuitsStore((state) => state.records);
  const commitmentRecords = allRecords.filter(r => r.commitment_id === commitmentId);

  if (!commitmentId || !commitment) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "600px",
      backgroundColor: "var(--surface-raised)",
      borderLeft: "1px solid var(--border)",
      zIndex: 1000,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
      padding: "24px",
      overflowY: "auto",
      transform: "translateX(0)",
      transition: "transform 0.3s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>{commitment.title}</h2>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      <div className="text-muted text-sm mb-4">
        {commitment.type.toUpperCase()} · {commitment.status}
      </div>

      {commitment.type === "goal" && (
        <div className="mb-4">
          <div className="progress-track" style={{ height: "12px", backgroundColor: "var(--surface)" }}>
            <div className="progress-fill blue" style={{ width: `${commitment.progress_percentage || 0}%`, backgroundColor: "var(--accent)" }}></div>
          </div>
          <div className="text-sm mt-1">{commitment.progress_percentage || 0}%</div>
        </div>
      )}

      {/* Sub-commitments section */}
      <h3 className="mt-4 mb-2" style={{ fontSize: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>── Sub-commitments ──</h3>
      <div className="text-muted text-sm mb-4">No sub-commitments</div>
      
      {/* Recent Records section */}
      <h3 className="mt-4 mb-2" style={{ fontSize: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>── Recent Records ──</h3>
      <Timeline records={commitmentRecords} />
      
      <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
        <button className="pill-btn">Edit</button>
        <button className="pill-btn" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Archive</button>
      </div>
    </div>
  );
}
