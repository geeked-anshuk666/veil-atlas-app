'use client'

import { useEffect, useState } from 'react'
import { Dynamic } from 'next/dynamic'
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
  const [userId, setUserId] = useState<string>('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [isGeolocating, setIsGeolocating] = useState(true)
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [nowPosts, setNowPosts] = useState<Post[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [feelConfessions, setFeelConfessions] = useState<any[]>([])
  const [truthIncidents, setTruthIncidents] = useState<any[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)


  // Initialize user ID and geolocation
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get or create user ID
    let id = localStorage.getItem('veil_user_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('veil_user_id', id)
    }
    setUserId(id)

    const onboarded = localStorage.getItem('veil_onboarded')
    if (onboarded !== 'true') {
      setShowOnboarding(true)
    }


    // Get geolocation
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
          // User denied location or error occurred
          setHasLocationPermission(false)
          setIsGeolocating(false)
        }
      )
    } else {
      // Geolocation not supported
      setHasLocationPermission(false)
      setIsGeolocating(false)
    }
  }, [])

  // Fetch now posts when user location changes
  useEffect(() => {
    if (!userLocation) return

    const fetchNowPosts = async () => {
      try {
        const res = await fetch(`/api/now?lat=${userLocation[0]}&lng=${userLocation[1]}`)
        const data = await res.json()
        setNowPosts(data)
      } catch (error) {
        console.error('[v0] Failed to fetch now posts:', error)
      }
    }

    fetchNowPosts()
    const interval = setInterval(fetchNowPosts, 30000)
    return () => clearInterval(interval)
  }, [userLocation])

  // Fetch memories, confessions, and incidents when user location changes
  useEffect(() => {
    if (!userLocation) return

    const fetchMemories = async () => {
      try {
        const res = await fetch(`/api/memory?lat=${userLocation[0]}&lng=${userLocation[1]}`)
        const data = await res.json()
        setMemories(data)
      } catch (error) {
        console.error('[v0] Failed to fetch memories:', error)
      }
    }

    const fetchConfessions = async () => {
      try {
        const res = await fetch(`/api/feel/pins?lat=${userLocation[0]}&lng=${userLocation[1]}`)
        const data = await res.json()
        setFeelConfessions(data.pins || [])
      } catch (error) {
        console.error('[v0] Failed to fetch confessions:', error)
      }
    }

    const fetchIncidents = async () => {
      try {
        const res = await fetch(`/api/truth?lat=${userLocation[0]}&lng=${userLocation[1]}`)
        const data = await res.json()
        setTruthIncidents(data.list || [])
      } catch (error) {
        console.error('[v0] Failed to fetch truth incidents:', error)
      }
    }

    fetchMemories()
    fetchConfessions()
    fetchIncidents()
  }, [userLocation])

  // Trigger check-in when user location is resolved
  useEffect(() => {
    if (!userLocation || !userId) return
    const doCheckin = async () => {
      try {
        await fetch('/api/rhythm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: userLocation[0],
            lng: userLocation[1],
            user_id: userId
          })
        })
      } catch (error) {
        console.error('[v0] Failed to log check-in:', error)
      }
    }
    doCheckin()
  }, [userLocation, userId])


  // Open sheet when layer changes
  useEffect(() => {
    setIsSheetOpen(true)
  }, [activeLayer])

  const handleMapClick = (lat: number, lng: number) => {
    if (activeLayer === 'now') return // Now layer is locked to user location
    setSelectedLocation([lat, lng])
    setIsSheetOpen(true)
  }

  const handleLayerChange = (layer: LayerType) => {
    setActiveLayer(layer)
    // When switching to Now, clear selected location
    if (layer === 'now') {
      setSelectedLocation(null)
    }
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
        () => {
          setIsGeolocating(false)
        }
      )
    }
  }

  const handleExploreWithoutLocation = () => {
    // Set to New York as default
    setUserLocation([40.7128, -74.006])
    setGpsAccuracy(1000)
    setHasLocationPermission(true)
    setIsGeolocating(false)
  }

  const handleSearchLocationSelect = (lat: number, lng: number, name: string) => {
    setSelectedLocation([lat, lng])
    setIsSheetOpen(true)
    setSearchDropdownOpen(false)
  }

  const handleMapClickClose = () => {
    setSearchDropdownOpen(false)
  }

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
        onMapClick={handleMapClick}
      />



      {/* Layer Selector - will be hidden, kept for compatibility */}
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
          <NowPanel userLocation={userLocation} selectedLocation={selectedLocation} userId={userId} gpsAccuracy={gpsAccuracy || undefined} />
        )}
        {activeLayer === 'feel' && (
          <FeelPanel userLocation={userLocation} selectedLocation={selectedLocation} userId={userId} />
        )}
        {activeLayer === 'truth' && (
          <TruthPanel userLocation={userLocation} selectedLocation={selectedLocation} userId={userId} />
        )}
        {activeLayer === 'memory' && (
          <MemoryPanel userLocation={userLocation} selectedLocation={selectedLocation} userId={userId} />
        )}
        {activeLayer === 'rhythm' && (
          <RhythmPanel userLocation={userLocation} selectedLocation={selectedLocation} />
        )}
      </BottomSheet>

      {/* Onboarding Modal Overlay */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>

  )
}
