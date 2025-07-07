import '@testing-library/jest-dom';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../features/kanban/KanbanBoard';
import pmfusionAPI from '../lib/api';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    isMockClient: true,
  }
}));

/**
 * Test that dragging a task issues a PUT request and persists
 * after refreshing the board.
 */
test('dragging persists after refresh', async () => {
  const initial = {
    backlog: [{ id: '1', title: 'Test Task' }],
    todo: [],
    in_progress: [],
    review_dic: [],
    review_idc: [],
    review_dcc: [],
    done: []
  };
  let kanban = JSON.parse(JSON.stringify(initial));
  let methodUsed;

  // Mock the request method
  pmfusionAPI.request = jest.fn((endpoint, options = {}) => {
    if (endpoint === '/disciplines/1/kanban?project_id=1') {
      return Promise.resolve({ kanban });
    }
    if (endpoint === '/tasks/1') {
      methodUsed = options.method;
      const body = JSON.parse(options.body);
      kanban.backlog = kanban.backlog.filter(t => t.id !== '1');
      kanban[body.status].push({ id: '1', title: 'Test Task', status: body.status });
      return Promise.resolve({});
    }
    return Promise.resolve({});
  });

  render(<KanbanBoard disciplineId="1" projectId="1" />);

  // Task initially in Backlog
  const taskText = await screen.findByText('Test Task');
  const card = taskText.closest('div');

  // Move task to To Do
  card.focus();
  fireEvent.keyDown(card, { key: 'ArrowRight', code: 'ArrowRight' });

  const movedCard = screen.getByText('Test Task');
  let droppable = movedCard.closest('[data-rfd-droppable-id]');
  expect(droppable).toHaveAttribute('data-rfd-droppable-id', 'todo');
  expect(methodUsed).toBe('PUT');

  // Refresh board
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  // Wait for state to reflect refreshed data
  await waitFor(() => {
    const refreshedCard = screen.getByText('Test Task');
    droppable = refreshedCard.closest('[data-rfd-droppable-id]');
    expect(droppable).toHaveAttribute('data-rfd-droppable-id', 'todo');
  });
});
