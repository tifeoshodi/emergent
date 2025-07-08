import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Home from '../../pages/index';
import { act } from 'react-dom/test-utils';

test('home page renders for user management', async () => {
  await act(async () => {
    render(<Home />);
  });
});
