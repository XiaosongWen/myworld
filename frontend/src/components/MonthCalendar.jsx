import { useMemo, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthCalendar({ data, onClickDay }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const countMap = useMemo(() => {
    const map = {};
    if (data) data.forEach(({ date: d, count }) => { map[d] = count; });
    return map;
  }, [data]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];
    for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split("T")[0];
      cells.push({ day: d, dateStr, count: countMap[dateStr] || 0 });
    }
    return cells;
  }, [year, month, countMap]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button onClick={prevMonth}>←</button>
        <span>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth}>→</button>
      </div>
      <div className="month-grid">
        {DAY_HEADERS.map(d => <div key={d} className="month-day-header">{d}</div>)}
        {days.map((cell, i) =>
          cell ? (
            <div
              key={i}
              className={`month-day ${cell.count > 0 ? "has-checkin" : ""}`}
              onClick={() => onClickDay?.(cell.dateStr)}
            >
              <span>{cell.day}</span>
              {cell.count > 0 && <span className="day-dot" />}
            </div>
          ) : (
            <div key={i} className="month-day empty" />
          )
        )}
      </div>
    </div>
  );
}
