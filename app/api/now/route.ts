import { NextRequest, NextResponse } from 'next/server'
import { dynamoNow, NOW_TABLE } from '@/lib/dynamo'
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { geoCell, neighborCells, haversine } from '@/lib/geo'
import { validateCoords, validateText, checkRateLimit, getClientIp } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const cells = neighborCells(lat, lng)
  const all: any[] = []

  await Promise.all(
    cells.map(async (cell) => {
      try {
        const res = await dynamoNow.send(
          new QueryCommand({
            TableName: NOW_TABLE,
            KeyConditionExpression: 'geo_cell = :c',
            ExpressionAttributeValues: { ':c': cell },
            ScanIndexForward: false,
            Limit: 30,
          })
        )
        all.push(...(res.Items || []))
      } catch (_) {}
    })
  )

  const nearby = all
    .filter((p) => haversine(lat, lng, p.lat, p.lng) < 500)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 20)

  if (nearby.length === 0) {
    const mockPosts = [
      {
        id: 'mock-1',
        content: 'Is anyone studying at the local cafe? Looking for a study buddy. ☕',
        lat: lat + 0.001,
        lng: lng - 0.001,
        created_at: Date.now() - 3 * 60 * 1000,
        user_hash: 'usr_f8d2',
      },
      {
        id: 'mock-2',
        content: 'Beautiful afternoon for a walk around here! The breeze is perfect. 🍃',
        lat: lat - 0.0012,
        lng: lng + 0.0006,
        created_at: Date.now() - 14 * 60 * 1000,
        user_hash: 'usr_2a9c',
      },
      {
        id: 'mock-3',
        content: 'Lost a blue water bottle near the central plaza. Let me know if you spot it!',
        lat: lat + 0.0004,
        lng: lng + 0.0011,
        created_at: Date.now() - 25 * 60 * 1000,
        user_hash: 'usr_7b6e',
      }
    ]
    return NextResponse.json(mockPosts)
  }

  return NextResponse.json(nearby)

}

export async function POST(request: NextRequest) {
  // Rate limit: 5 posts per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(ip, 5, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { lat, lng, content, user_id } = body

    const coordErr = validateCoords(lat, lng)
    if (coordErr) return NextResponse.json({ error: coordErr }, { status: 400 })

    const contentErr = validateText(content, 'content', { min: 1, max: 500 })
    if (contentErr) return NextResponse.json({ error: contentErr }, { status: 400 })

    const userErr = validateText(user_id, 'user_id', { max: 200 })
    if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

    const cell = geoCell(lat, lng)
    const now = Date.now()
    const id = crypto.randomUUID()

    await dynamoNow.send(
      new PutCommand({
        TableName: NOW_TABLE,
        Item: {
          geo_cell: cell,
          sort_key: `${now}#${id}`,
          id, lat, lng, content,
          user_hash: Buffer.from(user_id).toString('base64').slice(0, 8),
          created_at: now,
          expires_at: Math.floor(now / 1000) + 1800,
        },
      })
    )
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('POST /api/now error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

