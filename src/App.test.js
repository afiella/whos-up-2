import { render, screen } from '@testing-library/react';
import App from './App';

// Prevent Firestore initialization during tests
jest.mock('./firebase/initializeFirestore', () => ({
  initializeRooms: jest.fn(),
}));

test("renders landing page welcome text", () => {
  render(<App />);
  const textElement = screen.getByText(/Welcome to Who's Up/i);
  expect(textElement).toBeInTheDocument();
});
