import { render, screen } from "@testing-library/react";
import App from "../../App";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../features/planner/store/useGardenStore", () => {
  const actual = jest.requireActual(
    "../../features/planner/store/useGardenStore"
  );

  return {
    ...actual,
    useGardenStore: Object.assign(actual.useGardenStore, {
      persist: {
        onFinishHydration: (callback) => {
          callback();
          return () => {};
        },
        rehydrate: jest.fn(),
      },
    }),
  };
});

describe("App - Home Page", () => {
  test("App renders without crashing", () => {
    render(<MemoryRouter>
      <App />
    </MemoryRouter>);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  test("Home page displays main heading", async () => {
  render(<MemoryRouter>
      <App />
    </MemoryRouter>);

  expect(
    await screen.findByRole("heading", {
      name: /free vegetable garden planner/i,
    })
  ).toBeInTheDocument();
});
});

describe("App - Planner Page", () => {
  test("Planner page displays garden name from the store", async () => {
    render(<MemoryRouter initialEntries={["/planner"]}><App /></MemoryRouter>);
    
    expect(
    await screen.findByDisplayValue(/my garden/i)
  ).toBeInTheDocument();
});
});