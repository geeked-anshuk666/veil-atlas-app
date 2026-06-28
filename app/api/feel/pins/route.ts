import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const pins = await sql`
    SELECT id, content, lat, lng, created_at
    FROM static_pins
    WHERE haversine(${lat}, ${lng}, lat, lng) <= 1000
    ORDER BY created_at DESC
  `
  return NextResponse.json({
    pins: pins.map((p) => ({
      id: p.id,
      content: p.content,
      lat: Number(p.lat),
      lng: Number(p.lng),
      created_at: p.created_at,
    })),
  })

}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, content } = await request.json()
    if (!lat || !lng || !content)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await sql`
      INSERT INTO static_pins (lat, lng, content, radius_m)
      VALUES (${lat}, ${lng}, ${content}, 30)
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/feel/pins error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
