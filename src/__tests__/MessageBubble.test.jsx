import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../components/MessageBubble.jsx'

vi.mock('../hooks/useBurnTimer.js', () => ({ useBurnTimer: vi.fn() }))
vi.mock('../messages.js', () => ({ MESSAGE_TTL: 10000 }))

const msg = { id: 'msg1', text: 'hello world', sender: 'user', createdAt: Date.now() }

describe('MessageBubble', () => {
  it('renders message text', () => {
    render(<MessageBubble keyId="key1" message={msg} onBurned={vi.fn()} />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('applies admin class for admin messages', () => {
    const adminMsg = { ...msg, sender: 'admin' }
    const { container } = render(
      <MessageBubble keyId="key1" message={adminMsg} onBurned={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('bubble--admin')
  })

  it('applies user class for user messages', () => {
    const { container } = render(
      <MessageBubble keyId="key1" message={msg} onBurned={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('bubble--user')
  })
})
