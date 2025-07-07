import { render, screen } from '@testing-library/react'
import Dashboard from '../pages/dashboard'

test('renders dashboard heading', () => {
  render(<Dashboard />)
  expect(screen.getByText(/Project Dashboard/i)).toBeInTheDocument()
})
