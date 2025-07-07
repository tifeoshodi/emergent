import { render, screen } from '@testing-library/react'
import Kanban from '../pages/kanban'

test('renders kanban heading', () => {
  render(<Kanban />)
  expect(screen.getByText(/Kanban Board/i)).toBeInTheDocument()
})
