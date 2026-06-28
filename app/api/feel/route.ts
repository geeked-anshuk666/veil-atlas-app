import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

const VALID_EMOTIONS = ['peaceful', 'joyful', 'anxious', 'melancholy', 'alive']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const rows = await sql`
    SELECT emotion, COUNT(*) as count
    FROM emotional_records
    WHERE haversine(${lat}, ${lng}, lat, lng) < 1000
      AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY emotion
    ORDER BY count DESC
    LIMIT 1
  `

  const list = await sql`
    SELECT id, emotion, lat, lng, created_at
    FROM emotional_records
    WHERE haversine(${lat}, ${lng}, lat, lng) < 1000
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 30
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
  try {
    const { lat, lng, emotion, user_id } = await request.json()
    if (!lat || !lng || !emotion || !user_id)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!VALID_EMOTIONS.includes(emotion))
      return NextResponse.json({ error: 'Invalid emotion' }, { status: 400 })

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
