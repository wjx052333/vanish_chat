// src/__tests__/keys.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ db: {} }))

import { getKey, createKey, updateKeyLogin, getAllKeys } from '../keys.js'
import { get, set, update } from 'firebase/database'

beforeEach(() => vi.clearAllMocks())

describe('getKey', () => {
  it('returns null when key does not exist', async () => {
    get.mockResolvedValue({ exists: () => false })
    expect(await getKey('missing')).toBeNull()
  })

  it('returns key data when key exists', async () => {
    const data = { username: 'alice', createdAt: 1000 }
    get.mockResolvedValue({ exists: () => true, val: () => data })
    expect(await getKey('abc')).toEqual(data)
  })
})

describe('createKey', () => {
  it('writes key to Firebase and returns keyId', async () => {
    set.mockResolvedValue()
    const keyId = await createKey('bob')
    expect(set).toHaveBeenCalledOnce()
    expect(typeof keyId).toBe('string')
    expect(keyId.length).toBe(32)
  })
})

describe('updateKeyLogin', () => {
  it('updates uid, lastLoginAt, and lastLoginIp atomically', async () => {
    update.mockResolvedValue()
    await updateKeyLogin('key1', 'uid123', '1.2.3.4')
    expect(update).toHaveBeenCalledOnce()
    const [, payload] = update.mock.calls[0]
    expect(payload.uid).toBe('uid123')
    expect(payload.lastLoginIp).toBe('1.2.3.4')
    expect(typeof payload.lastLoginAt).toBe('number')
  })
})

describe('getAllKeys', () => {
  it('returns empty array when no keys exist', async () => {
    get.mockResolvedValue({ exists: () => false })
    expect(await getAllKeys()).toEqual([])
  })

  it('returns array of keys with id field', async () => {
    get.mockResolvedValue({
      exists: () => true,
      val: () => ({
        key1: { username: 'alice', createdAt: 1000 },
        key2: { username: 'bob', createdAt: 2000 },
      }),
    })
    const result = await getAllKeys()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('id')
  })
})
