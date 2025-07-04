import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import WBSGenerator from '../components/WBSGenerator';

test('wbs generator loads with empty project list', async () => {
  render(
    <BrowserRouter>
      <WBSGenerator />
    </BrowserRouter>
  );

  expect(await screen.findByText(/Generate Project WBS/i)).toBeInTheDocument();
});
