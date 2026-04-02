import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";

describe("Routing Tests", () => {
  test("Home page renders by default", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", {
        name: /free vegetable garden planner/i,
      })
    ).toBeInTheDocument();
  });

  test("user can navigate from Home to Planner", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    const link = await screen.findByRole("link", {
      name: /create a plan/i,
    });

    await user.click(link);

    expect(
      await screen.findByDisplayValue(/my garden/i)
    ).toBeInTheDocument();
  });
});