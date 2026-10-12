import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the home page greeting', () => {
    render(<HomePage />)

    expect(
      screen.getByText('Hi uma srinivas home')
    ).toBeInTheDocument()
  })
})