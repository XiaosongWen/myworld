import React, { useEffect, useState } from "react";
import usePursuitsStore from "../stores/pursuitsStore";
import HabitChecklist from "../components/pursuits/HabitChecklist";
import GoalCard from "../components/pursuits/GoalCard";
import TaskCard from "../components/pursuits/TaskCard";
import CreateCommitmentModal from "../components/pursuits/CreateCommitmentModal";
import InlineCalendar from "../components/pursuits/InlineCalendar";

const FILTERS = ["all", "habit", "goal", "task", "list"];

export default function Commitments() {
  const { commitments, fetchCommitments, labels, fetchLabels, daily, fetchDaily, checkInHabit, uncheckHabit, loading, error } = usePursuitsStore();
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [editingCommitment, setEditingCommitment] = useState(null);

  const todayISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchCommitments({ status: "active" });
    fetchLabels();
    fetchDaily(todayISO);
  }, [fetchCommitments, fetchLabels, fetchDaily, todayISO]);

  const habits = commitments.filter((c) => c.type === "habit");
  const goals = commitments.filter((c) => c.type === "goal");
  const tasks = commitments.filter((c) => c.type === "task");
  const lists = commitments.filter((c) => c.type === "list");

  const openCreate = (type) => {
    setCreateType(type);
    setEditingCommitment(null);
    setShowCreate(true);
  };

  const handleHabitCheckIn = (habitId, existingRecordId) => {
    if (existingRecordId) {
      uncheckHabit(habitId, existingRecordId);
    } else {
      checkInHabit(habitId);
    }
  };

  return (
    <div className="view active" id="pursuits">
      <header className="page-header">
        <h1>Pursuits</h1>
      </header>

      <div className="toolbar">
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="input-bar" style={{ background: "var(--bg)" }}>
            <span>🔍</span>
            <input type="text" placeholder="Search commitments..." style={{ width: 150 }} />
          </div>
          <button className="btn-primary" onClick={() => openCreate(filter === "all" ? null : filter)}>
            + New ▾
          </button>
        </div>
      </div>

      {loading && <div className="text-muted text-sm" style={{ marginTop: 16 }}>Loading...</div>}
      {error && <div style={{ color: "var(--danger)", marginTop: 16 }}>{error}</div>}

      <div className="pursuits-content">
        {/* ALL overview */}
        {filter === "all" && (
          <div>
            <div className="section-header">All Commitments Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
              <SummaryCard
                icon="🔄" label="Habits" count={habits.length}
                onClick={() => setFilter("habit")}
                items={habits.slice(0, 4).map((h) => {
                  const dh = daily?.habits?.find((item) => item.commitment.id === h.id);
                  const isDone = !!dh?.today_record;
                  return {
                    left: h.title,
                    right: isDone ? "✓ Done" : h.progress?.streak ? `🔥 ${h.progress.streak}d` : "—",
                    rightStyle: isDone ? { color: "var(--success)", fontWeight: 600 } : undefined,
                  };
                })}
              />
              <SummaryCard
                icon="🎯" label="Goals" count={goals.length}
                onClick={() => setFilter("goal")}
                items={goals.slice(0, 4).map((g) => ({
                  left: g.title,
                  right: `${Math.round(g.progress?.percent ?? 0)}%`,
                  rightStyle: { color: "var(--success)" },
                }))}
              />
              <SummaryCard
                icon="📋" label="Tasks" count={tasks.length}
                onClick={() => setFilter("task")}
                items={tasks.slice(0, 4).map((t) => ({
                  left: t.title,
                  right: t.due_date
                    ? new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Inbox",
                }))}
              />
              <SummaryCard
                icon="📝" label="Lists" count={lists.length}
                onClick={() => setFilter("list")}
                items={lists.slice(0, 4).map((l) => ({
                  left: l.title,
                  right: "—",
                }))}
              />
            </div>
          </div>
        )}

        {/* HABITS */}
        {filter === "habit" && (
          <div>
            <div className="section-header">Habits ({habits.length} Active)</div>
            <div className="card" style={{ padding: 0 }}>
              {habits.length === 0 ? (
                <p className="text-muted text-sm" style={{ padding: 24 }}>No habits yet.</p>
              ) : (
                habits.map((h) => {
                  const dh = daily?.habits?.find((item) => item.commitment.id === h.id);
                  const checked = !!dh?.today_record;
                  const tags = h.config?.tags || [];
                  const streak = h.progress?.streak ?? 0;

                  return (
                    <div key={h.id} className="habit-item" style={{ padding: "16px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                      <div className="habit-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          className={`checkbox${checked ? " checked" : ""}`}
                          onClick={() => handleHabitCheckIn(h.id, dh?.today_record?.id)}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontWeight: 500, color: "var(--fg)" }}>{h.title}</span>
                      </div>

                      <div style={{ flex: 1, marginLeft: 24, display: "flex", gap: 6, alignItems: "center" }}>
                        {tags.map((tag) => {
                          const matched = labels.find((l) => l.name.toLowerCase() === tag.toLowerCase());
                          const color = matched?.color || "#3b82f6";
                          return (
                            <span
                              key={tag}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: `${color}18`,
                                border: `1px solid ${color}40`,
                                color: color,
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                              {tag}
                            </span>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                        <InlineCalendar />
                        <div style={{ minWidth: 140, display: "flex", justifyContent: "flex-end" }}>
                          {streak > 0 ? (
                            <span className="streak-badge">🔥 {streak}d streak</span>
                          ) : (
                            <span className="streak-badge" style={{ visibility: "hidden" }}>🔥 0d streak</span>
                          )}
                        </div>
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => setEditingCommitment(h)}
                          style={{ width: 32, height: 32 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* GOALS */}
        {filter === "goal" && (
          <div>
            <div className="section-header">Goals ({goals.length} Active)</div>
            {goals.length === 0 ? (
              <p className="text-muted text-sm">No active goals.</p>
            ) : (
              <div className="dashboard-grid">
                {goals.map((g) => (
                  <GoalCard key={g.id} goal={g} showSubGoals onEdit={(goal) => setEditingCommitment(goal)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TASKS */}
        {filter === "task" && (
          <div>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Tasks ({tasks.length} Active)</span>
              <div style={{ fontSize: 12, display: "flex", gap: 12, fontWeight: 500, color: "var(--fg-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="priority-dot high" /> High</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="priority-dot med" /> Medium</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="priority-dot low" /> Low</div>
              </div>
            </div>
            <TaskGroupView tasks={tasks} onEdit={(task) => setEditingCommitment(task)} />
          </div>
        )}

        {/* LISTS */}
        {filter === "list" && (
          <div>
            <div className="section-header">Lists ({lists.length} Active)</div>
            {lists.length === 0 ? (
              <p className="text-muted text-sm">No lists yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                {lists.map((l) => (
                  <div key={l.id} className="card" style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{l.title}</h3>
                      <button className="icon-btn" title="Edit" onClick={() => setEditingCommitment(l)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-muted text-sm">{l.description || "No description"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(showCreate || editingCommitment) && (
        <CreateCommitmentModal
          defaultType={createType}
          commitmentToEdit={editingCommitment}
          onClose={() => {
            setShowCreate(false);
            setEditingCommitment(null);
          }}
        />
      )}
    </div>
  );
}

// ── Summary Card ─────────────────────────────────────────────────────────

function SummaryCard({ icon, label, count, items, onClick }) {
  return (
    <div
      className="card"
      style={{ padding: 20, cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
      onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--fg-muted)"; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--border)"; }}
      onClick={onClick}
    >
      <h3 style={{ fontSize: 14, margin: "0 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{icon} {label}</span>
        <span className="text-xs text-muted" style={{ background: "var(--surface-raised)", padding: "2px 8px", borderRadius: 12 }}>
          {count} Active
        </span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{item.left}</span>
            <span className="text-muted" style={item.rightStyle}>{item.right}</span>
          </div>
        ))}
        {count > items.length && (
          <div style={{ textAlign: "center", paddingTop: 4, opacity: 0.5 }}>
            + {count - items.length} more
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task group view (Inbox / Today / Upcoming) ─────────────────────────

function TaskGroupView({ tasks, onEdit }) {
  const todayISO = new Date().toISOString().split("T")[0];
  const inbox = tasks.filter((t) => !t.due_date);
  const todayTasks = tasks.filter((t) => t.due_date === todayISO);
  const upcoming = tasks.filter((t) => t.due_date && t.due_date > todayISO);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
      <TaskColumn icon="📥" label="Inbox" tasks={inbox} onEdit={onEdit} />
      <TaskColumn icon="☀️" label="Today" tasks={todayTasks} onEdit={onEdit} />
      <TaskColumn icon="📅" label="Upcoming" tasks={upcoming} onEdit={onEdit} />
    </div>
  );
}

function TaskColumn({ icon, label, tasks, onEdit }) {
  const { updateCommitment } = usePursuitsStore();

  const handleToggle = async (task) => {
    const newStatus = task.status === "completed" ? "active" : "completed";
    await updateCommitment(task.id, { status: newStatus });
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{icon} {label}</span>
        <span className="text-xs text-muted" style={{ background: "var(--surface-raised)", padding: "2px 8px", borderRadius: 12 }}>
          {tasks.length} items
        </span>
      </h2>
      <div className="task-list">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onToggleStatus={() => handleToggle(t)} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && <p className="text-muted text-sm">All clear ✓</p>}
        <div className="input-bar" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <span style={{ opacity: 0.5 }}>+</span>
          <input type="text" placeholder="Quick add..." style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: 14, color: "var(--fg)" }} />
        </div>
      </div>
    </div>
  );
}
