import { NextRequest, NextResponse } from 'next/server'
import { dynamoNow, NOW_TABLE } from '@/lib/dynamo'
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { geoCell, neighborCells, haversine } from '@/lib/geo'

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

  return NextResponse.json(nearby)
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, content, user_id } = await request.json()
    if (!lat || !lng || !content || !user_id)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

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
