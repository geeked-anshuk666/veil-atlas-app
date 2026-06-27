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
    <div className="space-y-4 pt-2">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-custom" />
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'} animate-breathing`}>
            voices within 500m
          </h2>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {loading && !posts.length ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 animate-pulse backdrop-blur-lg border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-black/5 border-black/10'
              }`}
            >
              <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2`} />
              <div className={`h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-2/3`} />
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className={`rounded-xl p-4 space-y-2 backdrop-blur-lg border transition-all duration-300 hover:border-blue-400/50 animate-slideUp ${
                theme === 'dark'
                  ? 'bg-blue-500/5 border-blue-400/20'
                  : 'bg-blue-500/5 border-blue-400/20'
              }`}
              style={{
                animationDelay: `${idx * 50}ms`,
                borderLeft: '3px solid #3b82f6',
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  anonymous
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {getTimeAgo(post.created_at)}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {post.content}
              </p>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  ~{getDistance(post.lat, post.lng)} away
                </span>
              </div>
              <ProgressBar percentage={getProgressPercentage(post.created_at)} color="blue" />
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            <p className="animate-breathing">quiet here right now</p>
          </div>
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
          className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all duration-300 backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-white/10 border-blue-400/30 text-white placeholder-gray-500 focus:border-blue-400 focus:bg-blue-500/10'
              : 'bg-black/10 border-blue-400/30 text-black placeholder-gray-600 focus:border-blue-400 focus:bg-blue-400/10'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !inputValue.trim()}
          className={`px-4 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 backdrop-blur-sm ${
            inputValue.trim()
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50 active:scale-95'
              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '⟳' : '→'}
        </button>
      </div>
    </div>
  )
}
