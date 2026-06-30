import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckInModal from "../components/CheckInModal";

describe("CheckInModal", () => {
  it("renders modal with habit name", () => {
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Check in: Run/)).toBeInTheDocument();
  });

  it("calls onConfirm with date and note", async () => {
    const onConfirm = vi.fn();
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={onConfirm} onClose={vi.fn()} />);
    await userEvent.click(screen.getByText("Check in"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on overlay click", async () => {
    const onClose = vi.fn();
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
