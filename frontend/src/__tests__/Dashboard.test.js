import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';

test('dashboard shows no projects message', async () => {
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );

  await waitFor(() =>
    expect(screen.getByText(/No Projects Found/i)).toBeInTheDocument()
  );
});
