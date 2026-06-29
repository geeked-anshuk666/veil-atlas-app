import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

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
  try {
    const { lat, lng, content, year_label, user_id } = await request.json()
    if (!lat || !lng || !content || !user_id)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await sql`
      INSERT INTO memories (lat, lng, content, year_label, contributor_hash)
      VALUES (${lat}, ${lng}, ${content}, ${year_label || null},
        encode(sha256(${user_id}::bytea), 'hex'))
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
