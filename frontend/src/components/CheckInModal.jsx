import { useState } from "react";

export default function CheckInModal({ habit, onConfirm, onClose }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ date: date || undefined, note: note || undefined });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Check in: {habit.name}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Date:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Note (optional):
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Check in</button>
          </div>
        </form>
      </div>
    </div>
  );
}
