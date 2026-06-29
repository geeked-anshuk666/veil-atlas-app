import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createHash } from 'crypto'

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const userId = searchParams.get('user_id') || ''
  const myHash = userId ? hashUserId(userId) : ''

  // Return all pins (show all confessions globally, ordered by newest)
  // Also include distance so panel can sort/filter
  const pins = await sql`
    SELECT id, content, lat, lng, created_at, contributor_hash,
      haversine(${lat}, ${lng}, lat, lng) as distance_m
    FROM static_pins
    ORDER BY created_at DESC
    LIMIT 100
  `

  return NextResponse.json({
    pins: pins.map((p) => ({
      id: p.id,
      content: p.content,
      lat: Number(p.lat),
      lng: Number(p.lng),
      created_at: p.created_at,
      distance_m: Number(p.distance_m),
      is_mine: myHash ? p.contributor_hash === myHash : false,
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, content, user_id } = await request.json()
    if (!lat || !lng || !content)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const contributorHash = user_id ? hashUserId(user_id) : null

    await sql`
      INSERT INTO static_pins (lat, lng, content, radius_m, contributor_hash)
      VALUES (${lat}, ${lng}, ${content}, 30, ${contributorHash})
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/feel/pins error:', error)
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
    const rows = await sql`SELECT contributor_hash FROM static_pins WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (rows[0].contributor_hash !== myHash)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await sql`DELETE FROM static_pins WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/feel/pins error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
