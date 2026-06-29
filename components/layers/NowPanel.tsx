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
  selectedLocation: [number, number] | null
  userId: string
  gpsAccuracy?: number
  onRefreshMapData?: () => void
}

export default function NowPanel({ userLocation, selectedLocation, userId, gpsAccuracy, onRefreshMapData }: NowPanelProps) {

  const { theme } = useTheme()
  const [posts, setPosts] = useState<NowPost[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Thread states
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyInputValue, setReplyInputValue] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  
  const hasWeakGPS = !!(gpsAccuracy && gpsAccuracy > 3000)


  // Fetch posts on mount and every 30 seconds
  useEffect(() => {
    if (!userLocation) return

    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/now?lat=${userLocation[0]}&lng=${userLocation[1]}`
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
          lat: userLocation[0],
          lng: userLocation[1],
          content: inputValue,
          user_id: userId,
        }),
      })
      setInputValue('')
      // Refetch posts
      const response = await fetch(
        `/api/now?lat=${userLocation[0]}&lng=${userLocation[1]}`
      )
      const data = await response.json()
      setPosts(data)
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting post:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleReplies = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
      setReplies([])
      return
    }

    setExpandedPostId(postId)
    setRepliesLoading(true)
    setReplyInputValue('')
    try {
      const res = await fetch(`/api/now/replies?parent_id=${postId}`)
      const data = await res.json()
      setReplies(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch replies:', e)
    } finally {
      setRepliesLoading(false)
    }
  }

  const handleSendReply = async (postId: string) => {
    if (!replyInputValue.trim()) return

    setReplySubmitting(true)
    try {
      await fetch('/api/now/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: postId,
          content: replyInputValue,
          user_id: userId,
        }),
      })
      setReplyInputValue('')
      // Re-fetch replies
      const res = await fetch(`/api/now/replies?parent_id=${postId}`)
      const data = await res.json()
      setReplies(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to send reply:', e)
    } finally {
      setReplySubmitting(false)
    }
  }


  const getTimeAgo = (dateStr: string | number) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getProgressPercentage = (createdAt: string | number) => {
    const created = new Date(createdAt).getTime()
    const now = new Date().getTime()
    const thirtyMinutes = 30 * 60 * 1000
    const elapsed = now - created
    const percentage = Math.max(0, 100 - (elapsed / thirtyMinutes) * 100)
    return Math.min(100, percentage)
  }

  const getDistance = (lat: number, lng: number) => {
    if (!userLocation) return '?'
    const dLat = (lat - userLocation[0]) * 111 // Rough km conversion
    const dLng = (lng - userLocation[1]) * 111 * Math.cos((lat * Math.PI) / 180)
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
      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
        {loading && !posts.length ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 border animate-pulse backdrop-blur-lg ${
                theme === 'dark'
                  ? 'bg-zinc-950/40 border-zinc-900'
                  : 'bg-white/40 border-zinc-200'
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
              <div className={`h-3 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded mb-3`} />
              <div className={`h-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-2/3`} />
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className={`rounded-2xl p-4 space-y-2.5 border border-l-2 transition-all duration-300 hover:border-blue-500/50 animate-slideUp ${
                theme === 'dark'
                  ? 'bg-zinc-950/40 border-zinc-900 border-l-blue-500 text-zinc-100'
                  : 'bg-white border-zinc-200 border-l-blue-500 text-zinc-800'
              }`}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Signal
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {getTimeAgo(post.created_at)}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {post.content}
              </p>
              <div className="flex justify-between items-center text-xs text-zinc-500 font-medium pt-1">
                <span>~{getDistance(post.lat, post.lng)} away</span>
                <button
                  onClick={() => handleToggleReplies(post.id)}
                  className={`text-[10px] uppercase font-bold tracking-wider hover:underline transition-all ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  💬 {expandedPostId === post.id ? 'Close Discussion' : 'Discuss'}
                </button>
              </div>

              {/* Nested replies section */}
              {expandedPostId === post.id && (
                <div className={`pl-4 mt-3 pt-3 border-t space-y-3 ${
                  theme === 'dark' ? 'border-zinc-900' : 'border-zinc-100'
                }`}>
                  {repliesLoading ? (
                    <div className="text-xs text-zinc-500 animate-pulse">Retrieving local signals...</div>
                  ) : replies.length > 0 ? (
                    <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                      {replies.map((rep) => (
                        <div key={rep.id} className="text-xs space-y-1">
                          <div className="flex justify-between items-center text-zinc-500">
                            <span className="font-bold text-[10px] bg-zinc-500/10 text-zinc-400 px-1.5 py-0.5 rounded">
                              usr_{rep.user_hash}
                            </span>
                            <span>{getTimeAgo(rep.created_at)}</span>
                          </div>
                          <p className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}>
                            {rep.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 italic">No signals on this frequency. Drop a reply!</div>
                  )}

                  {/* Reply Input Field */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyInputValue}
                      onChange={(e) => setReplyInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply(post.id)}
                      placeholder="Write anonymous reply..."
                      className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                    <button
                      onClick={() => handleSendReply(post.id)}
                      disabled={replySubmitting || !replyInputValue.trim()}
                      className="px-3 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 active:scale-95 transition-all"
                    >
                      {replySubmitting ? '...' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}

              <ProgressBar percentage={getProgressPercentage(post.created_at)} color="blue" />
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
            <p className="animate-breathing text-sm">Quiet here right now.</p>
          </div>
        )}
      </div>

      {/* GPS Accuracy Warning */}
      {hasWeakGPS && (
        <div className={`mt-4 p-3 rounded-xl border text-xs ${
          theme === 'dark'
            ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
            : 'bg-amber-500/10 border-amber-400/30 text-amber-700'
        }`}>
          ⚡ GPS signal weak — some features limited
        </div>
      )}

      {/* Input */}
      <div className={`flex gap-2 pt-4 border-t ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Drop a signal..."
          className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500/50'
              : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-blue-500/50'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !inputValue.trim()}
          className={`px-4 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            inputValue.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/20'
              : theme === 'dark'
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Sending...' : 'Drop'}
        </button>
      </div>

    </div>
  )
}
