import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Home from '../../pages/index';
import { act } from 'react-dom/test-utils';


test('home page renders without crashing', async () => {
  await act(async () => {
    render(<Home />);
  });
});
