import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateEnum, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

const VALID_INCIDENT_TYPES = [
  'harassment', 'theft', 'unsafe_lighting', 'suspicious_activity',
  'assault', 'vandalism', 'drug_activity', 'traffic_hazard', 'other',
]
const VALID_TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'night', 'late_night']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const userId = searchParams.get('user_id') || ''

  const rows = await sql`
    SELECT incident_type as type, COUNT(*) as count
    FROM incidents
    WHERE created_at > NOW() - INTERVAL '1 year'
    GROUP BY incident_type
    ORDER BY count DESC
  `

  const list = await sql`
    SELECT id, incident_type as type, time_of_day, lat, lng, created_at, contributor_hash,
      haversine(${lat}, ${lng}, lat, lng) as distance
    FROM incidents
    WHERE created_at > NOW() - INTERVAL '1 year'
    ORDER BY created_at DESC
    LIMIT 50
  `


  return NextResponse.json({
    total: rows.reduce((sum, r) => sum + Number(r.count), 0),
    breakdown: rows.map((r) => ({ type: r.type, count: Number(r.count) })),
    list: list.map((item) => ({
      id: item.id,
      type: item.type,
      time_of_day: item.time_of_day,
      lat: Number(item.lat),
      lng: Number(item.lng),
      created_at: item.created_at,
      distance: Number(item.distance),
      is_mine: userId
        ? item.contributor_hash === require('crypto').createHash('sha256').update(userId).digest('hex')
        : false,
    })),
  })
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 reports per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 10, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, incident_type, time_of_day, user_id } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const typeErr = validateEnum(incident_type, VALID_INCIDENT_TYPES, 'incident_type')
    if (typeErr) return NextResponse.json({ error: typeErr }, { status: 400 })

    const todErr = validateEnum(time_of_day, VALID_TIMES_OF_DAY, 'time_of_day')
    if (todErr) return NextResponse.json({ error: todErr }, { status: 400 })

    const userErr = validateText(user_id, 'user_id', { max: 200 })
    if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

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

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  const userId = searchParams.get('user_id')
  if (!id || !userId)
    return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 })

  try {
    const { createHash } = await import('crypto')
    const myHash = createHash('sha256').update(userId).digest('hex')
    const rows = await sql`SELECT contributor_hash FROM incidents WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (rows[0].contributor_hash !== myHash)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await sql`DELETE FROM incidents WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/truth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
