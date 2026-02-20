import { render, screen } from "@testing-library/react";
import Plan from "../../features/planner/components/Plan";

jest.mock("../../features/planner/state/useGardenStore", () => ({
  useGardenStore: (selector) =>
    selector({
      selected: null,

      currentLayout: {
        id: "layout-1",
        name: "My garden",
        width: 1200,
        height: 800,
        shapes: {},
      },

      currentPlan: {
        id: "plan-1",
        name: "My garden",
        year: 2026,
        layoutId: "layout-1",
        plantings: {},
      },

      createRectangle: jest.fn(),
      createCircle: jest.fn(),
      clearSelection: jest.fn(),
      reset: jest.fn(),
      setLayoutName: jest.fn(),
      setYear: jest.fn(),
      saveCurrentPlan: jest.fn(),
    }),
}));

describe("Regression: canvas after reset", () => {
  test("planner renders without crashing", () => {
    render(<Plan />);

    expect(screen.getByText(/name your garden/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });
});
