import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HabitCard from "../components/HabitCard";

const mockHabit = {
  id: 1, name: "Morning run", color: "#3B82F6",
  category: "Health", description: "Run 5k",
  current_streak: 3,
};

describe("HabitCard", () => {
  it("renders habit name and category", () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Morning run")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
  });

  it("shows streak count", () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText(/🔥 3/)).toBeInTheDocument();
  });

  it("opens modal on check-in click", async () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    await userEvent.click(screen.getByText("✓ Check in"));
    expect(screen.getByText(/Check in: Morning run/)).toBeInTheDocument();
  });
});
