'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

import { getBgClass } from '@/lib/theme-colors'
import LeftNavigation from '@/components/LeftNavigation'
import LocationGating from '@/components/LocationGating'
import SearchBar from '@/components/SearchBar'
import Map from '@/components/Map'
import LayerSelector from '@/components/LayerSelector'
import BottomSheet from '@/components/BottomSheet'
import NowPanel from '@/components/layers/NowPanel'
import FeelPanel from '@/components/layers/FeelPanel'
import TruthPanel from '@/components/layers/TruthPanel'
import MemoryPanel from '@/components/layers/MemoryPanel'
import RhythmPanel from '@/components/layers/RhythmPanel'
import OnboardingModal from '@/components/OnboardingModal'
import type { LayerType, Post, Memory } from '@/types'

export default function HomePage() {
  const { theme } = useTheme()
  const [activeLayer, setActiveLayer] = useState<LayerType>('now')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [isGeolocating, setIsGeolocating] = useState(true)
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [nowPosts, setNowPosts] = useState<Post[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [feelConfessions, setFeelConfessions] = useState<any[]>([])
  const [truthIncidents, setTruthIncidents] = useState<any[]>([])
  const [feelMoods, setFeelMoods] = useState<any[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Use refs so callbacks always have latest values without stale closures
  const userLocationRef = useRef<[number, number] | null>(null)
  const selectedLocationRef = useRef<[number, number] | null>(null)

  useEffect(() => { userLocationRef.current = userLocation }, [userLocation])
  useEffect(() => { selectedLocationRef.current = selectedLocation }, [selectedLocation])

  // --- INIT ---
  useEffect(() => {
    if (typeof window === 'undefined') return

    let id = localStorage.getItem('veil_user_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('veil_user_id', id)
    }
    setUserId(id)

    const onboarded = localStorage.getItem('veil_onboarded')
    if (onboarded !== 'true') setShowOnboarding(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setUserLocation([latitude, longitude])
          setGpsAccuracy(accuracy)
          setHasLocationPermission(true)
          setIsGeolocating(false)
        },
        () => {
          setHasLocationPermission(false)
          setIsGeolocating(false)
        }
      )
    } else {
      setHasLocationPermission(false)
      setIsGeolocating(false)
    }
  }, [])

  // --- FETCH HELPERS — always read from refs for current values ---

  const fetchNowPosts = useCallback(async (center?: [number, number]) => {
    const loc = center || userLocationRef.current
    if (!loc) return
    try {
      const res = await fetch(`/api/now?lat=${loc[0]}&lng=${loc[1]}`)
      const data = await res.json()
      setNowPosts(Array.isArray(data) ? data : [])
    } catch (e) { console.error('[v0] Failed to fetch now posts:', e) }
  }, [])

  const fetchMemories = useCallback(async (center?: [number, number]) => {
    const loc = center || selectedLocationRef.current || userLocationRef.current
    if (!loc) return
    try {
      const res = await fetch(`/api/memory?lat=${loc[0]}&lng=${loc[1]}`)
      const data = await res.json()
      setMemories(Array.isArray(data) ? data : [])
    } catch (e) { console.error('[v0] Failed to fetch memories:', e) }
  }, [])

  const fetchConfessions = useCallback(async (center?: [number, number]) => {
    const loc = center || selectedLocationRef.current || userLocationRef.current
    if (!loc) return
    try {
      const res = await fetch(`/api/feel/pins?lat=${loc[0]}&lng=${loc[1]}`)
      const data = await res.json()
      setFeelConfessions(data.pins || [])
    } catch (e) { console.error('[v0] Failed to fetch confessions:', e) }
  }, [])

  const fetchIncidents = useCallback(async (center?: [number, number]) => {
    const loc = center || selectedLocationRef.current || userLocationRef.current
    if (!loc) return
    try {
      const res = await fetch(`/api/truth?lat=${loc[0]}&lng=${loc[1]}`)
      const data = await res.json()
      setTruthIncidents(data.list || [])
    } catch (e) { console.error('[v0] Failed to fetch truth incidents:', e) }
  }, [])

  const fetchMoods = useCallback(async (center?: [number, number]) => {
    const loc = center || selectedLocationRef.current || userLocationRef.current
    if (!loc) return
    try {
      const res = await fetch(`/api/feel?lat=${loc[0]}&lng=${loc[1]}`)
      const data = await res.json()
      setFeelMoods(data.list || [])
    } catch (e) { console.error('[v0] Failed to fetch moods:', e) }
  }, [])

  // Full refresh — called by panels after writes, and on location/selection change
  const handleRefreshMapData = useCallback((center?: [number, number]) => {
    fetchNowPosts(center)
    fetchMemories(center)
    fetchConfessions(center)
    fetchIncidents(center)
    fetchMoods(center)
  }, [fetchNowPosts, fetchMemories, fetchConfessions, fetchIncidents, fetchMoods])

  // --- AUTO-FETCH on userLocation resolve ---
  useEffect(() => {
    if (!userLocation) return
    handleRefreshMapData(userLocation)
    const interval = setInterval(() => fetchNowPosts(userLocation), 30000)
    return () => clearInterval(interval)
  }, [userLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- RE-FETCH when user clicks a new location on the map ---
  useEffect(() => {
    if (!selectedLocation) return
    handleRefreshMapData(selectedLocation)
  }, [selectedLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- CHECK-IN for rhythm ---
  useEffect(() => {
    if (!userLocation || !userId) return
    fetch('/api/rhythm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: userLocation[0], lng: userLocation[1], user_id: userId }),
    }).catch((e) => console.error('[v0] Failed to log check-in:', e))
  }, [userLocation, userId])

  // --- OPEN SHEET on layer change ---
  useEffect(() => { setIsSheetOpen(true) }, [activeLayer])

  // --- HANDLERS ---
  const handleMapClick = (lat: number, lng: number, pinId?: string) => {
    if (activeLayer === 'now') return
    setSelectedLocation([lat, lng])
    setIsSheetOpen(true)
    setSelectedPinId(pinId || null)
  }

  const handleLayerChange = (layer: LayerType) => {
    setActiveLayer(layer)
    setSelectedPinId(null)
    if (layer === 'now') setSelectedLocation(null)
  }


  const handleRequestLocation = () => {
    setIsGeolocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setUserLocation([latitude, longitude])
          setGpsAccuracy(accuracy)
          setHasLocationPermission(true)
          setIsGeolocating(false)
        },
        () => setIsGeolocating(false)
      )
    }
  }

  const handleExploreWithoutLocation = () => {
    setUserLocation([40.7128, -74.006])
    setGpsAccuracy(1000)
    setHasLocationPermission(true)
    setIsGeolocating(false)
  }

  const handleSearchLocationSelect = (lat: number, lng: number, _name: string) => {
    setSelectedLocation([lat, lng])
    setIsSheetOpen(true)
    setSearchDropdownOpen(false)
  }

  const handleMapClickClose = () => setSearchDropdownOpen(false)

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-300 ${getBgClass(theme, 'primary')}`}>
      {/* Location Gating Overlay */}
      <LocationGating
        isGeolocating={isGeolocating}
        hasLocationPermission={hasLocationPermission}
        onRequestLocation={handleRequestLocation}
        onExploreWithoutLocation={handleExploreWithoutLocation}
      />

      {/* Left Navigation */}
      <LeftNavigation activeLayer={activeLayer} onLayerChange={handleLayerChange} />

      {/* Search Bar */}
      <SearchBar
        onLocationSelect={handleSearchLocationSelect}
        onDropdownOpen={setSearchDropdownOpen}
      />

      {/* Map */}
      <Map
        activeLayer={activeLayer}
        userLocation={userLocation}
        selectedLocation={selectedLocation}
        nowPosts={nowPosts}
        memories={memories}
        feelConfessions={feelConfessions}
        truthIncidents={truthIncidents}
        feelMoods={feelMoods}
        onMapClick={handleMapClick}
      />

      {/* Layer Selector — kept for compatibility */}
      <LayerSelector activeLayer={activeLayer} onLayerChange={setActiveLayer} />

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        layerName={
          activeLayer === 'now'
            ? 'voices within 500m'
            : activeLayer === 'feel'
              ? 'the feeling here'
              : activeLayer === 'truth'
                ? 'documented nearby'
                : activeLayer === 'memory'
                  ? 'layers of time'
                  : 'when this place breathes'
        }
      >
        {activeLayer === 'now' && (
          <NowPanel
            userLocation={userLocation}
            selectedLocation={selectedLocation}
            userId={userId}
            gpsAccuracy={gpsAccuracy || undefined}
            onRefreshMapData={() => handleRefreshMapData()}
          />
        )}
        {activeLayer === 'feel' && (
          <FeelPanel
            userLocation={userLocation}
            selectedLocation={selectedLocation}
            userId={userId}
            selectedPinId={selectedPinId}
            onRefreshMapData={() => handleRefreshMapData()}
          />
        )}
        {activeLayer === 'truth' && (
          <TruthPanel
            userLocation={userLocation}
            selectedLocation={selectedLocation}
            userId={userId}
            selectedPinId={selectedPinId}
            onRefreshMapData={() => handleRefreshMapData()}
          />
        )}
        {activeLayer === 'memory' && (
          <MemoryPanel
            userLocation={userLocation}
            selectedLocation={selectedLocation}
            userId={userId}
            selectedPinId={selectedPinId}
            onRefreshMapData={() => handleRefreshMapData()}
          />
        )}
        {activeLayer === 'rhythm' && (
          <RhythmPanel userLocation={userLocation} selectedLocation={selectedLocation} />
        )}
      </BottomSheet>


      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}
