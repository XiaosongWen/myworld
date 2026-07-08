import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "../App";

vi.mock("../stores/useHabitsStore", () => ({
  default: () => ({
    habits: [],
    heatmapData: [],
    loading: false,
    error: null,
    fetchHabits: vi.fn(),
    createHabit: vi.fn(),
    updateHabit: vi.fn(),
    archiveHabit: vi.fn(),
    checkIn: vi.fn(),
    fetchHeatmap: vi.fn(),
  }),
}));

describe("App routing", () => {
  it("renders Dashboard heading on the root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();
  });

  it("renders Habits heading on /habits", () => {
    render(
      <MemoryRouter initialEntries={["/habits"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "Habits" })
    ).toBeInTheDocument();
  });

  it("renders Tasks heading on /tasks", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "Tasks" })
    ).toBeInTheDocument();
  });

  it("renders Knowledge heading on /knowledge", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "Knowledge" })
    ).toBeInTheDocument();
  });

  it("renders sidebar alongside the route content", () => {
    render(
      <MemoryRouter initialEntries={["/photos"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("MyWorld")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Photos" })
    ).toBeInTheDocument();
  });
});
