import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createHash } from 'crypto'
import { validateCoords, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const userId = searchParams.get('user_id') || ''
  const myHash = userId ? hashUserId(userId) : ''

  const memories = await sql`
    SELECT id, content, lat, lng, year_label, created_at, contributor_hash,
      ROUND(haversine(${lat}, ${lng}, lat, lng)::numeric) AS distance_m
    FROM memories
    ORDER BY created_at DESC
    LIMIT 50
  `

  return NextResponse.json(memories.map((m) => ({
    id: m.id,
    content: m.content,
    lat: Number(m.lat),
    lng: Number(m.lng),
    year_label: m.year_label,
    created_at: m.created_at,
    distance_m: Number(m.distance_m),
    is_mine: myHash ? m.contributor_hash === myHash : false,
  })))
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

    const safeYearLabel = year_label ? String(year_label).slice(0, 10) : null

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

export async function PATCH(request: NextRequest) {
  try {
    const { id, user_id, content, year_label } = await request.json()
    if (!id || !user_id || !content)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const myHash = hashUserId(user_id)
    const rows = await sql`SELECT contributor_hash FROM memories WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (rows[0].contributor_hash !== myHash)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const safeYearLabel = year_label ? String(year_label).slice(0, 10) : null
    await sql`UPDATE memories SET content = ${content}, year_label = ${safeYearLabel} WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/memory error:', error)
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
    const myHash = hashUserId(userId)
    const rows = await sql`SELECT contributor_hash FROM memories WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (rows[0].contributor_hash !== myHash)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await sql`DELETE FROM memories WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
