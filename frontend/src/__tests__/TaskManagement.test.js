import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import TaskManagement from '../../pages/tasks';
import pmfusionAPI from '../lib/api';
import { act } from 'react-dom/test-utils';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    request: jest.fn().mockResolvedValue([])
  }
}));

test('task management renders without crashing', async () => {
  await act(async () => {
    render(<TaskManagement />);
  });
});
