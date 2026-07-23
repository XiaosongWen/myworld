import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "../App";

vi.mock("../stores/usePursuitsStore", () => ({
  default: (selector) => {
    const state = {
      commitments: [],
      records: [],
      daily: null,
      loading: false,
      error: null,
      fetchCommitments: vi.fn(),
      fetchRecords: vi.fn(),
      fetchDaily: vi.fn(),
      createRecord: vi.fn(),
      checkInHabit: vi.fn(),
      uncheckHabit: vi.fn(),
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

describe("App routing", () => {
  it("renders dashboard on the root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // Dashboard renders the live clock container
    const clockContainer = document.querySelector(".flip-clock-container");
    expect(clockContainer).not.toBeNull();
  });

  it("renders Pursuits heading on /commitments", () => {
    render(
      <MemoryRouter initialEntries={["/commitments"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Pursuits" })).toBeInTheDocument();
  });

  it("renders Knowledge heading on /knowledge", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Knowledge" })).toBeInTheDocument();
  });

  it("renders sidebar alongside route content", () => {
    render(
      <MemoryRouter initialEntries={["/photos"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Nest")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Photos" })).toBeInTheDocument();
  });
});
