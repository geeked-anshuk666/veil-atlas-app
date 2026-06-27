'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapContentProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  userLocation: [number, number]
  nowPosts: Array<{ id: string; lat: number; lng: number; content: string }>
  memories: Array<{ id: string; lat: number; lng: number; year_label: string }>
}

const CARTODB_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTODB_ATTRIBUTION = '© OpenStreetMap contributors © CARTO'

export default function MapContent({
  activeLayer,
  userLocation,
  nowPosts,
  memories,
}: MapContentProps) {
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
          url={CARTODB_DARK_TILES}
          attribution={CARTODB_ATTRIBUTION}
          maxZoom={19}
        />

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
              <Popup>{post.content}</Popup>
            </CircleMarker>
          ))}

        {/* Feel layer - amber semi-transparent circle around user */}
        {activeLayer === 'feel' && (
          <CircleMarker
            center={new LatLng(lat, lng)}
            radius={60}
            fillOpacity={0.15}
            color="#fbbf24"
            fillColor="#fbbf24"
            weight={1}
            dashArray="5,5"
          />
        )}

        {/* Truth layer - red clusters sized by incident count */}
        {activeLayer === 'truth' && (
          <CircleMarker
            center={new LatLng(lat, lng)}
            radius={15}
            fillOpacity={0.6}
            color="#ef4444"
            fillColor="#ef4444"
            weight={2}
          >
            <Popup>9 incidents in the past year</Popup>
          </CircleMarker>
        )}

        {/* Memory layer - purple markers at memory coordinates */}
        {activeLayer === 'memory' &&
          memories.map((memory) => (
            <CircleMarker
              key={memory.id}
              center={new LatLng(memory.lat, memory.lng)}
              radius={6}
              fillOpacity={0.8}
              color="#a855f7"
              fillColor="#a855f7"
              weight={2}
            >
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
