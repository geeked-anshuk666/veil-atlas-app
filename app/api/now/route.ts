import { NextRequest, NextResponse } from 'next/server'

// Mock data storage (in production, this would be a database)
const mockPosts: Array<{
  id: string
  content: string
  lat: number
  lng: number
  created_at: string
  user_hash: string
}> = [
  {
    id: '1',
    content: 'beautiful evening light hitting the buildings right now',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    user_hash: 'user-1',
  },
  {
    id: '2',
    content: 'street musicians playing something incredible',
    lat: 37.776,
    lng: -122.418,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    user_hash: 'user-2',
  },
  {
    id: '3',
    content: 'coffee place just opened, smells amazing',
    lat: 37.774,
    lng: -122.42,
    created_at: new Date(Date.now() - 22 * 60000).toISOString(),
    user_hash: 'user-3',
  },
  {
    id: '4',
    content: 'saw someone do something kind today',
    lat: 37.773,
    lng: -122.419,
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    user_hash: 'user-4',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Filter posts within 500m (roughly 0.0045 degrees)
  const radius = 0.0045

  const nearbyPosts = mockPosts
    .filter((post) => {
      const dLat = Math.abs(post.lat - lat)
      const dLng = Math.abs(post.lng - lng)
      return dLat <= radius && dLng <= radius
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10)

  return NextResponse.json(nearbyPosts)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, content, user_id } = body

    if (!lat || !lng || !content || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new post
    const newPost = {
      id: Date.now().toString(),
      content,
      lat,
      lng,
      created_at: new Date().toISOString(),
      user_hash: `user-${user_id.slice(0, 8)}`,
    }

    mockPosts.push(newPost)

    return NextResponse.json({ success: true, id: newPost.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/now:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
