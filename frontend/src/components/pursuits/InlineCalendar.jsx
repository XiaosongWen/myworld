import React from "react";

export default function InlineCalendar({ days = 112 }) {
  // Generate 112 cells (16 weeks x 7 days) matching UI-V1 buildInlineCalendars()
  const cells = Array.from({ length: days }, (_, i) => {
    // Deterministic pseudo-pattern based on index for demo heatmap
    const done = (i * 7 + 3) % 10 > 3;
    const level4 = done && (i % 3 === 0);
    return { id: i, done, level4 };
  });

  return (
    <div className="inline-calendar">
      {cells.map((cell) => (
        <div
          key={cell.id}
          className={`inline-cal-cell${cell.done ? " done" : ""}${cell.level4 ? " level-4" : ""}`}
        />
      ))}
    </div>
  );
}
