import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App Smoke Tests', () => {
  test('App renders without crashing', () => {
    render(<App />);
    // If we get here, the app rendered successfully
    expect(true).toBe(true);
  });

  test('Home page content appears', () => {
    render(<App />);
    // Check for common home page elements
    const headings = screen.queryAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });
});
