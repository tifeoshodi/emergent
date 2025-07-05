import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProjectManagement from '../pages/ProjectManagement';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));

test('project management shows no projects message', async () => {
  axios.get.mockResolvedValue({ data: [] });
  await act(async () => {
    render(<BrowserRouter><ProjectManagement /></BrowserRouter>);
  });
  expect(await screen.findByText(/No Projects Yet/i)).toBeInTheDocument();
});
