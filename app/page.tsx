'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import Map from '@/components/Map'
import LayerSelector from '@/components/LayerSelector'
import BottomSheet from '@/components/BottomSheet'
import NowPanel from '@/components/layers/NowPanel'
import FeelPanel from '@/components/layers/FeelPanel'
import TruthPanel from '@/components/layers/TruthPanel'
import MemoryPanel from '@/components/layers/MemoryPanel'
import RhythmPanel from '@/components/layers/RhythmPanel'

type LayerType = 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'

export default function HomePage() {
  const [activeLayer, setActiveLayer] = useState<LayerType>('now')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  // Initialize user ID from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    let id = localStorage.getItem('veil_user_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('veil_user_id', id)
    }
    setUserId(id)
  }, [])

  // Handle map ready
  const handleMapReady = (map: mapboxgl.Map, center: [number, number]) => {
    mapRef.current = map
    setUserLocation(center)
  }

  // Open sheet when layer changes
  useEffect(() => {
    setIsSheetOpen(true)
  }, [activeLayer])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Map */}
      <Map onMapReady={handleMapReady} activeLayer={activeLayer} />

      {/* Layer Selector */}
      <LayerSelector activeLayer={activeLayer} onLayerChange={setActiveLayer} />

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      >
        {activeLayer === 'now' && (
          <NowPanel userLocation={userLocation} userId={userId} />
        )}
        {activeLayer === 'feel' && (
          <FeelPanel userLocation={userLocation} userId={userId} />
        )}
        {activeLayer === 'truth' && (
          <TruthPanel userLocation={userLocation} userId={userId} />
        )}
        {activeLayer === 'memory' && (
          <MemoryPanel userLocation={userLocation} userId={userId} />
        )}
        {activeLayer === 'rhythm' && (
          <RhythmPanel userLocation={userLocation} />
        )}
      </BottomSheet>
    </div>
  )
}
