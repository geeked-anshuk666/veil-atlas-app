'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'

interface MapProps {
  onMapReady: (map: mapboxgl.Map, center: [number, number]) => void
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
}

export default function Map({ onMapReady, activeLayer }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const userMarker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Get or set Mapbox token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('[v0] NEXT_PUBLIC_MAPBOX_TOKEN not set')
      setIsLoading(false)
      return
    }

    mapboxgl.accessToken = token

    // Get user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          initializeMap([longitude, latitude])
        },
        (error) => {
          console.warn('[v0] Geolocation denied, using San Francisco as fallback')
          // Fallback to San Francisco city center
          initializeMap([-122.4194, 37.7749])
        }
      )
    } else {
      // Fallback to San Francisco
      initializeMap([-122.4194, 37.7749])
    }

    function initializeMap(center: [number, number]) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: center,
        zoom: 15,
        pitch: 0,
        bearing: 0,
      })

      // Add user location marker
      const marker = document.createElement('div')
      marker.className = 'w-3 h-3 bg-blue-400 rounded-full shadow-lg'
      userMarker.current = new mapboxgl.Marker({
        element: marker,
        anchor: 'center',
      })
        .setLngLat(center)
        .addTo(map.current)

      map.current.on('load', () => {
        setIsLoading(false)
        onMapReady(map.current!, center)
      })
    }
  }, [onMapReady])

  // Update layer overlays based on active layer
  useEffect(() => {
    if (!map.current) return

    // Clear any existing layers (except base)
    const layers = map.current.getStyle().layers || []
    const customLayers = layers.filter((l) => l.id.startsWith('veil-'))
    customLayers.forEach((l) => {
      try {
        map.current!.removeLayer(l.id)
      } catch {
        // Layer doesn't exist
      }
    })

    // Remove sources
    ;['now-posts', 'feel-circle', 'truth-clusters', 'memory-markers', 'rhythm-grid'].forEach((sourceId) => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId)
      }
    })
  }, [activeLayer])

  return (
    <div
      id="map"
      ref={mapContainer}
      className="absolute inset-0 w-full h-full bg-black"
    />
  )
}
