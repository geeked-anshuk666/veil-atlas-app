'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import ProgressBar from '../ui/ProgressBar'

interface NowPost {
  id: string
  content: string
  lat: number
  lng: number
  created_at: string | number
  user_hash: string
}

interface NowPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
  gpsAccuracy?: number
  selectedPinId?: string | null
  onCardSelect?: (lat: number, lng: number, pinId: string) => void
  onRefreshMapData?: () => void
}

export default function NowPanel({
  userLocation,
  selectedLocation,
  userId,
  gpsAccuracy,
  selectedPinId,
  onCardSelect,
  onRefreshMapData,
}: NowPanelProps) {
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

  // Auto-scroll + highlight when pin selected from map
  useEffect(() => {
    if (selectedPinId) {
      const element = document.getElementById(`card-${selectedPinId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedPinId])

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Reset page when user location changes
  useEffect(() => {
    setPage(1)
    setHasMore(true)
  }, [userLocation])

  // Fetch posts when page or location changes
  useEffect(() => {
    if (!userLocation) return

    const fetchPosts = async () => {
      try {
        if (page === 1) setLoading(true)
        else setLoadingMore(true)

        const response = await fetch(
          `/api/now?lat=${userLocation[0]}&lng=${userLocation[1]}&page=${page}&limit=10&user_id=${encodeURIComponent(userId)}`
        )
        const data = await response.json()
        const postsList = Array.isArray(data) ? data : []
        
        if (page === 1) {
          setPosts(postsList)
        } else {
          setPosts((prev) => [...prev, ...postsList])
        }

        // If we got fewer than 10 posts, there are no more pages
        if (postsList.length < 10) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
      } catch (error) {
        console.error('[v0] Error fetching now posts:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }

    fetchPosts()
  }, [userLocation, page])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((p) => p + 1)
    }
  }

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
      setPage(1)
      setHasMore(true)
      const response = await fetch(
        `/api/now?lat=${userLocation[0]}&lng=${userLocation[1]}&page=1&limit=10&user_id=${encodeURIComponent(userId)}`
      )
      const data = await response.json()
      setPosts(Array.isArray(data) ? data : [])
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting post:', error)
    } finally {
      setSubmitting(false)
    }
  }


  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`/api/now?id=${postId}&user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      onRefreshMapData?.()
    } catch (e) {
      console.error('Failed to delete post:', e)
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
    const date = new Date(typeof dateStr === 'number' ? dateStr : dateStr)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const getProgressPercentage = (createdAt: string | number) => {
    const created = new Date(typeof createdAt === 'number' ? createdAt : createdAt).getTime()
    const elapsed = Date.now() - created
    return Math.max(0, Math.min(100, 100 - (elapsed / (30 * 60 * 1000)) * 100))
  }

  const getDistance = (lat: number, lng: number) => {
    if (!userLocation) return '?'
    const dLat = (lat - userLocation[0]) * 111
    const dLng = (lng - userLocation[1]) * 111 * Math.cos((lat * Math.PI) / 180)
    const m = Math.sqrt(dLat * dLat + dLng * dLng) * 1000
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
  }

  // Creator detection: the server stores base64(userId).slice(0,8) as user_hash
  const isMyPost = (post: NowPost) => {
    try {
      return post.user_hash === btoa(userId).slice(0, 8)
    } catch { return false }
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
      {/* Input — at the TOP as action first */}
      <div className={`flex gap-2 pb-2 border-b ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'}`}>
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
          {submitting ? '...' : 'Drop'}
        </button>
      </div>

      {/* Posts feed */}
      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
        {loading && !posts.length ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 border animate-pulse ${
                theme === 'dark' ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white/40 border-zinc-200'
              }`}
            >
              <div className={`h-3 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded mb-3`} />
              <div className={`h-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-2/3`} />
            </div>
          ))
        ) : posts.length > 0 ? (
          <>
            {posts.map((post, idx) => {
            const isSelected = post.id === selectedPinId
            const isMine = isMyPost(post)
            return (
              <div
                key={post.id}
                id={`card-${post.id}`}
                onClick={() => onCardSelect?.(post.lat, post.lng, post.id)}
                className={`rounded-2xl p-4 space-y-2.5 border border-l-2 transition-all duration-300 cursor-pointer animate-slideUp ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-blue-500/10 border-blue-500 text-zinc-100 scale-[1.02]'
                      : 'bg-blue-50/50 border-blue-500 text-zinc-800 scale-[1.02]'
                    : theme === 'dark'
                      ? 'bg-zinc-950/40 border-zinc-900 border-l-blue-500 text-zinc-100 hover:border-blue-500/50'
                      : 'bg-white border-zinc-200 border-l-blue-500 text-zinc-800 hover:border-blue-500/50'
                }`}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.4)' : undefined,
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {isMine ? '✦ My Signal' : 'Signal'}
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
                  <div className="flex items-center gap-2">
                    {isMine && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }}
                        className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-400 transition-colors"
                      >
                        🗑 delete
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleReplies(post.id) }}
                      className={`text-[10px] uppercase font-bold tracking-wider hover:underline transition-all ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      💬 {expandedPostId === post.id ? 'Close' : 'Discuss'}
                    </button>
                  </div>
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
            )})}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${
                  theme === 'dark'
                    ? 'border-zinc-900 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {loadingMore ? 'Retrieving signals...' : 'Load More Signals'}
              </button>
            )}
          </>
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
    </div>
  )
}
