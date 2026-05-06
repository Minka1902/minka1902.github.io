import { render } from '@testing-library/react';
import App from '@/App';

test('renders without crashing', () => {
  render(<App />);
  // App renders RouterProvider which will show loading state from AuthProvider
  // Just verify it renders something without throwing
  expect(document.body).toBeTruthy();
});
