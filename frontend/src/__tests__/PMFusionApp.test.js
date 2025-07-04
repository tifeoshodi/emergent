import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
jest.mock('../pages/PMFusionApp', () => () => <div>PMFusion</div>);
import PMFusionApp from '../pages/PMFusionApp';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));

jest.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) } }
}));

test('pmfusion app renders without crashing', async () => {
  axios.get.mockResolvedValue({ data: [] });
  await act(async () => {
    render(<BrowserRouter><PMFusionApp /></BrowserRouter>);
  });
});
