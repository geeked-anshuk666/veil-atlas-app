'use client'

import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvent, useMap, Tooltip, Marker } from 'react-leaflet'
import { LatLng, divIcon } from 'leaflet'
import { useTheme } from '@/lib/theme-context'
import { useState, useEffect } from 'react'
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

/**
 * Deterministic radial jitter — pins at the same GPS coords spread out like a
 * flower so each is individually clickable. Uses the pin's UUID characters as
 * a seed so the same pin always renders at the same offset (no jumping).
 * Max spread: ~8 metres (0.00008 degrees).
 */
function jitterCoord(id: string, lat: number, lng: number): [number, number] {
  // Guard: only use hex chars for seed, fall back to 0 if id is non-hex (e.g. 'mock-1')
  const clean = id.replace(/-/g, '').replace(/[^0-9a-fA-F]/g, '0').padEnd(8, '0')
  const seed1 = parseInt(clean.slice(0, 4), 16) / 0xffff
  const seed2 = parseInt(clean.slice(4, 8), 16) / 0xffff
  const angle = seed1 * 2 * Math.PI
  const radius = seed2 * 0.00008 // ~8m max
  return [lat + Math.sin(angle) * radius, lng + Math.cos(angle) * radius]
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function clusterPins<T extends { id: string; lat: number; lng: number }>(
  pins: T[],
  radiusMeters: number = 20
): { center: [number, number]; pins: T[] }[] {
  const clusters: { center: [number, number]; pins: T[] }[] = []
  pins.forEach((pin) => {
    let added = false
    for (const cluster of clusters) {
      if (distanceMeters(pin.lat, pin.lng, cluster.center[0], cluster.center[1]) <= radiusMeters) {
        cluster.pins.push(pin)
        const count = cluster.pins.length
        cluster.center = [
          cluster.pins.reduce((sum, p) => sum + p.lat, 0) / count,
          cluster.pins.reduce((sum, p) => sum + p.lng, 0) / count,
        ]
        added = true
        break
      }
    }
    if (!added) {
      clusters.push({ center: [pin.lat, pin.lng], pins: [pin] })
    }
  })
  return clusters
}

function createHolographicIcon(count: number, color: string) {
  const height = Math.min(130, 45 + count * 8)
  const wBase = 18
  const wTower = 11
  const yBottom = 150
  const yBaseTop = 150 - height * 0.42
  const yRoof = 150 - height
  const yAntenna = yRoof - 22

  const svgHtml = [
    `<svg width="60" height="160" viewBox="0 0 60 160" style="overflow:visible;filter:drop-shadow(0 0 8px ${color}80)">`,
    `<defs>`,
    `<linearGradient id="cg${count}" x1="0" y1="1" x2="0" y2="0">`,
    `<stop offset="0%" stop-color="${color}" stop-opacity="0.05"/>`,
    `<stop offset="100%" stop-color="${color}" stop-opacity="0.75"/>`,
    `</linearGradient>`,
    `</defs>`,
    
    // Spire
    `<line x1="30" y1="${yRoof - 3}" x2="30" y2="${yAntenna}" stroke="${color}" stroke-width="1.5" />`,
    `<circle cx="30" cy="${yAntenna}" r="2.5" fill="#ffffff" stroke="${color}" stroke-width="1" class="neon-pulse" />`,
    
    // BASE TIER - Left Face
    `<path d="M ${30 - wBase},${yBottom - 4} L ${30 - wBase},${yBaseTop} L 30,${yBaseTop + 4} L 30,${yBottom} Z" fill="url(#cg${count})" stroke="${color}" stroke-width="1"/>`,
    // BASE TIER - Right Face
    `<path d="M 30,${yBottom} L 30,${yBaseTop + 4} L ${30 + wBase},${yBaseTop} L ${30 + wBase},${yBottom - 4} Z" fill="url(#cg${count})" stroke="${color}" stroke-dasharray="2,2" stroke-width="0.8"/>`,
    // BASE TIER - Roof Face
    `<path d="M ${30 - wBase},${yBaseTop} L 30,${yBaseTop - 4} L ${30 + wBase},${yBaseTop} L 30,${yBaseTop + 4} Z" fill="${color}" fill-opacity="0.4" stroke="${color}" stroke-width="0.8"/>`,
    
    // UPPER TIER - Left Face
    `<path d="M ${30 - wTower},${yBaseTop} L ${30 - wTower},${yRoof} L 30,${yRoof + 3} L 30,${yBaseTop + 3} Z" fill="url(#cg${count})" stroke="${color}" stroke-width="1.2"/>`,
    // UPPER TIER - Right Face
    `<path d="M 30,${yBaseTop + 3} L 30,${yRoof + 3} L ${30 + wTower},${yRoof} L ${30 + wTower},${yBaseTop} Z" fill="url(#cg${count})" stroke="${color}" stroke-dasharray="1.5,1.5" stroke-width="0.8"/>`,
    // UPPER TIER - Roof Face
    `<path d="M ${30 - wTower},${yRoof} L 30,${yRoof - 3} L ${30 + wTower},${yRoof} L 30,${yRoof + 3} Z" fill="${color}" fill-opacity="0.95" stroke="#ffffff" stroke-width="1"/>`,
    
    // Cyber Grid Windows (Dotted grid pattern)
    `<line x1="${30 - wTower/2}" y1="${yBaseTop - 2}" x2="${30 - wTower/2}" y2="${yRoof + 2}" stroke="${color}" stroke-dasharray="2,3" stroke-width="1.2" opacity="0.6"/>`,
    `<line x1="${30 + wTower/2}" y1="${yBaseTop - 2}" x2="${30 + wTower/2}" y2="${yRoof + 2}" stroke="${color}" stroke-dasharray="2,3" stroke-width="1.2" opacity="0.6"/>`,

    // Count text
    `<text x="30" y="${yRoof + 1}" fill="#000000" font-size="8" font-weight="900" text-anchor="middle">${count}</text>`,
    `</svg>`,
  ].join('')

  return divIcon({
    html: svgHtml,
    className: 'holographic-3d-building',
    iconSize: [60, 160],
    iconAnchor: [30, 150],
  })
}




// Helper component to capture map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void; activeLayer: string }) {
  useMapEvent('click', (e) => {
    const target = e.originalEvent.target as HTMLElement
    if (target && (target.classList.contains('leaflet-interactive') || target.closest('.leaflet-interactive'))) {
      return // Ignore map click if clicking a marker
    }
    onMapClick?.(e.latlng.lat, e.latlng.lng)
  })
  return null
}


// ZoomListener: tracks map zoom level reactively
function ZoomListener({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap()
  useMapEvent('zoomend', () => onZoom(map.getZoom()))
  return null
}

// Helper component to handle flyTo for selected locations
function FlyToLocation({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap()
  
  useMapEvent('click', () => {
    // Map click event - this ensures map events are active
  })

  useEffect(() => {
    if (selectedLocation && map) {
      map.flyTo(new LatLng(selectedLocation[0], selectedLocation[1]), 16, {
        duration: 1.2,
      })
    }
  }, [selectedLocation, map])
  
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
  const [zoom, setZoom] = useState(16)

  // Dynamic ground radius based on zoom:
  // Zoom 16+: 35m
  // Zoom 15: 150m
  // Zoom 14: 600m
  // Zoom 13: 2000m (2 Km)
  // Zoom 12: 5000m (5 Km)
  // Zoom 11: 12000m (12 Km)
  // Zoom 10: 25000m (25 Km)
  // Zoom 9: 42000m (42 Km)
  // Zoom 8 or lower: 60000m (60 Km)
  const getClusteringRadius = (z: number) => {
    if (z >= 17) return 15
    if (z === 16) return 35
    if (z === 15) return 150
    if (z === 14) return 600
    if (z === 13) return 2000
    if (z === 12) return 5000
    if (z === 11) return 12000
    if (z === 10) return 25000
    if (z === 9) return 42000
    return 60000
  }
  const dynamicRadius = getClusteringRadius(zoom)

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
        {/* Zoom tracker for dynamic cluster radius */}
        <ZoomListener onZoom={setZoom} />

        {/* FlyTo for selected locations */}
        <FlyToLocation selectedLocation={selectedLocation} />

        {/* Now layer - blue pulsing dots or 3D towers */}
        {activeLayer === 'now' &&
          clusterPins(nowPosts, dynamicRadius).map((cluster, cIdx) => {

            const count = cluster.pins.length
            if (count > 1) {
              const mainPost = cluster.pins[0]
              return (
                <Marker
                  key={`now-cluster-${cIdx}`}
                  position={new LatLng(cluster.center[0], cluster.center[1])}
                  icon={createHolographicIcon(count, '#3b82f6')}
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation()
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -110]} opacity={0.9}>
                    <span>⚡ Clustered Signals: {count} signals active here</span>
                  </Tooltip>
                  <Popup>
                    <div className="space-y-2 max-h-48 overflow-y-auto min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-1.5 mb-1.5">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-white">{count} signals active</strong>
                        <button
                          onClick={() => onMapClick?.(cluster.center[0], cluster.center[1], mainPost.id)}
                          className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white font-bold px-2 py-0.5 rounded-md transition-all active:scale-95"
                        >
                          Zoom In
                        </button>
                      </div>
                      {cluster.pins.map((p) => (
                        <p key={p.id} className="text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-800/5 pb-1 last:border-0">• {p.content.slice(0, 50)}...</p>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              )
            }

            const post = cluster.pins[0]
            const [jLat, jLng] = jitterCoord(post.id, post.lat, post.lng)
            return (
              <CircleMarker
                key={post.id}
                center={new LatLng(jLat, jLng)}
                radius={8}
                fillOpacity={0.8}
                color="#3b82f6"
                fillColor="#3b82f6"
                weight={2}
                className="pulse-marker"
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation()
                    onMapClick?.(post.lat, post.lng, post.id)
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                  <span>⚡ Live Signal: &ldquo;{post.content.slice(0, 30)}...&rdquo;</span>
                </Tooltip>
                <Popup>{post.content}</Popup>
              </CircleMarker>
            )
          })}


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

        {/* Feel layer confessions + moods clustered together */}
        {activeLayer === 'feel' && (() => {
          const unifiedPins = [
            ...(feelConfessions || []).map(c => ({ ...c, type: 'confession' as const })),
            ...(feelMoods || []).map(m => ({ ...m, type: 'mood' as const }))
          ];
          
          return clusterPins(unifiedPins, dynamicRadius).map((cluster, cIdx) => {

            const count = cluster.pins.length;
            if (count > 1) {
              const mainPin = cluster.pins[0];
              return (
                <Marker
                  key={`feel-cluster-${cIdx}`}
                  position={new LatLng(cluster.center[0], cluster.center[1])}
                  icon={createHolographicIcon(count, '#fbbf24')}
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -110]} opacity={0.9}>
                    <span>🌡 Clustered Feelings: {count} signals here</span>
                  </Tooltip>
                  <Popup>
                    <div className="space-y-2 max-h-48 overflow-y-auto min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-1.5 mb-1.5">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-white">{count} items logged</strong>
                        <button
                          onClick={() => onMapClick?.(cluster.center[0], cluster.center[1], mainPin.id)}
                          className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded-md transition-all active:scale-95"
                        >
                          Zoom In
                        </button>
                      </div>
                      {cluster.pins.map((p) => (
                        <div key={p.id} className="text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-800/5 pb-1 last:border-0">
                          {p.type === 'confession' ? (
                            <span>• 🌡 Confession: &ldquo;{p.content?.slice(0, 40)}...&rdquo;</span>
                          ) : (
                            <span>• {getEmotionEmoji(p.emotion || '')} Mood: {p.emotion}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            const p = cluster.pins[0];
            const [jLat, jLng] = jitterCoord(p.id, p.lat, p.lng);
            if (p.type === 'confession') {
              return (
                <CircleMarker
                  key={p.id}
                  center={new LatLng(jLat, jLng)}
                  radius={8}
                  fillOpacity={0.8}
                  color="#fbbf24"
                  fillColor="#fbbf24"
                  weight={2}
                  className="pulse-marker"
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                      onMapClick?.(p.lat, p.lng, p.id);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                    <span>🌡 Confession: &ldquo;{p.content?.slice(0, 30)}...&rdquo;</span>
                  </Tooltip>
                  <Popup>&ldquo;{p.content}&rdquo;</Popup>
                </CircleMarker>
              );
            } else {
              const emotion = p.emotion || '';
              return (
                <CircleMarker
                  key={p.id}
                  center={new LatLng(jLat, jLng)}
                  radius={9}
                  fillOpacity={0.85}
                  color="white"
                  fillColor={getEmotionColor(emotion)}
                  weight={2}
                  className="pulse-marker"
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                      onMapClick?.(p.lat, p.lng, p.id);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                    <span>{getEmotionEmoji(emotion)} Feeling: {emotion}</span>
                  </Tooltip>
                  <Popup>Logged mood: {emotion} {getEmotionEmoji(emotion)}</Popup>
                </CircleMarker>
              );
            }
          });
        })()}


        {/* Truth layer - red incident markers */}
        {activeLayer === 'truth' &&
          truthIncidents &&
          clusterPins(truthIncidents, dynamicRadius).map((cluster, cIdx) => {

            const count = cluster.pins.length
            if (count > 1) {
              const mainPin = cluster.pins[0]
              return (
                <Marker
                  key={`truth-cluster-${cIdx}`}
                  position={new LatLng(cluster.center[0], cluster.center[1])}
                  icon={createHolographicIcon(count, '#ef4444')}
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation()
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -110]} opacity={0.9}>
                    <span>👁 Clustered Incidents: {count} reports here</span>
                  </Tooltip>
                  <Popup>
                    <div className="space-y-2 max-h-48 overflow-y-auto min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-1.5 mb-1.5">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-white">{count} reports</strong>
                        <button
                          onClick={() => onMapClick?.(cluster.center[0], cluster.center[1], mainPin.id)}
                          className="text-[10px] bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded-md transition-all active:scale-95"
                        >
                          Zoom In
                        </button>
                      </div>
                      {cluster.pins.map((p) => (
                        <p key={p.id} className="text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-800/5 pb-1 last:border-0">• {p.type} ({p.time_of_day})</p>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              )
            }

            const incident = cluster.pins[0]
            const [jLat, jLng] = jitterCoord(incident.id, incident.lat, incident.lng)
            return (
              <CircleMarker
                key={incident.id}
                center={new LatLng(jLat, jLng)}
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
            )
          })}


        {/* Memory layer - purple markers at memory coordinates */}
        {activeLayer === 'memory' &&
          clusterPins(memories, dynamicRadius).map((cluster, cIdx) => {

            const count = cluster.pins.length
            if (count > 1) {
              const mainPin = cluster.pins[0]
              return (
                <Marker
                  key={`memory-cluster-${cIdx}`}
                  position={new LatLng(cluster.center[0], cluster.center[1])}
                  icon={createHolographicIcon(count, '#a855f7')}
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation()
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -110]} opacity={0.9}>
                    <span>🕰 Clustered Memories: {count} logged here</span>
                  </Tooltip>
                  <Popup>
                    <div className="space-y-2 max-h-48 overflow-y-auto min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-1.5 mb-1.5">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-white">{count} memories</strong>
                        <button
                          onClick={() => onMapClick?.(cluster.center[0], cluster.center[1], mainPin.id)}
                          className="text-[10px] bg-purple-500 hover:bg-purple-600 text-white font-bold px-2 py-0.5 rounded-md transition-all active:scale-95"
                        >
                          Zoom In
                        </button>
                      </div>
                      {cluster.pins.map((p) => (
                        <p key={p.id} className="text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-800/5 pb-1 last:border-0">• {p.year_label}: {p.content.slice(0, 50)}...</p>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              )
            }

            const memory = cluster.pins[0]
            const [jLat, jLng] = jitterCoord(memory.id, memory.lat, memory.lng)
            return (
              <CircleMarker
                key={memory.id}
                center={new LatLng(jLat, jLng)}
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
            )
          })}


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

      {/* CSS animation for pulsing dots and floating 3D towers */}
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
        .holographic-3d-building {
          animation: floatBuilding 3.5s ease-in-out infinite alternate;
          background: none !important;
          border: none !important;
        }
        @keyframes floatBuilding {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-4px);
          }
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .neon-pulse {
          animation: neonPulse 1.2s ease-in-out infinite;
        }
      `}</style>

    </div>
  )
}

