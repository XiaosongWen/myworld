import HabitCard from "./HabitCard";

export default function HabitList({ habits, onArchive, onCheckIn, onUpdate }) {
  if (habits.length === 0) {
    return <p className="empty-state">No habits yet. Create one above!</p>;
  }

  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onArchive={onArchive}
          onCheckIn={onCheckIn}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
