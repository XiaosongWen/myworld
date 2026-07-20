import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HabitChecklist from "../components/pursuits/HabitChecklist";
import GoalCard from "../components/pursuits/GoalCard";
import TaskCard from "../components/pursuits/TaskCard";
import PlannerEntry from "../components/pursuits/PlannerEntry";

describe("Pursuits Components", () => {
  it("renders HabitChecklist and handles check-in", () => {
    const habit = { id: 1, title: "Read Book", status: "pending", progress: { streak: 5 } };
    const onCheckIn = vi.fn();

    const { container } = render(
      <HabitChecklist habit={habit} checked={false} streak={5} onCheckIn={onCheckIn} />
    );

    expect(screen.getByText("Read Book")).toBeInTheDocument();
    expect(screen.getByText("🔥 5 days")).toBeInTheDocument();

    const checkbox = container.querySelector(".checkbox");
    fireEvent.click(checkbox);
    expect(onCheckIn).toHaveBeenCalledWith(1);
  });

  it("renders GoalCard with correct progress from API shape", () => {
    const goal = { id: 1, title: "Lose Weight", progress: { percent: 50, done: 10, total: 20, method: "count" } };
    render(<GoalCard goal={goal} />);
    expect(screen.getByText("Lose Weight", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders TaskCard and handles toggle", () => {
    const task = { id: 1, title: "Buy groceries", priority: "high", status: "active" };
    const onToggle = vi.fn();
    render(<TaskCard task={task} onToggleStatus={onToggle} />);

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    const statusEl = screen.getByTitle("Toggle status");
    fireEvent.click(statusEl);
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it("renders PlannerEntry and submits on Enter", () => {
    const onSubmit = vi.fn();
    render(<PlannerEntry onSubmitRecord={onSubmit} />);

    const input = screen.getByPlaceholderText(/Add what you did today/i);
    fireEvent.change(input, { target: { value: "Did some work" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSubmit).toHaveBeenCalledWith("Did some work");
    expect(input.value).toBe("");
  });
});
