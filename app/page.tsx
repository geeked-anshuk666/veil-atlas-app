'use client'

import { useEffect, useState } from 'react'
import { Dynamic } from 'next/dynamic'
import { useTheme } from '@/lib/theme-context'
import { getBgClass } from '@/lib/theme-colors'
import Map from '@/components/Map'
import LayerSelector from '@/components/LayerSelector'
import BottomSheet from '@/components/BottomSheet'
import NowPanel from '@/components/layers/NowPanel'
import FeelPanel from '@/components/layers/FeelPanel'
import TruthPanel from '@/components/layers/TruthPanel'
import MemoryPanel from '@/components/layers/MemoryPanel'
import RhythmPanel from '@/components/layers/RhythmPanel'
import type { LayerType, Post, Memory } from '@/types'

export default function HomePage() {
  const { theme } = useTheme()
  const [activeLayer, setActiveLayer] = useState<LayerType>('now')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [nowPosts, setNowPosts] = useState<Post[]>([])
  const [memories, setMemories] = useState<Memory[]>([])

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

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
        },
        () => {
          // Fallback to New York
          setUserLocation([40.7128, -74.006])
        }
      )
    } else {
      // Fallback to New York
      setUserLocation([40.7128, -74.006])
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

  // Fetch memories when user location changes
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

    fetchMemories()
  }, [userLocation])

  // Open sheet when layer changes
  useEffect(() => {
    setIsSheetOpen(true)
  }, [activeLayer])

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-300 ${getBgClass(theme, 'primary')}`}>
      {/* Map */}
      <Map
        activeLayer={activeLayer}
        userLocation={userLocation}
        nowPosts={nowPosts}
        memories={memories}
      />

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
