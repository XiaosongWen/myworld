import { useState } from "react";

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

export default function HabitForm({ onSubmit, initialData = null, onCancel = null }) {
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, category: category || null, description: description || null });
    if (!initialData) {
      setName(""); setColor(PRESET_COLORS[0]); setCategory(""); setDescription("");
    }
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <input
        type="text" placeholder="Habit name" value={name}
        onChange={(e) => setName(e.target.value)} required
      />
      <div className="color-picker">
        {PRESET_COLORS.map((c) => (
          <button
            key={c} type="button"
            className={`color-swatch ${c === color ? "selected" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <input
        type="text" placeholder="Category (optional)" value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)" value={description}
        onChange={(e) => setDescription(e.target.value)} rows={2}
      />
      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button type="submit">{initialData ? "Save" : "Add habit"}</button>
      </div>
    </form>
  );
}
