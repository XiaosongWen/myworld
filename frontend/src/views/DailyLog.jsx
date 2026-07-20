import React, { useEffect, useState, useCallback } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import HabitChecklist from "../components/pursuits/HabitChecklist";
import TaskCard from "../components/pursuits/TaskCard";
import GoalCard from "../components/pursuits/GoalCard";
import PlannerEntry from "../components/pursuits/PlannerEntry";
import MonthGlance from "../components/pursuits/MonthGlance";
import CreateCommitmentModal from "../components/pursuits/CreateCommitmentModal";

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function getYearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return Math.round(((now - start) / (end - start)) * 100);
}

function getMonthProgress() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((now.getDate() / daysInMonth) * 100);
}

function getQuarterProgress() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 1);
  return Math.round(((now - start) / (end - start)) * 100);
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDateLong(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DailyLog() {
  const { daily, fetchDaily, checkInHabit, uncheckHabit, createRecord } = usePursuitsStore();
  const now = useLiveClock();
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("task");

  const openCreateModal = (type) => {
    setCreateType(type);
    setShowCreate(true);
  };

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  useEffect(() => {
    fetchDaily(todayISO());
  }, [fetchDaily]);

  const habits = daily?.habits || [];
  const tasks = daily?.tasks || [];
  const freeRecords = daily?.free_records || [];

  const monthPct = getMonthProgress();
  const quarterPct = getQuarterProgress();
  const yearPct = getYearProgress();

  const handleCheckIn = useCallback((commitmentId, existingRecordId) => {
    if (existingRecordId) {
      uncheckHabit(commitmentId, existingRecordId);
    } else {
      checkInHabit(commitmentId);
    }
  }, [checkInHabit, uncheckHabit]);

  const handleCreateRecord = useCallback((content) => {
    createRecord({ content, status: "done" });
  }, [createRecord]);

  return (
    <div className="view active" id="dashboard">
      {/* ── Page Header ── */}
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="flip-clock-container">
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
              <div className="flip-clock">
                <div className="flip-panel"><span>{hours}</span></div>
                <span className="flip-colon">:</span>
                <div className="flip-panel"><span>{minutes}</span></div>
                <span className="flip-colon">:</span>
                <div className="flip-panel"><span>{seconds}</span></div>
              </div>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--fg)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}>
                {Intl.DateTimeFormat().resolvedOptions().timeZone?.split("/").pop()?.replace("_", " ") || "Local"}
              </span>
              {formatDateLong(now)}
            </div>
          </div>
        </div>

        {/* Weather + Progress right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
          {/* 5-Day Weather Forecast */}
          <WeatherStrip />

          {/* Month/Quarter/Year progress */}
          <div style={{ display: "flex", gap: "16px", background: "var(--surface)", padding: "12px 20px", borderRadius: "var(--radius-lg)", boxShadow: "0 2px 12px rgba(0,0,0,0.02)", minWidth: "320px" }}>
            {[
              { label: "Month", pct: monthPct, color: "var(--accent)" },
              { label: "Quarter", pct: quarterPct, color: "var(--warning)" },
              { label: "Year", pct: yearPct, color: "var(--success)" },
            ].map(({ label, pct, color }, i, arr) => (
              <React.Fragment key={label}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                    <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                    <span style={{ color: "var(--fg)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 1s ease" }} />
                  </div>
                </div>
                {i < arr.length - 1 && <div style={{ width: "1px", background: "var(--border)" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* ── Dashboard Grid ── */}
      <div className="dashboard-grid">
        {/* Left column */}
        <div className="col-left" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Today's Tasks */}
          <div className="card">
            <h2>📋 Today's Tasks <a href="/commitments" className="text-sm text-muted" style={{ textDecoration: "none", fontWeight: "normal" }}>View All →</a></h2>
            <div className="task-list">
              {tasks.length === 0 ? (
                <div className="empty-card-state">
                  <span className="empty-icon">🌴</span>
                  <span className="empty-text">No tasks due today</span>
                  <button className="pill-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => openCreateModal("task")}>
                    + Add Task
                  </button>
                </div>
              ) : (
                tasks.map((t) => (
                  <TaskCard key={t.id} task={t} onToggleStatus={() => {}} />
                ))
              )}
            </div>
          </div>

          {/* Daily Log */}
          <div className="card">
            <h2>📝 Daily Log</h2>
            <div className="log-list">
              {freeRecords.length === 0 ? (
                <p className="text-muted text-sm mb-2" style={{ fontStyle: "italic", opacity: 0.8 }}>
                  No log entries yet. Record what you accomplish today below:
                </p>
              ) : (
                freeRecords.map((r) => (
                  <div key={r.id} className="log-item">
                    {r.content?.match(/^\d{2}:\d{2}/) && (
                      <span className="log-time">{r.content.slice(0, 5)}</span>
                    )}
                    <span>{r.content?.replace(/^\d{2}:\d{2}\s*/, "")}</span>
                  </div>
                ))
              )}
            </div>
            <PlannerEntry onSubmitRecord={handleCreateRecord} />
          </div>
        </div>

        {/* Right column */}
        <div className="col-right" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Habits */}
          <div className="card">
            <h2>
              🔄 Habits{" "}
              {habits.length > 0 && (
                <span className="streak-badge">
                  🔥 {habits.filter((h) => h.today_record).length}/{habits.length} done
                </span>
              )}
            </h2>
            <div className="habit-list">
              {habits.length === 0 ? (
                <div className="empty-card-state">
                  <span className="empty-icon">🌱</span>
                  <span className="empty-text">No active habits</span>
                  <button className="pill-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => openCreateModal("habit")}>
                    + Add Habit
                  </button>
                </div>
              ) : (
                habits.map((h) => (
                  <HabitChecklist
                    key={h.commitment.id}
                    habit={h.commitment}
                    checked={!!h.today_record}
                    streak={h.commitment.progress?.streak}
                    onCheckIn={() =>
                      handleCheckIn(h.commitment.id, h.today_record?.id)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Goal Progress */}
          <div className="card">
            <h2>🎯 Goal Progress</h2>
            <div className="goal-list">
              <GoalSummaryFromStore onOpenCreate={openCreateModal} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Month at a Glance ── */}
      <MonthGlance habits={habits} />

      {/* Create Commitment Modal */}
      {showCreate && (
        <CreateCommitmentModal
          defaultType={createType}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// A small helper that fetches goals from commitments store
function GoalSummaryFromStore({ onOpenCreate }) {
  const { commitments, fetchCommitments } = usePursuitsStore();
  useEffect(() => {
    if (commitments.length === 0) fetchCommitments({ type: "goal", status: "active" });
  }, [fetchCommitments]);

  const goals = commitments.filter((c) => c.type === "goal").slice(0, 4);

  if (goals.length === 0) {
    return (
      <div className="empty-card-state">
        <span className="empty-icon">🎯</span>
        <span className="empty-text">No active goals</span>
        <button className="pill-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => onOpenCreate?.("goal")}>
          + New Goal
        </button>
      </div>
    );
  }
  return goals.map((g) => <GoalCard key={g.id} goal={g} />);
}

// ── Weather Strip ─────────────────────────────────────────────────────────
// Placeholder data — replace with real API data once the weather backend
// endpoint is implemented (see GitHub issue: "Weather API integration").
const PLACEHOLDER_FORECAST = [
  { label: "Today", icon: "⛅", temp: "—°" },
  { label: "Tue",   icon: "☀️",  temp: "—°" },
  { label: "Wed",   icon: "🌧️", temp: "—°" },
  { label: "Thu",   icon: "⛅", temp: "—°" },
  { label: "Fri",   icon: "☀️",  temp: "—°" },
];

function WeatherStrip() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "16px",
      background: "var(--surface)", padding: "8px 20px",
      borderRadius: "var(--radius-lg)", boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
    }}>
      {PLACEHOLDER_FORECAST.map((day, i) => (
        <React.Fragment key={day.label}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: i === 0 ? "var(--fg)" : "var(--fg-muted)" }}>
              {day.label}
            </span>
            <span style={{ fontSize: "16px" }}>{day.icon}</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fg)" }}>{day.temp}</span>
          </div>
          {i < PLACEHOLDER_FORECAST.length - 1 && (
            <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
