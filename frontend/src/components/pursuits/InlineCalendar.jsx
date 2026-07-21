import React, { useMemo } from "react";

export default function InlineCalendar({ checkinDates = [], days = 112 }) {
  const datesSet = useMemo(() => new Set(checkinDates), [checkinDates]);

  const cells = useMemo(() => {
    const todayDate = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const done = datesSet.has(dateStr);
      result.push({ id: dateStr, done, dateStr });
    }
    return result;
  }, [days, datesSet]);

  return (
    <div className="inline-calendar">
      {cells.map((cell) => (
        <div
          key={cell.id}
          className={`inline-cal-cell${cell.done ? " done" : ""}`}
          title={`${cell.dateStr}: ${cell.done ? "Checked in" : "No check-in"}`}
        />
      ))}
    </div>
  );
}
