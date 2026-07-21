import { useState } from "react";
import CheckInModal from "./CheckInModal";

export default function HabitCard({ habit, onArchive, onCheckIn, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCheckIn = async (payload) => {
    await onCheckIn(habit.id, payload);
    setShowModal(false);
  };

  return (
    <div className="habit-card" style={{ borderLeftColor: habit.color }}>
      <div className="habit-card-header">
        <span className="habit-color-dot" style={{ backgroundColor: habit.color }} />
        <span className="habit-name" onClick={() => setExpanded(!expanded)}>
          {habit.name}
        </span>
        {habit.category && <span className="habit-category">{habit.category}</span>}
        <span className="streak-badge">
          🔥 {(habit.current_streak ?? 0) % 7}d {Math.floor((habit.current_streak ?? 0) / 7)}w
        </span>
        <button className="btn-checkin" onClick={() => setShowModal(true)}>
          ✓ Check in
        </button>
      </div>
      {expanded && (
        <div className="habit-card-detail">
          {habit.description && <p className="habit-desc">{habit.description}</p>}
          <button className="btn-edit" onClick={() => onUpdate(habit)}>Edit</button>
          <button className="btn-archive" onClick={() => onArchive(habit.id)}>Archive</button>
        </div>
      )}
      {showModal && (
        <CheckInModal
          habit={habit}
          onConfirm={handleCheckIn}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
