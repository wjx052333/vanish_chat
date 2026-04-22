// src/__tests__/keys.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ db: {} }))

import { getKey, createKey, updateKeyLogin, getAllKeys } from '../keys.js'
import { get, set } from 'firebase/database'

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
