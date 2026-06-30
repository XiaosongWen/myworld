import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MonthCalendar from "../components/MonthCalendar";

describe("MonthCalendar", () => {
  it("renders month navigation", () => {
    render(<MonthCalendar data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeInTheDocument();
  });

  it("shows day headers", () => {
    render(<MonthCalendar data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });
});
