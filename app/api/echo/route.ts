import { NextRequest, NextResponse } from 'next/server'

const mockEchoes: Array<{
  id: string
  content: string
  for_whom?: string
  lat: number
  lng: number
  created_at: string
  proximity_radius: number // in km - only shows when user is this close
}> = [
  {
    id: '1',
    content: 'To anyone finding their way: you are not alone here.',
    for_whom: 'the lost ones',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    proximity_radius: 0.027, // ~3km or 30m in degrees
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // All echoes start locked, only visible if user is within proximity_radius
  const proximityThreshold = 0.00027 // ~30m in degrees
  const allNearbyArea = 0.045 // ~5km

  const nearbyArea = mockEchoes.filter((echo) => {
    const dLat = Math.abs(echo.lat - lat)
    const dLng = Math.abs(echo.lng - lng)
    return dLat <= allNearbyArea && dLng <= allNearbyArea
  })

  // Check if any are close enough to unlock
  const unlockedEchoes = nearbyArea.filter((echo) => {
    const dLat = Math.abs(echo.lat - lat)
    const dLng = Math.abs(echo.lng - lng)
    return dLat <= proximityThreshold && dLng <= proximityThreshold
  })

  return NextResponse.json({
    echoes: unlockedEchoes,
    hint_count: nearbyArea.length - unlockedEchoes.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, content, for_whom } = body

    if (!lat || !lng || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new echo
    const newEcho = {
      id: Date.now().toString(),
      content,
      for_whom: for_whom || undefined,
      lat,
      lng,
      created_at: new Date().toISOString(),
      proximity_radius: 0.00027, // Default to ~30m
    }

    mockEchoes.push(newEcho)

    return NextResponse.json({ success: true, id: newEcho.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/echo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
