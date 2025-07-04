import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../components/KanbanBoard';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    getDisciplineKanban: jest.fn().mockResolvedValue({
      backlog: [{ id: '1', title: 'P&ID Development' }],
      todo: [],
      in_progress: [],
      review_dic: [],
      review_idc: [],
      review_dcc: [],
      done: []
    }),
    updateTaskStatus: jest.fn().mockResolvedValue({})
  }
}));
jest.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) } }
}));

test.skip('dragging tasks across lanes via keyboard', async () => {
  render(<KanbanBoard />);

  const backlogHeading = await screen.findByRole('heading', { name: /Backlog/i });
  const todoHeading = await screen.findByRole('heading', { name: /To Do/i });

  const backlogColumn = backlogHeading.closest('div');
  const todoColumn = todoHeading.closest('div');

  const task = within(backlogColumn).getByText('P&ID Development');
  task.focus();
  await userEvent.keyboard('{arrowright}');

  expect(within(todoColumn).getByText('P&ID Development')).toBeInTheDocument();
});
