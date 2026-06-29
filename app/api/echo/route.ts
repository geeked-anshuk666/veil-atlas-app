import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Find the single nearest active echo
  const nearest = await sql`
    SELECT id, lat, lng, content, for_whom, radius_m, created_at,
      haversine(${lat}, ${lng}, lat, lng) as distance
    FROM echoes
    WHERE (expires_at IS NULL OR expires_at > NOW())
    ORDER BY distance ASC
    LIMIT 1
  `

  if (nearest.length === 0) {
    return NextResponse.json(null)
  }

  const echo = nearest[0]
  const isUnlocked = Number(echo.distance) <= Number(echo.radius_m)

  return NextResponse.json({
    id: echo.id,
    lat: Number(echo.lat),
    lng: Number(echo.lng),
    // Mask raw content in the backend if locked
    content: isUnlocked ? echo.content : null,
    for_whom: echo.for_whom,
    radius_m: Number(echo.radius_m),
    distance: Number(echo.distance),
    unlocked: isUnlocked,
    created_at: echo.created_at,
  })
}


export async function POST(request: NextRequest) {
  // Rate limit: 5 echoes per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 5, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, content, for_whom, radius_m, expires_days } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const contentErr = validateText(content, 'content', { min: 1, max: 500 })
    if (contentErr) return NextResponse.json({ error: contentErr }, { status: 400 })

    // Optional for_whom — cap length
    if (for_whom !== undefined && for_whom !== null) {
      const fwErr = validateText(for_whom, 'for_whom', { max: 100 })
      if (fwErr) return NextResponse.json({ error: fwErr }, { status: 400 })
    }

    // Clamp radius and expiry to safe ranges
    const safeRadius = Math.min(Math.max(Number(radius_m) || 30, 10), 5000)
    const safeDays = expires_days ? Math.min(Math.max(Number(expires_days), 1), 365) : null

    const expires_at = safeDays
      ? new Date(Date.now() + safeDays * 86400000).toISOString()
      : null

    await sql`
      INSERT INTO echoes (lat, lng, content, for_whom, radius_m, expires_at)
      VALUES (${lat}, ${lng}, ${content}, ${for_whom || null}, ${safeRadius}, ${expires_at})
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/echo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

