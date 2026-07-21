import React, { useEffect, useState, useCallback } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import HabitChecklist from "../components/pursuits/HabitChecklist";
import TaskCard from "../components/pursuits/TaskCard";
import GoalCard from "../components/pursuits/GoalCard";
import MonthGlance from "../components/pursuits/MonthGlance";
import CreateCommitmentModal from "../components/pursuits/CreateCommitmentModal";
import CommitmentDetail from "./CommitmentDetail";
import LabelPill from "../components/pursuits/LabelPill";
import { fetchWeatherForecast, searchWeatherLocations } from "../api/weather";




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
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLong(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getZonedTimeParts(date, timeZone) {
  if (!timeZone) {
    return {
      hours: String(date.getHours()).padStart(2, "0"),
      minutes: String(date.getMinutes()).padStart(2, "0"),
      seconds: String(date.getSeconds()).padStart(2, "0"),
      dateLong: formatDateLong(date),
    };
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const parts = formatter.formatToParts(date);
    const p = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }

    const hours = (p.hour === "24" ? "00" : p.hour || "00").padStart(2, "0");
    const minutes = (p.minute || "00").padStart(2, "0");
    const seconds = (p.second || "00").padStart(2, "0");
    const dateLong = `${p.weekday}, ${p.month} ${p.day}, ${p.year}`;

    return { hours, minutes, seconds, dateLong };
  } catch (e) {
    return {
      hours: String(date.getHours()).padStart(2, "0"),
      minutes: String(date.getMinutes()).padStart(2, "0"),
      seconds: String(date.getSeconds()).padStart(2, "0"),
      dateLong: formatDateLong(date),
    };
  }
}

export default function DailyLog() {
  const { daily, commitments, fetchDaily, fetchLabels, fetchCommitments, checkInHabit, uncheckHabit, createCommitment, updateCommitment } = usePursuitsStore();
  const now = useLiveClock();
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("task");
  const [editingCommitment, setEditingCommitment] = useState(null);
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [locationName, setLocationName] = useState(null);
  const [locationTimezone, setLocationTimezone] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_weather_location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSelectCustomLocation = (loc) => {
    setCustomLocation(loc);
    try {
      localStorage.setItem("custom_weather_location", JSON.stringify(loc));
    } catch (_) {}
  };

  const handleResetLocation = () => {
    setCustomLocation(null);
    try {
      localStorage.removeItem("custom_weather_location");
    } catch (_) {}
  };

  const openCreateModal = (type) => {
    setCreateType(type);
    setShowCreate(true);
  };

  const { hours, minutes, seconds, dateLong } = getZonedTimeParts(now, locationTimezone);

  useEffect(() => {
    fetchDaily(todayISO());
    fetchLabels();
    fetchCommitments();
  }, [fetchDaily, fetchLabels, fetchCommitments]);

  const habits = [...(daily?.habits || [])].sort(
    (a, b) => (b.commitment?.progress?.streak ?? 0) - (a.commitment?.progress?.streak ?? 0)
  );
  const PRIORITY_WEIGHT = { high: 3, medium: 2, med: 2, low: 1, none: 0 };
  const pendingTasks = (daily?.tasks || [])
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const weightA = PRIORITY_WEIGHT[a.priority?.toLowerCase()] ?? 0;
      const weightB = PRIORITY_WEIGHT[b.priority?.toLowerCase()] ?? 0;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  const freeRecords = daily?.free_records || [];

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return iso === todayISO();
  };

  // Build timeline events for today
  const timelineEvents = [];

  freeRecords.forEach((r) => {
    timelineEvents.push({
      id: `rec-${r.id}`,
      time: r.created_at || r.updated_at || new Date().toISOString(),
      icon: "📝",
      text: r.content,
      type: "log",
    });
  });

  habits.forEach((h) => {
    if (h.today_record) {
      timelineEvents.push({
        id: `habit-${h.commitment.id}`,
        time: h.today_record.created_at || new Date().toISOString(),
        icon: "🔄",
        text: `Checked in habit "${h.commitment.title}"`,
        type: "habit",
      });
    }
  });

  (commitments || []).forEach((c) => {
    if (isToday(c.created_at)) {
      timelineEvents.push({
        id: `create-${c.id}`,
        time: c.created_at,
        icon: "✨",
        text: `Created ${c.type}: "${c.title}"`,
        type: "create",
      });
    }
  });

  (commitments || []).forEach((c) => {
    if (c.status === "completed" && isToday(c.updated_at || c.completed_at)) {
      timelineEvents.push({
        id: `done-${c.id}`,
        time: c.updated_at || c.completed_at,
        icon: "✅",
        text: `Completed ${c.type}: "${c.title}"`,
        type: "done",
      });
    }
  });

  timelineEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

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

  const handleQuickAddTask = async (e) => {
    if (e.key === "Enter" && quickTaskTitle.trim()) {
      e.preventDefault();
      const text = quickTaskTitle.trim();
      setQuickTaskTitle("");
      try {
        await createCommitment({
          title: text,
          type: "task",
          priority: "none",
          due_date: todayISO(),
          status: "active",
        });
        fetchDaily(todayISO());
      } catch (err) {
        console.error("Failed to add task due today:", err);
      }
    }
  };

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
              <span
                style={{ color: "var(--fg-muted)", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={() => setShowLocationPicker(true)}
                title="Click to change city or zipcode"
              >
                {locationName || Intl.DateTimeFormat().resolvedOptions().timeZone?.split("/").pop()?.replace("_", " ") || "Local"}
                <span style={{ fontSize: "12px", opacity: 0.6 }}>✏️</span>
              </span>
              {dateLong}
            </div>
          </div>
        </div>

        {/* Weather + Progress right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
          {/* 5-Day Weather Forecast */}
          <WeatherStrip
            customLocation={customLocation}
            onOpenLocationPicker={() => setShowLocationPicker(true)}
            onLocationResolved={(loc) => {
              if (loc?.city) {
                const name = loc.region ? `${loc.city}, ${loc.region}` : loc.city;
                setLocationName(name);
              }
              if (loc?.timezone) {
                setLocationTimezone(loc.timezone);
              } else {
                setLocationTimezone(null);
              }
            }}
          />




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
            <h2>📋 Today's Tasks <a href="/commitments/tasks" className="text-sm text-muted" style={{ textDecoration: "none", fontWeight: "normal" }}>View All →</a></h2>
            <div className="task-list">
              {pendingTasks.length === 0 ? (
                <div className="empty-card-state">
                  <span className="empty-icon">🌴</span>
                  <span className="empty-text">No tasks due today</span>
                  <button className="pill-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => openCreateModal("task")}>
                    + Add Task
                  </button>
                </div>
              ) : (
                pendingTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggleStatus={() => updateCommitment(t.id, { status: t.status === "completed" ? "active" : "completed" })}
                    onOpenDetail={(id) => setSelectedDetailId(id)}
                  />
                ))
              )}
              <div className="input-bar" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <span style={{ opacity: 0.5 }}>+</span>
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  onKeyDown={handleQuickAddTask}
                  placeholder="Quick add task..."
                  style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: 14, color: "var(--fg)" }}
                />
              </div>
            </div>
          </div>

          {/* Daily Log Timeline */}
          <div className="card">
            <h2>📝 Daily Log Timeline</h2>
            <div className="log-list">
              {timelineEvents.length === 0 ? (
                <p className="text-muted text-sm mb-2" style={{ fontStyle: "italic", opacity: 0.8 }}>
                  No activity logged yet today.
                </p>
              ) : (
                timelineEvents.map((ev) => {
                  const tDate = new Date(ev.time);
                  const timeStr = isNaN(tDate.getTime())
                    ? ""
                    : tDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                  return (
                    <div key={ev.id} className="log-item" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="log-time" style={{ minWidth: 42, opacity: 0.7 }}>{timeStr}</span>
                      <span style={{ fontSize: 14 }}>{ev.icon}</span>
                      <span style={{ flex: 1 }}>{ev.text}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-right" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Habits */}
          <div className="card">
            <h2>
              🔄 Habits{" "}
              {habits.length > 0 && (() => {
                const maxStreak = Math.max(...habits.map((h) => h.commitment?.progress?.streak ?? 0), 0);
                const days = maxStreak % 7;
                const weeks = Math.floor(maxStreak / 7);
                return (
                  <span className="streak-badge">
                    🔥 {days}d {weeks}w
                  </span>
                );
              })()}
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
                    onOpenDetail={() => setSelectedDetailId(h.commitment.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Goal Progress */}
          <div className="card">
            <h2>🎯 Goal Progress</h2>
            <div className="goal-list" style={{ marginTop: "12px" }}>
              <GoalSummaryFromStore onOpenCreate={openCreateModal} onSelectGoal={(id) => setSelectedDetailId(id)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Month at a Glance ── */}
      <MonthGlance habits={habits} />

      {/* Commitment Detail Side Drawer */}
      {selectedDetailId && (
        <CommitmentDetail
          commitmentId={selectedDetailId}
          onClose={() => setSelectedDetailId(null)}
          onEdit={(g) => {
            setSelectedDetailId(null);
            setEditingCommitment(g);
            setShowCreate(true);
          }}
        />
      )}

      {/* Create / Edit Commitment Modal */}
      {showCreate && (
        <CreateCommitmentModal
          defaultType={createType}
          commitmentToEdit={editingCommitment}
          onClose={() => {
            setShowCreate(false);
            setEditingCommitment(null);
          }}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          onClose={() => setShowLocationPicker(false)}
          onSelectLocation={handleSelectCustomLocation}
          onResetLocation={handleResetLocation}
        />
      )}
    </div>
  );
}

// A small helper that fetches goals from commitments store and renders compact normal rows
function GoalSummaryFromStore({ onOpenCreate, onSelectGoal }) {
  const { commitments, fetchCommitments } = usePursuitsStore();
  useEffect(() => {
    if (commitments.length === 0) fetchCommitments({ root: true, status: "active" });
  }, [fetchCommitments]);

  const goals = commitments.filter((c) => c.type === "goal").slice(0, 5);

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

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {goals.map((g) => {
        const subGoals = commitments.filter(
          (c) => c.parent_id === g.id || (c.type === "sub-goal" && c.parent_id === g.id)
        );
        let percent = Math.round(g.progress?.percent ?? 0);
        if (subGoals.length > 0) {
          const doneCount = subGoals.filter((s) => s.status === "completed").length;
          percent = Math.round((doneCount / subGoals.length) * 100);
        }

        return (
          <div
            key={g.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
            }}
            onClick={() => onSelectGoal?.(g.id)}
          >
            <span style={{ fontSize: "16px" }}>🎯</span>
            <span style={{ fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</span>

            {/* Labels */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center", overflow: "visible", whiteSpace: "nowrap" }}>
              {(g.labels || []).map((lbl) => (
                <LabelPill key={lbl.id || lbl.name} label={lbl} compact={(g.labels || []).length > 2} />
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* Deadline */}
            {g.due_date && (
              <span className="text-muted" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                Due: {new Date(g.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}

            {/* Progress bar + percent */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "130px" }}>
              <div className="progress-track" style={{ height: "6px", flex: 1, margin: 0, background: "var(--surface)" }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: percent >= 100 ? "var(--success)" : "var(--accent)",
                    borderRadius: "3px",
                    transition: "width 0.4s ease-out",
                  }}
                />
              </div>
              <span className="text-muted" style={{ fontSize: "12px", width: "32px", textAlign: "right" }}>{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PLACEHOLDER_FORECAST = [
  { label: "Today", icon: "⛅", temp: "—°" },
  { label: "Tue",   icon: "☀️",  temp: "—°" },
  { label: "Wed",   icon: "🌧️", temp: "—°" },
  { label: "Thu",   icon: "⛅", temp: "—°" },
  { label: "Fri",   icon: "☀️",  temp: "—°" },
];

function WeatherStrip({ customLocation, onOpenLocationPicker, onLocationResolved }) {
  const [forecast, setForecast] = useState(null);
  const [unit, setUnit] = useState(() => {
    try {
      return localStorage.getItem("weather_unit") || "F";
    } catch {
      return "F";
    }
  });

  const toggleUnit = () => {
    const next = unit === "F" ? "C" : "F";
    setUnit(next);
    try {
      localStorage.setItem("weather_unit", next);
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;

    const loadForecast = async (lat, lon) => {
      try {
        const res = await fetchWeatherForecast(lat, lon);
        if (isMounted && res) {
          if (res.forecast) setForecast(res.forecast);
          if (res.location && onLocationResolved) {
            onLocationResolved(res.location);
          }
        }
      } catch (err) {
        console.error("Failed to fetch weather forecast:", err);
      }
    };

    if (customLocation?.lat != null && customLocation?.lon != null) {
      loadForecast(customLocation.lat, customLocation.lon);
    } else if ("geolocation" in navigator && typeof navigator.geolocation.getCurrentPosition === "function") {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadForecast(pos.coords.latitude, pos.coords.longitude),
        () => loadForecast(),
        { timeout: 3000 }
      );
    } else {
      loadForecast();
    }

    return () => {
      isMounted = false;
    };
  }, [customLocation, onLocationResolved]);

  const items = forecast || PLACEHOLDER_FORECAST;

  return (
    <div
      className="weather-strip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "var(--surface)",
        padding: "8px 20px",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
      }}
    >
      {items.map((day, i) => {
        const tempVal =
          day.temp_f != null || day.temp_c != null
            ? `${unit === "F" ? day.temp_f : day.temp_c}°`
            : day.temp || "—°";

        return (
          <React.Fragment key={day.label + i}>
            <div
              title={day.condition || ""}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                cursor: "pointer",
              }}
              onClick={toggleUnit}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: i === 0 ? "var(--fg)" : "var(--fg-muted)",
                }}
              >
                {day.label}
              </span>
              <span style={{ fontSize: "16px" }}>{day.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fg)" }}>
                {tempVal}
              </span>
            </div>
            {i < items.length - 1 && (
              <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
            )}
          </React.Fragment>
        );
      })}
      <button
        onClick={toggleUnit}
        title="Toggle °F / °C"
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--fg-muted)",
          padding: "2px 4px",
          borderRadius: "4px",
          marginLeft: "-4px",
        }}
      >
        °{unit}
      </button>
    </div>
  );
}

function LocationPickerModal({ onClose, onSelectLocation, onResetLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchWeatherLocations(query);
        setResults(res);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--fg)" }}>Change Location</h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "var(--fg-muted)" }}
          >
            ✕
          </button>
        </div>

        <div className="location-search-wrapper">
          <span className="location-search-icon">🔍</span>
          <input
            type="text"
            className="location-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city name or zipcode..."
            autoFocus
          />
        </div>

        <div className="location-result-list">
          {searching && <div style={{ padding: "12px", fontSize: "13px", color: "var(--fg-muted)", textAlign: "center" }}>Searching locations...</div>}
          {!searching && query.trim() && results.length === 0 && (
            <div style={{ padding: "12px", fontSize: "13px", color: "var(--fg-muted)", textAlign: "center" }}>No locations found</div>
          )}
          {results.map((item, idx) => (
            <div
              key={idx}
              className="location-result-item"
              onClick={() => {
                onSelectLocation(item);
                onClose();
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="city-name">{item.city}</span>
                <span className="region-name">
                  {[item.region, item.country].filter(Boolean).join(", ")}
                </span>
              </div>
              <span style={{ fontSize: "14px", opacity: 0.6 }}>📍</span>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            className="pill-btn"
            onClick={() => {
              onResetLocation();
              onClose();
            }}
            style={{ fontSize: "12px", padding: "6px 14px", cursor: "pointer" }}
          >
            📍 Use Auto-Location
          </button>
        </div>
      </div>
    </div>
  );
}



