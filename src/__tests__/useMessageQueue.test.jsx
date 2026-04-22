import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useMessageQueue', () => {
  it('starts with no displayed messages', () => {
    const { result } = renderHook(() => useMessageQueue())
    expect(result.current.displayed).toEqual([])
  })

  it('displays first message immediately on enqueue', () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'hello' })
    })
    expect(result.current.displayed).toHaveLength(1)
    expect(result.current.displayed[0].id).toBe('1')
  })

  it('delays second message by 1 second', async () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'first' })
      result.current.enqueue({ id: '2', text: 'second' })
    })
    expect(result.current.displayed).toHaveLength(1)
    await act(async () => vi.advanceTimersByTime(1000))
    expect(result.current.displayed).toHaveLength(2)
  })

  it('removeDisplayed removes message by id', () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'hello' })
    })
    act(() => {
      result.current.removeDisplayed('1')
    })
    expect(result.current.displayed).toHaveLength(0)
  })
})
