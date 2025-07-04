import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import UserManagement from '../pages/UserManagement';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));

test('user management renders without crashing', async () => {
  axios.get.mockResolvedValue({ data: [] });
  await act(async () => {
    render(<BrowserRouter><UserManagement /></BrowserRouter>);
  });
});
