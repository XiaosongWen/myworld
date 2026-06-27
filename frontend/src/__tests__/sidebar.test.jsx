import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";

describe("Sidebar", () => {
  it("renders the MyWorld title", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("MyWorld")).toBeInTheDocument();
  });

  it("renders all module navigation links", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const expectedLabels = [
      "Dashboard",
      "Habits",
      "Tasks",
      "Photos",
      "Videos",
      "Books",
      "Documents",
      "Knowledge",
    ];

    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders navigation links with correct hrefs", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Habits").closest("a")).toHaveAttribute("href", "/habits");
    expect(screen.getByText("Tasks").closest("a")).toHaveAttribute("href", "/tasks");
  });
});
