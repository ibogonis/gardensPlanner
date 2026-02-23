import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

describe('App Smoke Tests', () => {
  test('App renders without crashing', () => {
    render(<App />);
    expect(true).toBe(true);
  });

  test("Home page content appears", async () => {
  render(<App />);

  await waitFor(() => {
    const headings = screen.queryAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});
});
