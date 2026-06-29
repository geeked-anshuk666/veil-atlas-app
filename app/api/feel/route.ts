import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateEnum, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

const VALID_EMOTIONS = ['peaceful', 'joyful', 'anxious', 'melancholy', 'alive']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const rows = await sql`
    SELECT emotion, COUNT(*) as count
    FROM emotional_records
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY emotion
    ORDER BY count DESC
    LIMIT 1
  `

  const list = await sql`
    SELECT id, emotion, lat, lng, created_at
    FROM emotional_records
    WHERE created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 50
  `


  return NextResponse.json({
    dominant_emotion: rows[0]?.emotion || null,
    record_count: rows[0]?.count ? Number(rows[0].count) : 0,
    list: list.map((item) => ({
      id: item.id,
      emotion: item.emotion,
      lat: Number(item.lat),
      lng: Number(item.lng),
      created_at: item.created_at,
    })),
  })


}

export async function POST(request: NextRequest) {
  // Rate limit: 10 posts per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 10, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, emotion, user_id } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const emotionErr = validateEnum(emotion, VALID_EMOTIONS, 'emotion')
    if (emotionErr) return NextResponse.json({ error: emotionErr }, { status: 400 })

    const userErr = validateText(user_id, 'user_id', { max: 200 })
    if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

    await sql`
      INSERT INTO emotional_records (lat, lng, emotion, contributor_hash)
      VALUES (${lat}, ${lng}, ${emotion}, encode(sha256(${user_id}::bytea), 'hex'))
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/feel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

