import { render, screen } from "@testing-library/react";
import Canvas from "../../components/Canvas";

// 🔹 mutable mock state
let mockState = {
  currentLayout: {
    shapes: {},
    name: "My garden",
  },
  currentPlan: {
    plantings: {},
    year: 2026,
  },
  createRectangle: jest.fn(),
  createCircle: jest.fn(),
  clearSelection: jest.fn(),
  reset: jest.fn(),
  setLayoutName: jest.fn(),
  setYear: jest.fn(),
  saveCurrentPlan: jest.fn(),
};

// 🔹 правильний mock
jest.mock("../../state/useGardenStore", () => ({
  useGardenStore: (selector) => selector(mockState),
}));

describe("Regression: Canvas stability after reset", () => {
  beforeEach(() => {
    mockState.currentLayout.shapes = {};
    mockState.currentPlan.plantings = {};
  });

  test("renders with empty state", () => {
    render(<Canvas />);
    expect(screen.getByText(/name your garden/i)).toBeInTheDocument();
  });

  test("does not crash when shapes is null", () => {
    mockState.currentLayout.shapes = null;
    render(<Canvas />);
    expect(screen.getByText(/name your garden/i)).toBeInTheDocument();
  });
});
