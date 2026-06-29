import { NextRequest, NextResponse } from 'next/server'
import { dynamoNow, NOW_TABLE } from '@/lib/dynamo'
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const parentId = searchParams.get('parent_id')
    if (!parentId) {
      return NextResponse.json({ error: 'Missing parent_id' }, { status: 400 })
    }

    // Query DynamoDB for replies with partition key: reply#parentId
    const res = await dynamoNow.send(
      new QueryCommand({
        TableName: NOW_TABLE,
        KeyConditionExpression: 'geo_cell = :c',
        ExpressionAttributeValues: { ':c': `reply#${parentId}` },
        ScanIndexForward: true, // chronological order
      })
    )

    const list = (res.Items || []).map((item) => ({
      id: item.id,
      content: item.content,
      user_hash: item.user_hash,
      created_at: item.created_at,
    }))

    return NextResponse.json(list)
  } catch (error) {
    console.error('GET /api/now/replies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parent_id, content, user_id } = await request.json()
    if (!parent_id || !content || !user_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const now = Date.now()
    const id = crypto.randomUUID()

    // Put Command with parent partitioning key to shield user geolocational privacy
    await dynamoNow.send(
      new PutCommand({
        TableName: NOW_TABLE,
        Item: {
          geo_cell: `reply#${parent_id}`,
          sort_key: `${now}#${id}`,
          id,
          content,
          user_hash: Buffer.from(user_id).toString('base64').slice(0, 8),
          created_at: now,
          expires_at: Math.floor(now / 1000) + 1800, // 30 mins TTL
        },
      })
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('POST /api/now/replies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
