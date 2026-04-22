import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  push: vi.fn(),
  onChildAdded: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ db: {} }))

import { sendMessage, deleteMessage, cleanExpiredMessages, MESSAGE_TTL } from '../messages.js'
import { push, remove, get } from 'firebase/database'

beforeEach(() => vi.clearAllMocks())

describe('MESSAGE_TTL', () => {
  it('is 10000ms', () => {
    expect(MESSAGE_TTL).toBe(10000)
  })
})

describe('sendMessage', () => {
  it('pushes message to correct Firebase path', async () => {
    push.mockResolvedValue()
    await sendMessage('key1', 'hello', 'admin')
    expect(push).toHaveBeenCalledOnce()
    const [, payload] = push.mock.calls[0]
    expect(payload.text).toBe('hello')
    expect(payload.sender).toBe('admin')
    expect(typeof payload.createdAt).toBe('number')
  })
})

describe('deleteMessage', () => {
  it('removes message from Firebase', async () => {
    remove.mockResolvedValue()
    await deleteMessage('key1', 'msg1')
    expect(remove).toHaveBeenCalledOnce()
  })
})

describe('cleanExpiredMessages', () => {
  it('deletes messages older than MESSAGE_TTL', async () => {
    const old = Date.now() - 20000
    const fresh = Date.now() - 1000
    get.mockResolvedValue({
      exists: () => true,
      forEach: (cb) => {
        cb({ key: 'msg1', val: () => ({ createdAt: old }) })
        cb({ key: 'msg2', val: () => ({ createdAt: fresh }) })
      },
    })
    remove.mockResolvedValue()
    await cleanExpiredMessages('key1')
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
