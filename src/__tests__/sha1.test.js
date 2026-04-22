import { sha1 } from '../sha1.js'

describe('sha1', () => {
  it('hashes known input correctly', async () => {
    const result = await sha1('hello')
    expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('returns lowercase hex string of length 40', async () => {
    const result = await sha1('test')
    expect(result).toMatch(/^[0-9a-f]{40}$/)
  })

  it('produces different hashes for different inputs', async () => {
    const a = await sha1('abc')
    const b = await sha1('def')
    expect(a).not.toBe(b)
  })
})
