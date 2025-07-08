import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import DocumentControlPage from '../../pages/document-control';
import pmfusionAPI from '../lib/api';
import { act } from 'react-dom/test-utils';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    getDocuments: jest.fn().mockResolvedValue([])
  }
}));

test('document control renders without crashing', async () => {
  await act(async () => {
    render(<DocumentControlPage />);
  });
});
