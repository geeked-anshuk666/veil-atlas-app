import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const memories = await sql`
    SELECT id, content, lat, lng, year_label, created_at,
      ROUND(haversine(${lat}, ${lng}, lat, lng)::numeric) AS distance_m
    FROM memories
    ORDER BY created_at DESC
    LIMIT 50
  `


  return NextResponse.json(memories)
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 memories per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 5, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, content, year_label, user_id } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const contentErr = validateText(content, 'content', { min: 1, max: 1000 })
    if (contentErr) return NextResponse.json({ error: contentErr }, { status: 400 })

    const userErr = validateText(user_id, 'user_id', { max: 200 })
    if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

    // Sanitise optional year_label
    const safeYearLabel = year_label
      ? String(year_label).slice(0, 10)
      : null

    await sql`
      INSERT INTO memories (lat, lng, content, year_label, contributor_hash)
      VALUES (${lat}, ${lng}, ${content}, ${safeYearLabel},
        encode(sha256(${user_id}::bytea), 'hex'))
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

