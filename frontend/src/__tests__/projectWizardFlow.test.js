import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectCreationWizard from '../components/ProjectCreationWizard';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    createProject: jest.fn().mockResolvedValue({ id: 'proj1' }),
    generateProjectWBS: jest.fn().mockResolvedValue({})
  }
}));
jest.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) } }
}));

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

it.skip('creates a project through the wizard', async () => {
  const onCreated = jest.fn();
  render(<ProjectCreationWizard onProjectCreated={onCreated} onCancel={() => {}} />);

  await userEvent.type(screen.getByLabelText(/Project Name/i), 'Test Project');
  await userEvent.type(screen.getByLabelText(/Start Date/i), tomorrow);
  await userEvent.type(screen.getByLabelText(/End Date/i), nextWeek);
  await userEvent.click(screen.getByRole('button', { name: /Next/i }));

  // step2 -> next
  await userEvent.click(screen.getByRole('button', { name: /Next/i }));
  // step3 -> next
  await userEvent.click(screen.getByRole('button', { name: /Confirm & Continue/i }));

  await userEvent.click(screen.getByRole('button', { name: /Create Project/i }));

  await waitFor(() => expect(onCreated).toHaveBeenCalled());
});
