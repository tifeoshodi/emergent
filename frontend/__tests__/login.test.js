import { render, screen } from '@testing-library/react'
import Login from '../pages/login'

test('renders login heading', () => {
  render(<Login />)
  expect(screen.getByText(/Login/i)).toBeInTheDocument()
})
