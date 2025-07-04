import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../components/KanbanBoard';

test('dragging tasks across lanes via keyboard', async () => {
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
