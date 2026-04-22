import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBurnTimer } from '../hooks/useBurnTimer.js'

vi.mock('../messages.js', () => ({
  deleteMessage: vi.fn().mockResolvedValue(),
  MESSAGE_TTL: 10000,
}))

import { deleteMessage } from '../messages.js'

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

describe('useBurnTimer', () => {
  it('calls deleteMessage and onBurned after TTL', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg1', createdAt: Date.now() }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(10000))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg1')
    expect(onBurned).toHaveBeenCalledWith('msg1')
  })

  it('accounts for already-elapsed time', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg2', createdAt: Date.now() - 8000 }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(2000))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg2')
  })

  it('fires immediately if message is already expired', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg3', createdAt: Date.now() - 15000 }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(0))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg3')
  })
})
