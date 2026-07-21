import React from "react";

export default function Timeline({ records }) {
  if (!records || records.length === 0) {
    return <div className="text-muted text-sm mt-2" style={{ padding: "16px 0" }}>No activity recorded yet.</div>;
  }

  return (
    <div className="timeline-container mt-2" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {records.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            fontSize: "13px",
            color: "var(--fg)",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: "14px", marginTop: "1px" }}>{item.icon || "📌"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>{item.content}</div>
            {item.time && <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "2px" }}>{item.time}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
