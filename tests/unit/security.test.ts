import { describe, it, expect } from 'vitest'
import { isSafeUrl, hashToken, generateToken } from '../../src/backend/utils/security'
import { urlSchema, usernameSchema } from '../../src/backend/utils/validation'

describe('security utils', () => {
  it('allows https', () => expect(isSafeUrl('https://example.com')).toBe(true))
  it('allows http', () => expect(isSafeUrl('http://example.com')).toBe(true))
  it('blocks javascript', () => expect(isSafeUrl('javascript:alert(1)')).toBe(false))
  it('blocks data', () => expect(isSafeUrl('data:text/html,hi')).toBe(false))
  it('hash is deterministic', async () => {
    const h1 = await hashToken('hello')
    const h2 = await hashToken('hello')
    expect(h1).toBe(h2)
    expect(h1.length).toBe(64)
  })
  it('generateToken unique', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })
})

describe('validation', () => {
  it('username ok', () => expect(usernameSchema.safeParse('rizki_123').success).toBe(true))
  it('username rejects uppercase', () => expect(usernameSchema.safeParse('Rizki').success).toBe(false))
  it('url rejects javascript', () => expect(urlSchema.safeParse('javascript:alert(1)').success).toBe(false))
  it('url accepts https', () => expect(urlSchema.safeParse('https://github.com').success).toBe(true))
})
