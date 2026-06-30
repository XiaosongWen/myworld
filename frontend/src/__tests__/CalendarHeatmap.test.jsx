import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarHeatmap from "../components/CalendarHeatmap";

describe("CalendarHeatmap", () => {
  it("renders with empty data", () => {
    render(<CalendarHeatmap data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText(/Contribution graph/)).toBeInTheDocument();
  });

  it("renders with data", () => {
    const data = [{ date: "2026-06-01", count: 3 }];
    render(<CalendarHeatmap data={data} onClickDay={vi.fn()} year={2026} />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});
