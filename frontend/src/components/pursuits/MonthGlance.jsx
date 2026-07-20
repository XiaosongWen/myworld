import React, { useMemo } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MonthGlance({ habits = [] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  // Build a set of dates that have habit check-ins
  const checkedDates = useMemo(() => {
    const set = new Set();
    habits.forEach((h) => {
      if (h.today_record?.date) set.add(h.today_record.date);
    });
    return set;
  }, [habits]);

  const cells = useMemo(() => buildCalendar(year, month), [year, month]);

  return (
    <div className="month-glance" style={{ marginTop: "32px" }}>
      <div className="month-header-wrapper">
        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--fg)" }}>
          {monthName}
        </h2>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button className="icon-btn" style={{ width: 28, height: 28 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="pill-btn" style={{ fontSize: 13, padding: "4px 12px" }}>Today</button>
          <button className="icon-btn" style={{ width: 28, height: 28 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {WEEKDAYS.map((d) => (
        <div key={d} className="weekday-header">{d}</div>
      ))}

      {cells.map((day, i) => {
        if (!day) return <div key={`e${i}`} className="day-cell empty"><span className="day-number" /></div>;

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isToday = day === today;
        const hasDots = checkedDates.has(dateStr);
        const doneDots = hasDots ? habits.filter((h) => h.today_record?.date === dateStr).length : 0;
        const totalDots = habits.length;

        return (
          <div key={day} className={`day-cell${isToday ? " active" : ""}`}>
            <span className="day-number">{day}</span>
            {totalDots > 0 && (
              <div className="habit-dots">
                {Array.from({ length: Math.min(totalDots, 5) }, (_, idx) => (
                  <div key={idx} className={`dot${idx < doneDots ? " done" : ""}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
