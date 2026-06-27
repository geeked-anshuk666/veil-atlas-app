import { NextRequest, NextResponse } from 'next/server'

const mockIncidents: Array<{
  id: string
  lat: number
  lng: number
  type: string
  time_of_day: string
  created_at: string
}> = [
  {
    id: '1',
    lat: 37.7749,
    lng: -122.4194,
    type: 'Service refusal',
    time_of_day: 'afternoon',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    lat: 37.7749,
    lng: -122.4194,
    type: 'Service refusal',
    time_of_day: 'evening',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    lat: 37.7749,
    lng: -122.4194,
    type: 'Service refusal',
    time_of_day: 'morning',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    lat: 37.7749,
    lng: -122.4194,
    type: 'Service refusal',
    time_of_day: 'evening',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    lat: 37.775,
    lng: -122.419,
    type: 'Felt unsafe',
    time_of_day: 'night',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    lat: 37.775,
    lng: -122.419,
    type: 'Felt unsafe',
    time_of_day: 'night',
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    lat: 37.775,
    lng: -122.419,
    type: 'Felt unsafe',
    time_of_day: 'evening',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    lat: 37.773,
    lng: -122.42,
    type: 'Being followed',
    time_of_day: 'night',
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    lat: 37.773,
    lng: -122.42,
    type: 'Being followed',
    time_of_day: 'evening',
    created_at: new Date(Date.now() - 270 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // Filter incidents within ~5km
  const radius = 0.045

  const nearbyIncidents = mockIncidents.filter((incident) => {
    const dLat = Math.abs(incident.lat - lat)
    const dLng = Math.abs(incident.lng - lng)
    return dLat <= radius && dLng <= radius
  })

  // Group by type
  const breakdown: Record<string, number> = {}
  nearbyIncidents.forEach((incident) => {
    breakdown[incident.type] = (breakdown[incident.type] || 0) + 1
  })

  return NextResponse.json({
    total: nearbyIncidents.length,
    breakdown: Object.entries(breakdown).map(([type, count]) => ({
      type,
      count,
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, incident_type, time_of_day, user_id } = body

    if (!lat || !lng || !incident_type || !time_of_day || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new incident
    const newIncident = {
      id: Date.now().toString(),
      lat,
      lng,
      type: incident_type,
      time_of_day,
      created_at: new Date().toISOString(),
    }

    mockIncidents.push(newIncident)

    return NextResponse.json({ success: true, id: newIncident.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/truth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
