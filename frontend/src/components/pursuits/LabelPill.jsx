import React, { useState } from "react";

export default function LabelPill({ label, compact = false }) {
  if (!label) return null;
  const [hovered, setHovered] = useState(false);
  const color = label.color || "#3b82f6";
  const displayText = compact ? label.name.charAt(0).toUpperCase() : label.name;

  return (
    <span
      key={label.id || label.name}
      title={label.name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: compact ? "1px 6px" : "2px 8px",
        minWidth: compact ? "20px" : "auto",
        borderRadius: "10px",
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color: color,
        fontSize: "11px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {displayText}
      {hovered && (
        <span
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(-4px)",
            backgroundColor: "#1e293b",
            color: "#f8fafc",
            border: `1px solid ${color}80`,
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {label.name}
        </span>
      )}
    </span>
  );
}
