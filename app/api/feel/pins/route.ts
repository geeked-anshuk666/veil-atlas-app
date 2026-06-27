import { NextRequest, NextResponse } from 'next/server'

const mockConfessions: Array<{
  id: string
  content: string
  lat: number
  lng: number
  created_at: string
}> = [
  {
    id: '1',
    content: 'I feel like I belong here more than anywhere else',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    content: 'Sometimes I come here just to remember who I was',
    lat: 37.776,
    lng: -122.418,
    created_at: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Filter confessions within ~5km
  const radius = 0.045

  const nearbyConfessions = mockConfessions
    .filter((confession) => {
      const dLat = Math.abs(confession.lat - lat)
      const dLng = Math.abs(confession.lng - lng)
      return dLat <= radius && dLng <= radius
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 1) // Return only one

  return NextResponse.json(nearbyConfessions[0] || null)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, content } = body

    if (!lat || !lng || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new confession
    const newConfession = {
      id: Date.now().toString(),
      content,
      lat,
      lng,
      created_at: new Date().toISOString(),
    }

    mockConfessions.push(newConfession)

    return NextResponse.json({ success: true, id: newConfession.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/feel/pins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
