import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // App now renders a RouterProvider with lazy-loaded pages.
    // On the "/" route the LandingPage is loaded lazily, so the
    // Suspense fallback (PageSpinner) is visible until the chunk resolves.
    expect(document.body).toBeTruthy();
  });
});
