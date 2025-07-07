import { render, screen } from '@testing-library/react'
import UserManagement from '../pages/user-management'

test('renders user management heading', () => {
  render(<UserManagement />)
  expect(screen.getByText(/User Management/i)).toBeInTheDocument()
})
