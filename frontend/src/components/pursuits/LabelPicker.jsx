import React, { useState, useEffect, useRef } from "react";
import { fetchLabels, createLabel } from "../../api/labels";

const PALETTE = [
  "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6",
  "#ec4899", "#6366f1", "#ef4444", "#14b8a6",
  "#84cc16", "#06b6d4", "#a855f7", "#f43f5e"
];

function getRandomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export default function LabelPicker({ selectedLabels = [], onChange }) {
  const [labelsList, setLabelsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch labels from backend API on mount
  useEffect(() => {
    fetchLabels()
      .then((data) => {
        if (Array.isArray(data)) {
          setLabelsList(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch labels:", err);
      });
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = searchQuery.trim();

  // Filter labels matching search query
  const filteredLabels = labelsList.filter((l) =>
    l.name.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  // Check if an exact match exists
  const hasExactMatch = labelsList.some(
    (l) => l.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const toggleLabel = (name) => {
    let updated;
    if (selectedLabels.includes(name)) {
      updated = selectedLabels.filter((l) => l !== name);
    } else {
      updated = [...selectedLabels, name];
    }
    onChange?.(updated);
  };

  const handleCreateAndSelect = async (name) => {
    if (!name) return;
    const randomColor = getRandomColor();
    try {
      const created = await createLabel(name, randomColor);
      const newLabel = { id: created.id, name: created.name, color: created.color || randomColor };
      setLabelsList((prev) => [newLabel, ...prev]);
    } catch {
      // If backend API fails or label exists, fallback locally
      const fallback = { name, color: randomColor };
      setLabelsList((prev) => [fallback, ...prev]);
    }

    if (!selectedLabels.includes(name)) {
      onChange?.([...selectedLabels, name]);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmedQuery) {
        if (!hasExactMatch) {
          handleCreateAndSelect(trimmedQuery);
        } else {
          toggleLabel(trimmedQuery);
          setSearchQuery("");
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Selected Label Chips */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {selectedLabels.map((tag) => {
          const matched = labelsList.find((l) => l.name === tag);
          const color = matched?.color || "#3b82f6";
          return (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "12px",
                background: `${color}18`,
                border: `1px solid ${color}40`,
                color: color,
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
              {tag}
              <button
                type="button"
                onClick={() => toggleLabel(tag)}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          );
        })}
      </div>

      {/* Input & Dropdown Container */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }} ref={wrapperRef}>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search or create new label..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--fg)",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* GitHub-style Dropdown Menu */}
          {isOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 1100,
              }}
            >
              {filteredLabels.map((l) => {
                const isSelected = selectedLabels.includes(l.name);
                return (
                  <div
                    key={l.id || l.name}
                    onClick={() => toggleLabel(l.name)}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      fontSize: "13px",
                      background: isSelected ? "var(--surface)" : "transparent",
                      color: "var(--fg)",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = isSelected ? "var(--surface)" : "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: l.color || "#3b82f6",
                          display: "inline-block",
                        }}
                      />
                      <span>{l.name}</span>
                    </div>
                    {isSelected && <span style={{ color: "var(--accent)", fontWeight: 600 }}>✓</span>}
                  </div>
                );
              })}

              {/* Create new label option */}
              {trimmedQuery && !hasExactMatch && (
                <div
                  onClick={() => handleCreateAndSelect(trimmedQuery)}
                  style={{
                    padding: "10px 12px",
                    borderTop: filteredLabels.length > 0 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "var(--accent)",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span>+</span> Create label "<strong>{trimmedQuery}</strong>"
                </div>
              )}

              {filteredLabels.length === 0 && !trimmedQuery && (
                <div style={{ padding: "12px", fontSize: "13px", color: "var(--fg-muted)", textAlign: "center" }}>
                  No labels found
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn"
          title="Manage Labels"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: "38px",
            height: "38px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
