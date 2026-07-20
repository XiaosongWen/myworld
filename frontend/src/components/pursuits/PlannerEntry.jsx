import React, { useState } from "react";

export default function PlannerEntry({ onSubmitRecord }) {
  const [content, setContent] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        onSubmitRecord(content.trim());
        setContent("");
      }
    }
  };

  return (
    <div className="input-bar">
      <span>📝</span>
      <input
        type="text"
        placeholder="+ Add what you did today... (use @ to link, 09:00 for time)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
