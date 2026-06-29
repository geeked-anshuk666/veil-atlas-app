import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const hourly = await sql`
    SELECT hour_of_day as hour, COUNT(*) as count
    FROM checkins
    GROUP BY hour_of_day ORDER BY hour_of_day
  `

  const weekly = await sql`
    SELECT day_of_week as day,
      COUNT(*) FILTER (WHERE hour_of_day BETWEEN 6 AND 11) AS morning,
      COUNT(*) FILTER (WHERE hour_of_day BETWEEN 12 AND 17) AS afternoon,
      COUNT(*) FILTER (WHERE hour_of_day BETWEEN 18 AND 23) AS evening
    FROM checkins
    GROUP BY day_of_week ORDER BY day_of_week
  `


  return NextResponse.json({
    hourly: hourly.map((r) => ({ hour: Number(r.hour), count: Number(r.count) })),
    weekly: weekly.map((r) => ({
      day: Number(r.day),
      morning: Number(r.morning),
      afternoon: Number(r.afternoon),
      evening: Number(r.evening),
    })),
  })
}

export async function POST(request: NextRequest) {
  // Rate limit check-ins: 1 per minute per IP (passive background call)
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 1, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, user_id } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const userErr = validateText(user_id, 'user_id', { max: 200 })
    if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

    const now = new Date()
    await sql`
      INSERT INTO checkins (lat, lng, hour_of_day, day_of_week, contributor_hash)
      VALUES (${lat}, ${lng}, ${now.getHours()}, ${now.getDay()},
        encode(sha256(${user_id}::bytea), 'hex'))
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/rhythm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

