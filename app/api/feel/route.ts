import { NextRequest, NextResponse } from 'next/server'

const mockEmotions: Record<string, { emotion: string; count: number }> = {
  'default': { emotion: 'anxious', count: 47 },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Round to nearest grid point for consistent mock data
  const key = `${Math.round(lat * 100)}-${Math.round(lng * 100)}`

  const emotionData = mockEmotions[key] || mockEmotions['default']

  return NextResponse.json({
    dominant_emotion: emotionData.emotion,
    record_count: emotionData.count,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, emotion, user_id } = body

    if (!lat || !lng || !emotion || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Round to grid
    const key = `${Math.round(lat * 100)}-${Math.round(lng * 100)}`

    // Update or create emotion entry
    if (mockEmotions[key]) {
      mockEmotions[key].emotion = emotion
      mockEmotions[key].count += 1
    } else {
      mockEmotions[key] = { emotion, count: 1 }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in POST /api/feel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
