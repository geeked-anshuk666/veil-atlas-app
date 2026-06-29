/**
 * Shared server-side validation & rate-limiting utilities.
 * All functions return either null (ok) or an error string.
 */

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const LAT_MIN = -90
const LAT_MAX = 90
const LNG_MIN = -180
const LNG_MAX = 180

export function validateCoords(lat: unknown, lng: unknown): string | null {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || la < LAT_MIN || la > LAT_MAX) return 'Invalid latitude'
  if (!Number.isFinite(ln) || ln < LNG_MIN || ln > LNG_MAX) return 'Invalid longitude'
  return null
}

export function validateText(
  value: unknown,
  fieldName: string,
  { min = 1, max = 500 }: { min?: number; max?: number } = {}
): string | null {
  if (typeof value !== 'string') return `${fieldName} must be a string`
  const trimmed = value.trim()
  if (trimmed.length < min) return `${fieldName} is too short (min ${min} chars)`
  if (trimmed.length > max) return `${fieldName} is too long (max ${max} chars)`
  return null
}

export function validateEnum(value: unknown, allowed: string[], fieldName: string): string | null {
  if (typeof value !== 'string' || !allowed.includes(value))
    return `${fieldName} must be one of: ${allowed.join(', ')}`
  return null
}

// ---------------------------------------------------------------------------
// Simple in-process rate limiter (token-bucket per IP)
// Resets on each cold start — sufficient protection for a Vercel deployment.
// ---------------------------------------------------------------------------

interface Bucket {
  tokens: number
  last: number
}

const buckets = new Map<string, Bucket>()

/**
 * @param ip       Caller IP address string
 * @param limit    Max allowed requests per window
 * @param windowMs Rolling window in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket) {
    buckets.set(ip, { tokens: limit - 1, last: now })
    return true
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.last
  const refill = Math.floor((elapsed / windowMs) * limit)

  bucket.tokens = Math.min(limit, bucket.tokens + refill)
  bucket.last = now

  if (bucket.tokens <= 0) return false
  bucket.tokens--
  return true
}

/** Extract best-effort client IP from a Next.js request */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
