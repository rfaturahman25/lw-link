export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const arr = Array.from(new Uint8Array(hash))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateToken(): string {
  const uuid = crypto.randomUUID()
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${uuid}.${rand}`
}

export async function hashIP(ip: string): Promise<string> {
  if (!ip || ip === 'unknown') return 'unknown'
  const data = new TextEncoder().encode(ip + '_salt_lwlink')
  const hash = await crypto.subtle.digest('SHA-256', data)
  const arr = Array.from(new Uint8Array(hash))
  return arr.map((b) => b.toString(16).padStart(2, '0')).slice(0, 16).join('')
}

export async function hashPassword(password: string): Promise<string> {
  return hashToken(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const h = await hashPassword(password)
  return h === hash
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function sanitizeString(input: string, maxLen = 500): string {
  return input.trim().slice(0, maxLen)
}
