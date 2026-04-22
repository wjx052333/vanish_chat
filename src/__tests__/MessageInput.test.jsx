import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../components/MessageInput.jsx'

describe('MessageInput', () => {
  it('calls onSend with trimmed text and clears input', async () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await userEvent.type(input, '  hello  ')
    await userEvent.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input).toHaveValue('')
  })

  it('does not call onSend for whitespace-only input', async () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    await userEvent.type(screen.getByPlaceholderText('输入消息...'), '   ')
    await userEvent.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
