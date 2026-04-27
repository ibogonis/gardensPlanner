import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import PlannerHeader from "../../features/planner/components/PlannerHeader/PlannerHeader";

const mockState = {
  currentPlan: { id: "123", year: 2024 },
  currentLayout: { name: "My garden" },
  currentGarden: { title: "My garden" },

  reset: jest.fn(),
  setLayoutName: jest.fn(),
  setYear: jest.fn(),
  saveCurrentPlan: jest.fn().mockResolvedValue({}),
};

jest.mock("../../features/planner/store/useGardenStore", () => ({
  useGardenStore: (selector) => selector(mockState),
}));

beforeAll(() => {
  window.alert = jest.fn();
});

describe("PlannerHeader", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  test("user can reset garden", async () => {
    render(<PlannerHeader />);

    const resetBtn = screen.getByRole("button", { name: /reset/i });

    await act(async () => {
      await user.click(resetBtn);
    });

    expect(mockState.reset).toHaveBeenCalledTimes(1);
  });

  test("user enters edit mode", async () => {
    render(<PlannerHeader />);

    const editBtn = screen.getByRole("button", { name: /edit/i });

    await act(async () => {
      await user.click(editBtn);
    });

    expect(
      await screen.findByPlaceholderText(/garden name/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  test("user can cancel edit mode", async () => {
    render(<PlannerHeader />);

    const editBtn = screen.getByRole("button", { name: /edit/i });

    await act(async () => {
      await user.click(editBtn);
    });

    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });

    await act(async () => {
      await user.click(cancelBtn);
    });

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(/garden name/i),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("My garden")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /save changes/i }),
      ).not.toBeInTheDocument();
    });
  });

  test("user can save updated garden name and year", async () => {
    render(<PlannerHeader />);

    await user.click(screen.getByRole("button", { name: /edit/i }));

    const nameInput = await screen.findByPlaceholderText(/garden name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New garden name");

    const yearInput = screen.getByDisplayValue(/2024/);
    await user.clear(yearInput);
    await user.type(yearInput, "2025");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockState.setLayoutName).toHaveBeenCalledWith("New garden name");
    expect(mockState.setYear).toHaveBeenCalledWith(2025);
    expect(mockState.saveCurrentPlan).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(/garden name/i),
      ).not.toBeInTheDocument();
    });
  });
});
