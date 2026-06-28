import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const rows = await sql`
    SELECT incident_type as type, COUNT(*) as count
    FROM incidents
    WHERE haversine(${lat}, ${lng}, lat, lng) < 800
      AND created_at > NOW() - INTERVAL '1 year'
    GROUP BY incident_type
    ORDER BY count DESC
  `

  const list = await sql`
    SELECT id, incident_type as type, time_of_day, created_at,
      haversine(${lat}, ${lng}, lat, lng) as distance
    FROM incidents
    WHERE haversine(${lat}, ${lng}, lat, lng) < 800
      AND created_at > NOW() - INTERVAL '1 year'
    ORDER BY created_at DESC
    LIMIT 15
  `

  return NextResponse.json({
    total: rows.reduce((sum, r) => sum + Number(r.count), 0),
    breakdown: rows.map((r) => ({ type: r.type, count: Number(r.count) })),
    list: list.map((item) => ({
      id: item.id,
      type: item.type,
      time_of_day: item.time_of_day,
      created_at: item.created_at,
      distance: Number(item.distance),
    })),
  })

}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, incident_type, time_of_day, user_id } = await request.json()
    if (!lat || !lng || !incident_type || !time_of_day || !user_id)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await sql`
      INSERT INTO incidents (lat, lng, incident_type, time_of_day, day_of_week, contributor_hash)
      VALUES (${lat}, ${lng}, ${incident_type}, ${time_of_day},
        ${new Date().getDay()}, encode(sha256(${user_id}::bytea), 'hex'))
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/truth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
