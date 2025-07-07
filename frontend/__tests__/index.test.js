import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

it('renders heading', () => {
  render(<Home />)
  expect(screen.getByText(/PMFusion Frontend/i)).toBeInTheDocument()
})
