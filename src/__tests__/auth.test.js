import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../sha1.js', () => ({
  sha1: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ auth: {} }))

import { adminKeyMatch, adminSignIn, userSignIn } from '../auth.js'
import { sha1 } from '../sha1.js'
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('adminKeyMatch', () => {
  it('returns true when SHA1 of key matches env var', async () => {
    vi.stubEnv('VITE_ADMIN_KEY_HASH', 'abc123hash')
    sha1.mockResolvedValue('abc123hash')
    expect(await adminKeyMatch('somekey')).toBe(true)
  })

  it('returns false when SHA1 does not match', async () => {
    vi.stubEnv('VITE_ADMIN_KEY_HASH', 'abc123hash')
    sha1.mockResolvedValue('differenthash')
    expect(await adminKeyMatch('wrongkey')).toBe(false)
  })
})

describe('adminSignIn', () => {
  it('calls Firebase signInWithEmailAndPassword', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'admin1' } })
    await adminSignIn('admin@test.com', 'pass')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'admin@test.com', 'pass')
  })
})

describe('userSignIn', () => {
  it('calls Firebase signInAnonymously', async () => {
    signInAnonymously.mockResolvedValue({ user: { uid: 'anon1' } })
    const result = await userSignIn()
    expect(signInAnonymously).toHaveBeenCalledWith({})
    expect(result.user.uid).toBe('anon1')
  })
})
