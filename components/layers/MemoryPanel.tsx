'use client'

import { useEffect, useState } from 'react'

interface Memory {
  id: string
  content: string
  year_label: string
  created_at: string
}

interface Echo {
  echoes: Array<{
    id: string
    content: string
    for_whom?: string
  }>
  hint_count: number
}

interface MemoryPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
}

export default function MemoryPanel({ userLocation, selectedLocation, userId }: MemoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [echoData, setEchoData] = useState<Echo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewMemory, setShowNewMemory] = useState(false)
  const [showNewEcho, setShowNewEcho] = useState(false)
  const [memoryText, setMemoryText] = useState('')
  const [memoryYear, setMemoryYear] = useState('')
  const [echoText, setEchoText] = useState('')
  const [echoFor, setEchoFor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const targetLocation = selectedLocation || userLocation

  useEffect(() => {
    if (!targetLocation) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [memRes, echoRes] = await Promise.all([
          fetch(`/api/memory?lat=${targetLocation[0]}&lng=${targetLocation[1]}`),
          fetch(`/api/echo?lat=${targetLocation[0]}&lng=${targetLocation[1]}`),
        ])
        const memData = await memRes.json()
        const echData = await echoRes.json()
        setMemories(memData)
        setEchoData(echData)
      } catch (error) {
        console.error('[v0] Error fetching memory data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedLocation, userLocation])

  const handleSubmitMemory = async () => {
    if (!memoryText.trim() || !userLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[0],
          lng: userLocation[1],
          content: memoryText,
          year_label: memoryYear || 'unknown',
          user_id: userId,
        }),
      })
      setMemoryText('')
      setMemoryYear('')
      setShowNewMemory(false)
      // Refetch
      const res = await fetch(
        `/api/memory?lat=${targetLocation![0]}&lng=${targetLocation![1]}`
      )
      const data = await res.json()
      setMemories(data)
    } catch (error) {
      console.error('[v0] Error submitting memory:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEcho = async () => {
    if (!echoText.trim() || !userLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[0],
          lng: userLocation[1],
          content: echoText,
          for_whom: echoFor || undefined,
        }),
      })
      setEchoText('')
      setEchoFor('')
      setShowNewEcho(false)
      // Refetch
      const res = await fetch(
        `/api/echo?lat=${targetLocation![0]}&lng=${targetLocation![1]}`
      )
      const data = await res.json()
      setEchoData(data)
    } catch (error) {
      console.error('[v0] Error submitting echo:', error)
    } finally {
      setSubmitting(false)
    }
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
      <h2 className="text-xs font-medium text-gray-400">layers of time</h2>

      {/* Memories */}
      <div className="space-y-3">
        {memories.map((mem) => (
          <div key={mem.id} className="bg-[#2a2a2a] rounded-lg p-4 space-y-2">
            <div className="inline-block bg-purple-900 text-purple-300 text-xs font-semibold px-2 py-1 rounded">
              {mem.year_label}
            </div>
            <p className="text-sm text-white leading-relaxed">{mem.content}</p>
            <p className="text-xs text-gray-500">shared by someone who was here</p>
          </div>
        ))}
      </div>

      {/* Echo section */}
      {echoData && (
        <div className="bg-gradient-to-b from-transparent to-purple-900 to-opacity-10 rounded-lg p-4 border border-purple-900 border-opacity-50 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-lg">🔒</div>
            <div className="text-sm text-gray-300">
              {echoData.echoes.length > 0
                ? `${echoData.echoes.length} echo revealed`
                : `${echoData.hint_count} echo buried here`}
            </div>
          </div>
          {echoData.echoes.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              stand closer to reveal it
            </p>
          )}
          {echoData.echoes.map((echo) => (
            <div key={echo.id} className="text-sm text-white leading-relaxed">
              {echo.content}
              {echo.for_whom && (
                <div className="text-xs text-gray-500 mt-1">for: {echo.for_whom}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add memory button */}
      {!showNewMemory ? (
        <button
          onClick={() => setShowNewMemory(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition-colors font-medium"
        >
          + add a memory
        </button>
      ) : (
        <div className="space-y-2 bg-[#2a2a2a] p-4 rounded-lg">
          <textarea
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            placeholder="what was this place like..."
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none h-20"
          />
          <input
            type="text"
            value={memoryYear}
            onChange={(e) => setMemoryYear(e.target.value)}
            placeholder="year (optional)"
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNewMemory(false)
                setMemoryText('')
                setMemoryYear('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitMemory}
              disabled={submitting || !memoryText.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Add echo button */}
      {!showNewEcho ? (
        <button
          onClick={() => setShowNewEcho(true)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
        >
          + leave an echo
        </button>
      ) : (
        <div className="space-y-2 bg-[#2a2a2a] p-4 rounded-lg">
          <textarea
            value={echoText}
            onChange={(e) => setEchoText(e.target.value)}
            placeholder="your message..."
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none h-16"
          />
          <input
            type="text"
            value={echoFor}
            onChange={(e) => setEchoFor(e.target.value)}
            placeholder="for whom? (optional)"
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNewEcho(false)
                setEchoText('')
                setEchoFor('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitEcho}
              disabled={submitting || !echoText.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
