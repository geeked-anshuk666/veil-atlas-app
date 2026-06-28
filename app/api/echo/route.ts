import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const unlocked = await sql`
    SELECT id, content, for_whom, radius_m, created_at
    FROM echoes
    WHERE haversine(${lat}, ${lng}, lat, lng) <= radius_m
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY haversine(${lat}, ${lng}, lat, lng) ASC
    LIMIT 3
  `

  const hintCount = await sql`
    SELECT COUNT(*) as count FROM echoes
    WHERE haversine(${lat}, ${lng}, lat, lng) < 100
      AND haversine(${lat}, ${lng}, lat, lng) > radius_m
      AND (expires_at IS NULL OR expires_at > NOW())
  `

  return NextResponse.json({
    echoes: unlocked,
    hint_count: Number(hintCount[0]?.count || 0),
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
