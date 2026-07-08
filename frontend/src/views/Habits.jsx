import { useEffect, useState } from "react";
import CalendarHeatmap from "../components/CalendarHeatmap";
import CheckInModal from "../components/CheckInModal";
import HabitForm from "../components/HabitForm";
import HabitList from "../components/HabitList";
import MonthCalendar from "../components/MonthCalendar";
import useHabitsStore from "../stores/useHabitsStore";

export default function Habits() {
  const {
    habits, heatmapData, loading, error,
    fetchHabits, createHabit, updateHabit, archiveHabit, checkIn, fetchHeatmap,
  } = useHabitsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);

  useEffect(() => {
    fetchHabits();
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];
    fetchHeatmap(from, to);
  }, [fetchHabits, fetchHeatmap]);

  const handleCreate = async (data) => {
    await createHabit(data);
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  };

  const handleCheckIn = async (habitId, payload) => {
    await checkIn(habitId, payload);
    fetchHabits();
  };

  const handleDayClick = (dateStr) => {
    setCheckInDate(dateStr);
    setShowCheckInModal(true);
  };

  const handleBulkCheckIn = async (payload) => {
    let failures = 0;
    for (const habit of habits) {
      try {
        await checkIn(habit.id, { date: payload.date || checkInDate, note: payload.note });
      } catch (e) {
        if (e.response?.status === 409) {
          // skip duplicates silently
        } else {
          failures++;
        }
      }
    }
    setShowCheckInModal(false);
    fetchHabits();
    if (failures > 0) {
      alert(`${failures} check-in(s) failed. Please try again.`);
    }
  };

  if (loading && habits.length === 0) return <div className="loading">Loading habits...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="habits-page">
      <h2>Habits</h2>

      <CalendarHeatmap data={heatmapData} onClickDay={handleDayClick} />
      <MonthCalendar data={heatmapData} onClickDay={handleDayClick} />

      <div className="habits-toolbar">
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New Habit
        </button>
        <button className="btn-secondary" onClick={() => setShowCheckInModal(true)}>
          Check in all
        </button>
      </div>

      {showForm && (
        <HabitForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {editingHabit && (
        <HabitForm
          initialData={editingHabit}
          onSubmit={handleUpdate}
          onCancel={() => setEditingHabit(null)}
        />
      )}

      <HabitList
        habits={habits}
        onArchive={archiveHabit}
        onCheckIn={handleCheckIn}
        onUpdate={setEditingHabit}
      />

      {showCheckInModal && (
        <CheckInModal
          habit={{ name: checkInDate ? `All habits — ${checkInDate}` : "All habits" }}
          onConfirm={handleBulkCheckIn}
          onClose={() => { setShowCheckInModal(false); setCheckInDate(null); }}
        />
      )}
    </div>
  );
}
