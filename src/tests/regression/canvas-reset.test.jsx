import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Plan from "@/features/planner/components/Plan";


vi.mock("@/features/planner/state/useGardenStore", () => ({
  useGardenStore: (selector) =>
    selector({
      selected: null,

      currentLayout: {
        id: "layout-1",
        name: "My garden",
        width: 1200,
        height: 800,
        shapes: {}, // ← після reset
      },

      currentPlan: {
        id: "plan-1",
        name: "My garden",
        year: 2026,
        layoutId: "layout-1",
        plantings: {}, // ← після reset
      },

      createRectangle: vi.fn(),
      createCircle: vi.fn(),
      clearSelection: vi.fn(),
      reset: vi.fn(),
      setLayoutName: vi.fn(),
      setYear: vi.fn(),
      saveCurrentPlan: vi.fn(),
    }),
}));

describe("Regression: canvas does not crash after plan reset", () => {
  test("planner page renders with empty plan", () => {
    render(<Plan />);

    // Canvas UI
    expect(screen.getByText(/name your garden/i)).toBeInTheDocument();

    // Reset button exists
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();

    // Save button exists
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });
  test("does not throw if store returns empty objects", () => {
  expect(() => render(<Plan />)).not.toThrow();
});

});
