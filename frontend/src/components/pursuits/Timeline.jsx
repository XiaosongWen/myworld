import React from "react";

export default function Timeline({ records }) {
  if (!records || records.length === 0) {
    return <div className="text-muted text-sm mt-2">No records found.</div>;
  }

  return (
    <div className="timeline-container mt-2">
      {records.map(record => (
        <div key={record.id} className="log-item mb-2">
          {record.time && <span className="log-time">{record.time}</span>}
          <span>{record.content}</span>
        </div>
      ))}
    </div>
  );
}
