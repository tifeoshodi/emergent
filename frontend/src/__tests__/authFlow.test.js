import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, { AuthProvider } from '../../pages/index';
import Router from 'next/router';

jest.mock('next/router', () => require('next-router-mock'));

// Helper to render with provider
const renderApp = () => render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

it.skip('authenticates and redirects to home', async () => {
  renderApp();
  const input = screen.getByPlaceholderText(/User ID/i);
  await userEvent.type(input, '123');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => expect(screen.getByText(/Open Dashboard/i)).toBeInTheDocument());
  expect(Router).toHaveProperty('pathname');
});
