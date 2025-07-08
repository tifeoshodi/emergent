import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProjectsPage from '../../pages/projects';
import pmfusionAPI from '../lib/api';
import { act } from 'react-dom/test-utils';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    getProjects: jest.fn().mockResolvedValue([])
  }
}));

test('project management shows no projects message', async () => {
  await act(async () => {
    render(<ProjectsPage />);
  });
  expect(await screen.findByText(/No Projects Found/i)).toBeInTheDocument();
});
