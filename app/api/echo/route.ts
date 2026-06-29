import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Find the single nearest active echo
  const nearest = await sql`
    SELECT id, lat, lng, content, for_whom, radius_m, created_at,
      haversine(${lat}, ${lng}, lat, lng) as distance
    FROM echoes
    WHERE (expires_at IS NULL OR expires_at > NOW())
    ORDER BY distance ASC
    LIMIT 1
  `

  if (nearest.length === 0) {
    return NextResponse.json(null)
  }

  const echo = nearest[0]
  const isUnlocked = Number(echo.distance) <= Number(echo.radius_m)

  return NextResponse.json({
    id: echo.id,
    lat: Number(echo.lat),
    lng: Number(echo.lng),
    // Mask raw content in the backend if locked
    content: isUnlocked ? echo.content : null,
    for_whom: echo.for_whom,
    radius_m: Number(echo.radius_m),
    distance: Number(echo.distance),
    unlocked: isUnlocked,
    created_at: echo.created_at,
  })
}


export async function POST(request: NextRequest) {
  try {
    const { lat, lng, content, for_whom, radius_m, expires_days } = await request.json()
    if (!lat || !lng || !content)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const expires_at = expires_days
      ? new Date(Date.now() + expires_days * 86400000).toISOString()
      : null

    await sql`
      INSERT INTO echoes (lat, lng, content, for_whom, radius_m, expires_at)
      VALUES (${lat}, ${lng}, ${content}, ${for_whom || null}, ${radius_m || 30}, ${expires_at})
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/echo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
