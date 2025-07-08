import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../pages/index';

test('home page renders', async () => {
  render(<Home />);

  await waitFor(() =>
    expect(screen.getByText(/PMFusion/i)).toBeInTheDocument()
  );
});
