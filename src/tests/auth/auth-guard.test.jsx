import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { AuthContext } from "../../app/providers/AuthProvider";

function renderWithAuth(ui, { user = null, route = "/planner" } = {}) {
  return render(
    <AuthContext.Provider value={{ user, loading: false }}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("AuthGuard", () => {
  test("redirects unauthenticated user to login", async () => {
    renderWithAuth(<App />, { user: null });

    expect(
      await screen.findByText(/login/i)
    ).toBeInTheDocument();
  });

  test("allows authenticated user to access planner", async () => {
    renderWithAuth(<App />, { user: { id: 1 } });

    expect(
      await screen.findByDisplayValue(/my garden/i)
    ).toBeInTheDocument();
  });
});