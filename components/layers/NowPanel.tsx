'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { getCardClass, getTextClass, getBorderClass } from '@/lib/theme-colors'
import ProgressBar from '../ui/ProgressBar'

interface NowPost {
  id: string
  content: string
  lat: number
  lng: number
  created_at: string
  user_hash: string
}

interface NowPanelProps {
  userLocation: [number, number] | null
  userId: string
}

export default function NowPanel({ userLocation, userId }: NowPanelProps) {
  const { theme } = useTheme()
  const [posts, setPosts] = useState<NowPost[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch posts on mount and every 30 seconds
  useEffect(() => {
    if (!userLocation) return

    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/now?lat=${userLocation[1]}&lng=${userLocation[0]}`
        )
        const data = await response.json()
        setPosts(data)
      } catch (error) {
        console.error('[v0] Error fetching now posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
    const interval = setInterval(fetchPosts, 30000)

    return () => clearInterval(interval)
  }, [userLocation])

  const handleSubmit = async () => {
    if (!inputValue.trim() || !userLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[1],
          lng: userLocation[0],
          content: inputValue,
          user_id: userId,
        }),
      })
      setInputValue('')
      // Refetch posts
      const response = await fetch(
        `/api/now?lat=${userLocation[1]}&lng=${userLocation[0]}`
      )
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('[v0] Error submitting post:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getProgressPercentage = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const now = new Date().getTime()
    const thirtyMinutes = 30 * 60 * 1000
    const elapsed = now - created
    const percentage = Math.max(0, 100 - (elapsed / thirtyMinutes) * 100)
    return Math.min(100, percentage)
  }

  const getDistance = (lat: number, lng: number) => {
    if (!userLocation) return '?'
    const dLat = (lat - userLocation[1]) * 111 // Rough km conversion
    const dLng = (lng - userLocation[0]) * 111 * Math.cos((lat * Math.PI) / 180)
    const km = Math.sqrt(dLat * dLat + dLng * dLng)
    const m = km * 1000
    return m < 1000 ? `${Math.round(m)}m` : `${km.toFixed(1)}km`
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <h2 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>voices within 500m</h2>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading && !posts.length ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`rounded-lg p-4 animate-pulse ${getCardClass(theme)}`}>
              <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2`} />
              <div className={`h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-2/3`} />
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className={`rounded-lg p-3 space-y-2 ${getCardClass(theme)}`}>
              <div className="flex justify-between items-start gap-2">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>anonymous</span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{getTimeAgo(post.created_at)}</span>
              </div>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{post.content}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>~{getDistance(post.lat, post.lng)} away</span>
              </div>
              <ProgressBar percentage={getProgressPercentage(post.created_at)} color="blue" />
            </div>
          ))
        ) : (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>quiet here right now</div>
        )}
      </div>

      {/* Input */}
      <div className={`flex gap-2 pt-4 border-t ${getBorderClass(theme)}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="leave a signal..."
          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${
            theme === 'dark'
              ? 'bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500'
              : 'bg-[#f5f5f5] border-gray-300 text-black placeholder-gray-400'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !inputValue.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-black px-3 py-2 rounded-lg transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}
