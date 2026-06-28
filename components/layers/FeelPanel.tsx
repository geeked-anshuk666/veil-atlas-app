'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

interface FeelPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
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
  created_at: string
}

export default function FeelPanel({ userLocation, selectedLocation, userId }: FeelPanelProps) {
  const { theme } = useTheme()
  const [feel, setFeel] = useState<FeelData | null>(null)
  const [confessions, setConfessions] = useState<ConfessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewConfession, setShowNewConfession] = useState(false)
  const [newConfessionText, setNewConfessionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeUserEmotion, setActiveUserEmotion] = useState<string | null>(null)

  const targetLocation = selectedLocation || userLocation

  useEffect(() => {
    if (!targetLocation) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [feelRes, confessionRes] = await Promise.all([
          fetch(`/api/feel?lat=${targetLocation[0]}&lng=${targetLocation[1]}`),
          fetch(`/api/feel/pins?lat=${targetLocation[0]}&lng=${targetLocation[1]}`),
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
    if (!userLocation) return
    setActiveUserEmotion(emotion)

    try {
      await fetch('/api/feel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[0],
          lng: userLocation[1],
          emotion,
          user_id: userId,
        }),
      })
      // Refetch feel data
      const res = await fetch(`/api/feel?lat=${targetLocation![0]}&lng=${targetLocation![1]}`)
      const data = await res.json()
      setFeel(data)
    } catch (error) {
      console.error('[v0] Error submitting emotion:', error)
    }
  }

  const handleSubmitConfession = async () => {
    if (!newConfessionText.trim() || !userLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/feel/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[0],
          lng: userLocation[1],
          content: newConfessionText,
        }),
      })
      setNewConfessionText('')
      setShowNewConfession(false)
      // Refetch
      const res = await fetch(
        `/api/feel/pins?lat=${targetLocation![0]}&lng=${targetLocation![1]}`
      )
      const data = await res.json()
      setConfessions(data.pins || [])
    } catch (error) {
      console.error('[v0] Error submitting confession:', error)
    } finally {
      setSubmitting(false)
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
          const isActive = activeUserEmotion === value || feel?.dominant_emotion === value
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

      {/* Confessions */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Anonymous Confessions
        </h3>
        {confessions.length > 0 ? (
          <div className="space-y-3">
            {confessions.map((c) => (
              <div 
                key={c.id} 
                className={`rounded-2xl p-4 border border-l-2 italic text-sm leading-relaxed transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-950/40 border-zinc-900 border-l-amber-500 text-zinc-200'
                    : 'bg-white border-zinc-200 border-l-amber-500 text-zinc-700'
                }`}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                &ldquo;{c.content}&rdquo;
                <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase not-italic mt-3 text-right">
                  left here {getRelativeTime(c.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-6 text-sm border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-600'
          }`}>
            No confessions pinned here yet.
          </div>
        )}
      </div>

      {/* Input section */}
      {!showNewConfession ? (
        <button
          onClick={() => setShowNewConfession(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black text-sm py-3.5 rounded-xl transition-all font-bold shadow-lg shadow-amber-500/10 active:scale-[0.98]"
        >
          + leave your confession
        </button>
      ) : (
        <div className={`space-y-3 p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-zinc-950/50 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
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
              Pin Confession
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
