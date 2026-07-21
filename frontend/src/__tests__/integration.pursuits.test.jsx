import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommitmentDetail from "../views/CommitmentDetail";
import LabelPicker from "../components/pursuits/LabelPicker";
import usePursuitsStore from "../stores/pursuitsStore";
import * as labelsApi from "../api/labels";

vi.mock("../api/labels");

describe("Phase 2 Integration Tests: UI-API Data Binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePursuitsStore.setState({
      commitments: [
        {
          id: "c-101",
          title: "Daily Meditation",
          type: "habit",
          status: "active",
          description: "15 mins mindfulness",
          config: { target_count: 7, tags: ["Health"] },
          progress: { streak: 14, percent: 100 },
        },
        {
          id: "c-102",
          title: "Read 10 Books",
          type: "goal",
          status: "active",
          description: "Annual goal",
          config: { target_value: 10, tags: ["Learning"] },
          progress: { percent: 40, streak: 0 },
        },
      ],
      records: [
        { id: "r-1", commitment_id: "c-101", date: "2026-07-20", status: "done", value: 1 },
      ],
      labels: [
        { id: "l-1", name: "Health", color: "#10b981" },
        { id: "l-2", name: "Learning", color: "#3b82f6" },
      ],
      loading: false,
      error: null,
    });
  });

  it("renders CommitmentDetail side panel with accurate activity records and triggers archive", async () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const deleteCommitment = vi.fn().mockResolvedValue(true);
    usePursuitsStore.setState({ deleteCommitment });

    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <CommitmentDetail
        commitmentId="c-101"
        onClose={onClose}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText("Daily Meditation")).toBeInTheDocument();
    expect(screen.getByText(/🔥 0d 2w/)).toBeInTheDocument();

    const archiveBtn = screen.getByText("Archive");
    fireEvent.click(archiveBtn);

    await waitFor(() => {
      expect(deleteCommitment).toHaveBeenCalledWith("c-101");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders LabelPicker, performs real-time search, and creates a new label via API", async () => {
    labelsApi.fetchLabels.mockResolvedValue([
      { id: "l-1", name: "Health", color: "#10b981" },
    ]);
    labelsApi.createLabel.mockResolvedValue({
      id: "l-99",
      name: "Productivity",
      color: "#f59e0b",
    });

    const onChange = vi.fn();

    render(
      <LabelPicker selectedLabels={["Health"]} onChange={onChange} />
    );

    expect(screen.getByText("Health")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Search or create new label/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Productivity" } });

    const createBtn = screen.getByText("Productivity");
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(labelsApi.createLabel).toHaveBeenCalledWith("Productivity", expect.any(String));
      expect(onChange).toHaveBeenCalledWith(["Health", "Productivity"]);
    });
  });
});
