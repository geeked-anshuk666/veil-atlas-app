'use client'

import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvent, useMap, Tooltip } from 'react-leaflet'
import { LatLng } from 'leaflet'
import { useTheme } from '@/lib/theme-context'
import 'leaflet/dist/leaflet.css'

interface MapContentProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  userLocation: [number, number]
  selectedLocation: [number, number] | null
  nowPosts: Array<{ id: string; lat: number; lng: number; content: string }>
  memories: Array<{ id: string; lat: number; lng: number; year_label: string }>
  feelConfessions: Array<{ id: string; lat: number; lng: number; content: string }>
  truthIncidents: Array<{ id: string; lat: number; lng: number; type: string; time_of_day: string }>
  feelMoods: Array<{ id: string; lat: number; lng: number; emotion: string }>
  onMapClick?: (lat: number, lng: number, pinId?: string) => void

}

const CARTODB_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTODB_LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTODB_ATTRIBUTION = '© OpenStreetMap contributors © CARTO'

// Helper component to capture map clicks
function MapClickHandler({ onMapClick, activeLayer }: { onMapClick?: (lat: number, lng: number) => void; activeLayer: string }) {
  useMapEvent('click', (e) => {
    if (activeLayer === 'now') return // Now layer doesn't allow clicks
    onMapClick?.(e.latlng.lat, e.latlng.lng)
  })
  return null
}

// Helper component to handle flyTo for selected locations
function FlyToLocation({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap()
  
  useMapEvent('click', () => {
    // Map click event - this ensures map events are active
  })

  if (selectedLocation && map) {
    map.flyTo(new LatLng(selectedLocation[0], selectedLocation[1]), 16, {
      duration: 1.2,
    })
  }
  
  return null
}

const getEmotionEmoji = (emotion: string) => {
  switch (emotion) {
    case 'peaceful': return '🌊'
    case 'joyful': return '☀️'
    case 'anxious': return '⚡'
    case 'melancholy': return '🌧️'
    case 'alive': return '🔥'
    default: return '🌡'
  }
}

const getEmotionColor = (emotion: string) => {
  switch (emotion) {
    case 'peaceful': return '#3b82f6' // blue
    case 'joyful': return '#f59e0b' // amber
    case 'anxious': return '#ef4444' // red
    case 'melancholy': return '#a855f7' // purple
    case 'alive': return '#10b981' // emerald green
    default: return '#fbbf24'
  }
}

export default function MapContent({
  activeLayer,
  userLocation,
  selectedLocation,
  nowPosts,
  memories,
  feelConfessions,
  truthIncidents,
  feelMoods,
  onMapClick,
}: MapContentProps) {
  const { theme } = useTheme()
  const [lat, lng] = userLocation

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={new LatLng(lat, lng)}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url={theme === 'dark' ? CARTODB_DARK_TILES : CARTODB_LIGHT_TILES}
          attribution={CARTODB_ATTRIBUTION}
          maxZoom={19}
        />

        {/* Map click handler */}
        <MapClickHandler onMapClick={onMapClick} activeLayer={activeLayer} />

        {/* FlyTo for selected locations */}
        <FlyToLocation selectedLocation={selectedLocation} />

        {/* Now layer - blue pulsing dots */}
        {activeLayer === 'now' &&
          nowPosts.map((post) => (
            <CircleMarker
              key={post.id}
              center={new LatLng(post.lat, post.lng)}
              radius={8}
              fillOpacity={0.8}
              color="#3b82f6"
              fillColor="#3b82f6"
              weight={2}
              className="pulse-marker"
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                <span>⚡ Live Signal: &ldquo;{post.content.slice(0, 30)}...&rdquo;</span>
              </Tooltip>
              <Popup>{post.content}</Popup>
            </CircleMarker>
          ))}

        {/* Feel layer - amber semi-transparent circle around user + confessions + moods */}
        {activeLayer === 'feel' && (
          <CircleMarker
            center={new LatLng(lat, lng)}
            radius={60}
            fillOpacity={0.12}
            color="#fbbf24"
            fillColor="#fbbf24"
            weight={1}
            dashArray="5,5"
          />
        )}

        {/* Confession markers */}
        {activeLayer === 'feel' &&
          feelConfessions &&
          feelConfessions.map((c) => (
            <CircleMarker
              key={c.id}
              center={new LatLng(c.lat, c.lng)}
              radius={8}
              fillOpacity={0.8}
              color="#fbbf24"
              fillColor="#fbbf24"
              weight={2}
              className="pulse-marker"
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  onMapClick?.(c.lat, c.lng, c.id)
                },
              }}


            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                <span>🌡 Confession: &ldquo;{c.content.slice(0, 30)}...&rdquo;</span>
              </Tooltip>
              <Popup>&ldquo;{c.content}&rdquo;</Popup>
            </CircleMarker>
          ))}

        {/* Mood markers */}
        {activeLayer === 'feel' &&
          feelMoods &&
          feelMoods.map((m) => (
            <CircleMarker
              key={m.id}
              center={new LatLng(m.lat, m.lng)}
              radius={9}
              fillOpacity={0.85}
              color="white"
              fillColor={getEmotionColor(m.emotion)}
              weight={2}
              className="pulse-marker"
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  onMapClick?.(m.lat, m.lng, m.id)
                },
              }}


            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                <span>{getEmotionEmoji(m.emotion)} Feeling: {m.emotion}</span>
              </Tooltip>
              <Popup>Logged mood: {m.emotion} {getEmotionEmoji(m.emotion)}</Popup>
            </CircleMarker>
          ))}

        {/* Truth layer - red incident markers */}
        {activeLayer === 'truth' &&
          truthIncidents &&
          truthIncidents.map((incident) => (
            <CircleMarker
              key={incident.id}
              center={new LatLng(incident.lat, incident.lng)}
              radius={8}
              fillOpacity={0.8}
              color="#ef4444"
              fillColor="#ef4444"
              weight={2}
              className="pulse-marker"
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  onMapClick?.(incident.lat, incident.lng, incident.id)
                },
              }}


            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                <span>👁 Documented Incident: {incident.type}</span>
              </Tooltip>
              <Popup>{incident.type} ({incident.time_of_day})</Popup>
            </CircleMarker>
          ))}

        {/* Memory layer - purple markers at memory coordinates */}
        {activeLayer === 'memory' &&
          memories.map((memory) => (
            <CircleMarker
              key={memory.id}
              center={new LatLng(memory.lat, memory.lng)}
              radius={7}
              fillOpacity={0.8}
              color="#a855f7"
              fillColor="#a855f7"
              weight={2}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  onMapClick?.(memory.lat, memory.lng, memory.id)
                },
              }}


            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                <span>🕰 Memory logged for: {memory.year_label}</span>
              </Tooltip>
              <Popup>{memory.year_label}</Popup>
            </CircleMarker>
          ))}

        {/* Rhythm layer - green intensity overlay */}
        {activeLayer === 'rhythm' && (
          <CircleMarker
            center={new LatLng(lat, lng)}
            radius={20}
            fillOpacity={0.4}
            color="#22c55e"
            fillColor="#22c55e"
            weight={1}
          />
        )}

        {/* Selected location marker */}
        {selectedLocation && activeLayer !== 'now' && (
          <CircleMarker
            center={new LatLng(selectedLocation[0], selectedLocation[1])}
            radius={11}
            fillOpacity={0.9}
            color="white"
            fillColor={activeLayer === 'feel' ? '#f59e0b' : activeLayer === 'truth' ? '#ef4444' : activeLayer === 'memory' ? '#a855f7' : '#22c55e'}
            weight={3}
          />
        )}

        {/* User location marker */}
        <CircleMarker
          center={new LatLng(lat, lng)}
          radius={7}
          fillOpacity={1}
          color="white"
          fillColor="#00f2fe"
          weight={2}
          className="user-marker"
        />
      </MapContainer>

      {/* CSS animation for pulsing dots */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .pulse-marker {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
