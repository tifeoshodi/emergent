import { render, screen } from '@testing-library/react'
import DocumentQueue from '../pages/document-queue'

test('renders document queue heading', () => {
  render(<DocumentQueue />)
  expect(screen.getByText(/Document Queue/i)).toBeInTheDocument()
})
