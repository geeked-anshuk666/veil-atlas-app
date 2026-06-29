import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { validateCoords, validateEnum, validateText, checkRateLimit, getClientIp } from '@/lib/validate'
import { getCache, setCache, clearCache } from '@/lib/cache'

const VALID_INCIDENT_TYPES = [
  'harassment', 'theft', 'unsafe_lighting', 'suspicious_activity',
  'assault', 'vandalism', 'drug_activity', 'traffic_hazard', 'other',
]
const VALID_TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'night', 'late_night']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10')))
  const userId = searchParams.get('user_id') || ''

  const offset = (page - 1) * limit
  const cacheKey = `truth_${lat.toFixed(4)}_${lng.toFixed(4)}_p${page}_l${limit}`

  const cached = getCache<any>(cacheKey)
  if (cached) {
    return NextResponse.json({
      total: cached.total,
      breakdown: cached.breakdown,
      list: cached.list.map((item: any) => ({
        ...item,
        is_mine: userId
          ? item.contributor_hash === require('crypto').createHash('sha256').update(userId).digest('hex')
          : false,
        contributor_hash: undefined,
      })),
    })
  }

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
    LIMIT ${limit} OFFSET ${offset}
  `

  const cachePayload = {
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
      contributor_hash: item.contributor_hash,
    })),
  }

  // Cache for 15 seconds
  setCache(cacheKey, cachePayload, 15000)

  return NextResponse.json({
    total: cachePayload.total,
    breakdown: cachePayload.breakdown,
    list: cachePayload.list.map((item) => ({
      ...item,
      is_mine: userId
        ? item.contributor_hash === require('crypto').createHash('sha256').update(userId).digest('hex')
        : false,
      contributor_hash: undefined,
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

    // user_id is optional — it is a pseudonymous client hash, may be absent
    const contributorHash =
      typeof user_id === 'string' && user_id.trim().length > 0
        ? require('crypto').createHash('sha256').update(user_id.trim()).digest('hex')
        : null

    await sql`
      INSERT INTO incidents (lat, lng, incident_type, time_of_day, day_of_week, contributor_hash)
      VALUES (${lat}, ${lng}, ${incident_type}, ${time_of_day},
        ${new Date().getDay()}, ${contributorHash})
    `
    // Invalidate truth caches
    clearCache('truth_')
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
    // Invalidate truth caches
    clearCache('truth_')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/truth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
