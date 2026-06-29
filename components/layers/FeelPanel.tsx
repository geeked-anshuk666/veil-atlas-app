'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

interface FeelPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
  selectedPinId?: string | null
  onCardSelect?: (lat: number, lng: number, pinId: string) => void
  onRefreshMapData?: () => void


}

const emotions = [
  { emoji: '🌊', label: 'Peaceful', value: 'peaceful' },
  { emoji: '☀️', label: 'Joyful', value: 'joyful' },
  { emoji: '⚡', label: 'Anxious', value: 'anxious' },
  { emoji: '🌧️', label: 'Melancholy', value: 'melancholy' },
  { emoji: '🔥', label: 'Alive', value: 'alive' },
]

interface FeelData {
  dominant_emotion: string
  record_count: number
}

interface ConfessionData {
  id: string
  content: string
  lat: number
  lng: number
  created_at: string
  distance_m?: number
  is_mine?: boolean
}


export default function FeelPanel({ userLocation, selectedLocation, userId, selectedPinId, onCardSelect, onRefreshMapData }: FeelPanelProps) {


  const { theme } = useTheme()
  const [feel, setFeel] = useState<FeelData | null>(null)
  const [confessions, setConfessions] = useState<ConfessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewConfession, setShowNewConfession] = useState(false)
  const [newConfessionText, setNewConfessionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeUserEmotion, setActiveUserEmotion] = useState<string | null>(null)

  const targetLocation = selectedLocation || userLocation

  // Auto-scroll when selected from map
  useEffect(() => {
    if (selectedPinId) {
      const element = document.getElementById(`card-${selectedPinId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedPinId])

  useEffect(() => {
    if (!targetLocation) return


    const fetchData = async () => {
      try {
        setLoading(true)
        const [feelRes, confessionRes] = await Promise.all([
          fetch(`/api/feel?lat=${targetLocation[0]}&lng=${targetLocation[1]}`),
          fetch(`/api/feel/pins?lat=${targetLocation[0]}&lng=${targetLocation[1]}&user_id=${encodeURIComponent(userId)}`),
        ])
        const feelData = await feelRes.json()
        const confessionData = await confessionRes.json()
        setFeel(feelData)
        // Adjust confessions mapping as API returns array
        setConfessions(confessionData.pins || [])
      } catch (error) {
        console.error('[v0] Error fetching feel data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedLocation, userLocation])

  const handleEmotion = async (emotion: string) => {
    if (!targetLocation) return
    setActiveUserEmotion(emotion)

    try {
      await fetch('/api/feel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLocation[0],
          lng: targetLocation[1],
          emotion,
          user_id: userId,
        }),
      })
      // Refetch feel data
      const res = await fetch(`/api/feel?lat=${targetLocation[0]}&lng=${targetLocation[1]}`)
      const data = await res.json()
      setFeel(data)
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting emotion:', error)
    }
  }



  const handleSubmitConfession = async () => {
    if (!newConfessionText.trim() || !targetLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/feel/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLocation[0],
          lng: targetLocation[1],
          content: newConfessionText,
        }),
      })
      setNewConfessionText('')
      setShowNewConfession(false)
      // Refetch
      const res = await fetch(
        `/api/feel/pins?lat=${targetLocation[0]}&lng=${targetLocation[1]}&user_id=${encodeURIComponent(userId)}`
      )
      const data = await res.json()
      setConfessions(data.pins || [])
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting confession:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfession = async (id: string) => {
    try {
      await fetch(`/api/feel/pins?id=${id}&user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      setConfessions((prev) => prev.filter((c) => c.id !== id))
      onRefreshMapData?.()
    } catch (e) {
      console.error('Failed to delete confession:', e)
    }
  }



  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffMinutes = Math.floor(diffTime / 60000)
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-12 bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="h-20 bg-zinc-800/40 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h2 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
          🌡 the feeling here
        </h2>
        <div className="text-5xl font-extrabold text-amber-400 text-center py-8 tracking-tight select-none animate-pulse-custom">
          {feel?.dominant_emotion || 'neutral'}
        </div>
        <p className="text-[10px] text-center text-zinc-500 font-semibold tracking-wide uppercase mt-1">
          dominant mood · past 7 days
        </p>
      </div>

      {/* Emotion selector */}
      <div className="grid grid-cols-5 gap-2.5 justify-center">
        {emotions.map(({ emoji, label, value }) => {
          const isActive = activeUserEmotion === value

          return (
            <button
              key={value}
              onClick={() => handleEmotion(value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 active:scale-95 border ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-700'
                  : theme === 'dark'
                    ? 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide truncate max-w-full">
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <div className={`h-px ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-200'}`} />

      {/* Confessions — action button FIRST, then list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Anonymous Confessions
          </h3>
          {!showNewConfession && (
            <button
              onClick={() => setShowNewConfession(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-xs px-3 py-1.5 rounded-lg transition-all font-bold active:scale-[0.98]"
            >
              + confess
            </button>
          )}
        </div>

        {/* Inline confession input */}
        {showNewConfession && (
          <div className={`space-y-3 p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-zinc-950/50 border-amber-500/30' : 'bg-amber-50 border-amber-300'
          }`}>
            <textarea
              value={newConfessionText}
              onChange={(e) => setNewConfessionText(e.target.value)}
              placeholder="Whisper a secret about this place..."
              className={`w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none transition-all resize-none h-24 ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-amber-500/50'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-amber-500/50'
              }`}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewConfession(false)
                  setNewConfessionText('')
                }}
                className={`flex-1 text-sm py-2.5 rounded-xl transition-all font-semibold border ${
                  theme === 'dark'
                    ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConfession}
                disabled={submitting || !newConfessionText.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-sm py-2.5 rounded-xl transition-all font-bold active:scale-[0.98]"
              >
                {submitting ? 'Pinning...' : 'Pin Confession'}
              </button>
            </div>
          </div>
        )}

        {confessions.length > 0 ? (
          <div className="space-y-3">
            {confessions.map((c) => {
              const isSelected = c.id === selectedPinId
              return (
                <div 
                  key={c.id} 
                  id={`card-${c.id}`}
                  onClick={() => onCardSelect?.(c.lat, c.lng, c.id)}
                  className={`rounded-2xl p-4 border border-l-2 italic text-sm leading-relaxed transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-amber-500/10 border-amber-500 text-zinc-100 scale-[1.02]'
                        : 'bg-amber-50/50 border-amber-500 text-zinc-800 scale-[1.02]'
                      : theme === 'dark'
                        ? 'bg-zinc-950/40 border-zinc-900 border-l-amber-500 text-zinc-200 hover:bg-zinc-900/60'
                        : 'bg-white border-zinc-200 border-l-amber-500 text-zinc-700 hover:bg-zinc-50'
                  }`}
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.4)' : undefined
                  }}
                >
                  {/* Full text — no truncation */}
                  &ldquo;{c.content}&rdquo;
                  <div className="flex justify-between items-center not-italic mt-3">
                    <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
                      left here {getRelativeTime(c.created_at)}
                      {c.distance_m !== undefined && (
                        <span className="ml-2 opacity-60">
                          · {c.distance_m >= 1000 ? `~${(c.distance_m / 1000).toFixed(1)}km` : `~${Math.round(c.distance_m)}m`} away
                        </span>
                      )}
                    </div>
                    {c.is_mine && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteConfession(c.id) }}
                        className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-400 transition-colors"
                      >
                        🗑 delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={`text-center py-6 text-sm border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-600'
          }`}>
            No confessions pinned here yet. Be the first.
          </div>
        )}
      </div>
    </div>
  )
}
