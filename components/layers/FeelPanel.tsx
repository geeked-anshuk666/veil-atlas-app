'use client'

import { useEffect, useState } from 'react'

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
  const [feel, setFeel] = useState<FeelData | null>(null)
  const [confession, setConfession] = useState<ConfessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewConfession, setShowNewConfession] = useState(false)
  const [newConfessionText, setNewConfessionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        setConfession(confessionData)
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
      setConfession(data)
    } catch (error) {
      console.error('[v0] Error submitting confession:', error)
    } finally {
      setSubmitting(false)
    }
  }


  const getMonthsAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const months = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    if (months === 0) return 'today'
    if (months === 1) return '1 month ago'
    return `${months} months ago`
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-12 bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h2 className="text-xs font-medium text-gray-400 mb-4">the feeling here</h2>
        <div className="text-4xl font-bold text-amber-400 text-center py-6">
          {feel?.dominant_emotion || 'neutral'}
        </div>
      </div>

      {/* Emotion buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {emotions.map(({ emoji, label, value }) => (
          <button
            key={value}
            onClick={() => handleEmotion(value)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs text-gray-400">{label}</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-700" />

      {/* Confession */}
      <div>
        {confession ? (
          <div className="italic text-gray-300 text-sm leading-relaxed mb-2">
            &quot;{confession.content}&quot;
          </div>
        ) : (
          <div className="italic text-gray-500 text-sm mb-2">
            No confessions pinned here yet...
          </div>
        )}
        {confession && (
          <div className="text-xs text-gray-500">
            pinned here {getMonthsAgo(confession.created_at)}
          </div>
        )}
      </div>

      {/* Input section */}
      {!showNewConfession ? (
        <button
          onClick={() => setShowNewConfession(true)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
        >
          + leave your feeling
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={newConfessionText}
            onChange={(e) => setNewConfessionText(e.target.value)}
            placeholder="your confession..."
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none h-20"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNewConfession(false)
                setNewConfessionText('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitConfession}
              disabled={submitting || !newConfessionText.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-black text-sm py-2 rounded-lg transition-colors font-medium"
            >
              Pin
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
