import { NextRequest, NextResponse } from 'next/server'

const mockMemories: Array<{
  id: string
  content: string
  year_label: string
  lat: number
  lng: number
  created_at: string
}> = [
  {
    id: '1',
    content: 'This used to be a vibrant music venue in the 80s and 90s. Every night was different.',
    year_label: '1987',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    content: 'First time I felt truly at home was walking these streets. The community was tight then.',
    year_label: 'early 2000s',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    content: 'Remember when all the independent bookstores were here? Where do we gather now?',
    year_label: '2019',
    lat: 37.776,
    lng: -122.418,
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Filter memories within ~5km
  const radius = 0.045

  const nearbyMemories = mockMemories
    .filter((memory) => {
      const dLat = Math.abs(memory.lat - lat)
      const dLng = Math.abs(memory.lng - lng)
      return dLat <= radius && dLng <= radius
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  return NextResponse.json(nearbyMemories)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, content, year_label, user_id } = body

    if (!lat || !lng || !content || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new memory
    const newMemory = {
      id: Date.now().toString(),
      content,
      year_label: year_label || 'unknown',
      lat,
      lng,
      created_at: new Date().toISOString(),
    }

    mockMemories.push(newMemory)

    return NextResponse.json({ success: true, id: newMemory.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/memory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
