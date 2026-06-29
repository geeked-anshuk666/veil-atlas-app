'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  nowPosts: Array<{ id: string; lat: number; lng: number; content: string }>
  memories: Array<{ id: string; lat: number; lng: number; year_label: string }>
  feelConfessions: Array<{ id: string; lat: number; lng: number; content: string }>
  truthIncidents: Array<{ id: string; lat: number; lng: number; type: string; time_of_day: string }>
  feelMoods: Array<{ id: string; lat: number; lng: number; emotion: string }>
  onMapClick?: (lat: number, lng: number, pinId?: string) => void

}

const MapContent = lazy(() => import('./MapContent'))

export default function Map({
  activeLayer,
  userLocation,
  selectedLocation,
  nowPosts,
  memories,
  feelConfessions,
  truthIncidents,
  feelMoods,
  onMapClick,
}: MapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !userLocation) {
    return (
      <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-sm animate-pulse">Locating you...</div>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center text-gray-500">
          <div className="text-sm animate-pulse">Loading map...</div>
        </div>
      }
    >
      <MapContent
        activeLayer={activeLayer}
        userLocation={userLocation}
        selectedLocation={selectedLocation}
        nowPosts={nowPosts}
        memories={memories}
        feelConfessions={feelConfessions}
        truthIncidents={truthIncidents}
        feelMoods={feelMoods}
        onMapClick={onMapClick}
      />
    </Suspense>
  )
}



