import { useMemo } from "react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensity(count) {
  if (count === 0) return "level-0";
  if (count === 1) return "level-1";
  if (count <= 3) return "level-2";
  return "level-3";
}

export default function CalendarHeatmap({ data, onClickDay, year = null }) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const endDate = targetYear === now.getFullYear() ? now : new Date(targetYear, 11, 31);
  const startDate = new Date(targetYear, 0, 1);

  // Build map: dateString -> count
  const countMap = useMemo(() => {
    const map = {};
    if (data) {
      data.forEach(({ date: d, count }) => {
        map[d] = count;
      });
    }
    return map;
  }, [data]);

  // Generate day cells
  const weeks = useMemo(() => {
    const cells = [];
    const cursor = new Date(startDate);
    // Pad to start of week (Sunday)
    const startDay = cursor.getDay();
    for (let i = 0; i < startDay; i++) {
      cells.push(null);
    }
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split("T")[0];
      cells.push({
        date: new Date(cursor),
        dateStr,
        count: countMap[dateStr] || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    // Pad to end of week
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    // Split into weeks
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [startDate, endDate, countMap]);

  return (
    <div className="heatmap">
      <div className="heatmap-header">Contribution graph — {targetYear}</div>
      <div className="heatmap-grid">
        <div className="heatmap-labels">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="heatmap-day-label">{d}</span>
          ))}
        </div>
        <div className="heatmap-cells">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((cell, di) =>
                cell ? (
                  <div
                    key={di}
                    className={`heatmap-cell ${getIntensity(cell.count)}`}
                    title={`${cell.dateStr}: ${cell.count} check-ins`}
                    onClick={() => onClickDay?.(cell.dateStr)}
                  />
                ) : (
                  <div key={di} className="heatmap-cell empty" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-cell level-0" />
        <div className="heatmap-cell level-1" />
        <div className="heatmap-cell level-2" />
        <div className="heatmap-cell level-3" />
        <span>More</span>
      </div>
    </div>
  );
}
