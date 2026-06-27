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
  gpsAccuracy?: number
}

export default function NowPanel({ userLocation, userId, gpsAccuracy }: NowPanelProps) {
  const { theme } = useTheme()
  const [posts, setPosts] = useState<NowPost[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const hasWeakGPS = gpsAccuracy && gpsAccuracy > 100

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
    <div className="space-y-4 pt-1">
      <div>
        <h2 className={`text-xs font-bold uppercase tracking-widest mb-6 ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        } animate-breathing`}>
          ⚡ live signals
        </h2>
      </div>

      {/* Posts feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {loading && !posts.length ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-lg p-4 border animate-pulse backdrop-blur-lg ${
                theme === 'dark'
                  ? 'bg-white/4 border-white/8'
                  : 'bg-black/4 border-black/8'
              }`}
              style={{
                background: `linear-gradient(90deg, ${
                  theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                } 25%, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} 50%, ${
                  theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                } 75%)`,
                backgroundSize: '1000px 100%',
              }}
            >
              <div className={`h-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'} rounded mb-3`} />
              <div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'} rounded w-2/3`} />
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className={`rounded-lg p-4 space-y-2 border transition-all duration-300 hover:border-blue-500/50 animate-slideUp ${
                theme === 'dark'
                  ? 'bg-white/4 border-white/8'
                  : 'bg-black/4 border-black/8'
              }`}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animationDelay: `${idx * 60}ms`,
                borderLeft: '2px solid #3b82f6',
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                  anonymous
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  {getTimeAgo(post.created_at)}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {post.content}
              </p>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  ~{getDistance(post.lat, post.lng)} away
                </span>
              </div>
              <ProgressBar percentage={getProgressPercentage(post.created_at)} color="blue" />
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            <p className="animate-breathing text-sm">quiet here right now</p>
          </div>
        )}
      </div>

      {/* GPS Accuracy Warning */}
      {hasWeakGPS && (
        <div className={`mt-4 p-3 rounded-lg border text-xs ${
          theme === 'dark'
            ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
            : 'bg-amber-500/10 border-amber-400/30 text-amber-700'
        }`}>
          ⚡ GPS signal weak — some features limited
        </div>
      )}

      {/* Input */}
      <div className={`flex gap-2 pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !hasWeakGPS && handleSubmit()}
          placeholder={hasWeakGPS ? 'GPS signal weak...' : 'drop a signal...'}
          disabled={hasWeakGPS}
          className={`flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none transition-all duration-300 ${
            hasWeakGPS
              ? theme === 'dark'
                ? 'bg-white/3 border-white/5 text-gray-500 placeholder-gray-600'
                : 'bg-black/3 border-black/5 text-gray-600 placeholder-gray-500 cursor-not-allowed'
              : theme === 'dark'
                ? 'bg-white/6 border-white/12 text-white placeholder-gray-500 focus:border-blue-400/50 focus:bg-blue-500/8'
                : 'bg-black/6 border-black/12 text-black placeholder-gray-600 focus:border-blue-400/50 focus:bg-blue-400/8'
          }`}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !inputValue.trim() || hasWeakGPS}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
            inputValue.trim() && !hasWeakGPS
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-90 shadow-lg shadow-blue-500/30'
              : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? '⟳' : '→'}
        </button>
      </div>
    </div>
  )
}
