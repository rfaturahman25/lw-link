import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import type { AuthUser } from '../../middleware/auth'

type Bindings = { MEDIA?: R2Bucket }

const uploadRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

uploadRoutes.use('*', authMiddleware(true))

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

uploadRoutes.post('/', async (c) => {
  const bucket = c.env.MEDIA
  if (!bucket) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_UNAVAILABLE',
          message: 'Media storage is not configured. Create the R2 bucket to enable uploads.',
        },
      },
      503
    )
  }

  const user = c.get('user') as AuthUser
  const form = await c.req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return c.json({ success: false, error: { code: 'NO_FILE', message: 'No file provided' } }, 400)
  }
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return c.json(
      { success: false, error: { code: 'INVALID_TYPE', message: 'Only PNG, JPEG, WEBP or GIF allowed' } },
      400
    )
  }
  if (file.size > MAX_BYTES) {
    return c.json({ success: false, error: { code: 'TOO_LARGE', message: 'Max file size is 2MB' } }, 400)
  }

  const key = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return c.json({ success: true, data: { url: `/media/${key}` } })
})

export default uploadRoutes
