'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import type { Memory, Echo } from '@/types'

interface MemoryPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
  onRefreshMapData?: () => void
}

export default function MemoryPanel({ userLocation, selectedLocation, userId, onRefreshMapData }: MemoryPanelProps) {
  const { theme } = useTheme()
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
    if (!memoryText.trim() || !targetLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLocation[0],
          lng: targetLocation[1],
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
        `/api/memory?lat=${targetLocation[0]}&lng=${targetLocation[1]}`
      )
      const data = await res.json()
      setMemories(data)
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting memory:', error)
    } finally {
      setSubmitting(false)
    }
  }


  const handleSubmitEcho = async () => {
    if (!echoText.trim() || !targetLocation) return

    setSubmitting(true)
    try {
      await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLocation[0],
          lng: targetLocation[1],
          content: echoText,
          for_whom: echoFor || undefined,
        }),
      })
      setEchoText('')
      setEchoFor('')
      setShowNewEcho(false)
      // Refetch
      const res = await fetch(
        `/api/echo?lat=${targetLocation[0]}&lng=${targetLocation[1]}`
      )
      const data = await res.json()
      setEchoData(data)
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting echo:', error)
    } finally {
      setSubmitting(false)
    }

  }


  const getDistance = (lat: number, lng: number) => {
    if (!userLocation) return 9999
    const dLat = (lat - userLocation[0]) * 111
    const dLng = (lng - userLocation[1]) * 111 * Math.cos((lat * Math.PI) / 180)
    const km = Math.sqrt(dLat * dLat + dLng * dLng)
    return km * 1000 // returns meters
  }

  const isEchoUnlocked = (echo: Echo) => {
    const dist = getDistance(echo.lat, echo.lng)
    return dist <= 50 // Unlocks when within 50m
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-12 bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="h-24 bg-zinc-800/40 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h2 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
          🕰 layers of time
        </h2>
      </div>

      {/* Echoes Section */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Physical Echoes (Hidden Messages)
        </h3>
        {echoData ? (
          (() => {
            const unlocked = isEchoUnlocked(echoData)
            const dist = getDistance(echoData.lat, echoData.lng)
            return (
              <div 
                className={`rounded-2xl p-5 border transition-all ${
                  unlocked
                    ? theme === 'dark'
                      ? 'bg-purple-500/5 border-purple-500/20 text-purple-200'
                      : 'bg-purple-500/5 border-purple-500/30 text-purple-900 font-medium'
                    : theme === 'dark'
                      ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                }`}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {unlocked ? (
                  <div>
                    <div className="flex gap-2 items-center mb-2.5">
                      <span className="text-lg">🔓</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                        Echo Decrypted
                      </span>
                    </div>
                    <p className="text-sm italic leading-relaxed">&ldquo;{echoData.content}&rdquo;</p>
                    {echoData.for_whom && (
                      <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mt-3">
                        For: {echoData.for_whom}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-3xl filter grayscale select-none">🔒</div>
                    <div className="text-sm font-semibold text-zinc-400">Locked Echo Presence-Gated</div>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      A voice was whispered here. Get within <strong>50m</strong> to unlock. (Currently ~{Math.round(dist)}m away)
                    </p>
                  </div>
                )}
              </div>
            )
          })()
        ) : (
          <div className={`text-center py-6 text-sm border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-600'
          }`}>
            No echoes whispered here yet.
          </div>
        )}
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Collective Memories
        </h3>
        {memories.length > 0 ? (
          <div className="space-y-3">
            {memories.map((mem) => (
              <div 
                key={mem.id} 
                className={`rounded-2xl p-4 border border-l-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-950/40 border-zinc-900 border-l-purple-500 text-zinc-200'
                    : 'bg-white border-zinc-200 border-l-purple-500 text-zinc-700'
                }`}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-extrabold tracking-wider bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full uppercase">
                    Year: {mem.year_label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{mem.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-6 text-sm border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-600'
          }`}>
            No memories logged for this place yet.
          </div>
        )}
      </div>

      {/* Input Action Buttons */}
      <div className="space-y-3">
        {!showNewMemory && !showNewEcho ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowNewMemory(true)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-3.5 rounded-xl transition-all font-semibold shadow-lg shadow-purple-600/15 active:scale-[0.98]"
            >
              + add memory
            </button>
            <button
              onClick={() => setShowNewEcho(true)}
              className={`flex-1 border text-sm py-3.5 rounded-xl transition-all font-semibold active:scale-[0.98] ${
                theme === 'dark'
                  ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              + whisper echo
            </button>
          </div>
        ) : showNewMemory ? (
          <div className={`space-y-3 p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-zinc-950/50 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <input
              type="text"
              value={memoryYear}
              onChange={(e) => setMemoryYear(e.target.value)}
              placeholder="Year (e.g. 1998, 2012)"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-purple-500/50'
                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-purple-500/50'
              }`}
            />
            <textarea
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              placeholder="What happened here?"
              className={`w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none transition-all resize-none h-24 ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-purple-500/50'
                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-purple-500/50'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewMemory(false)
                  setMemoryText('')
                  setMemoryYear('')
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
                onClick={handleSubmitMemory}
                disabled={submitting || !memoryText.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm py-2.5 rounded-xl transition-all font-semibold active:scale-[0.98]"
              >
                Pin Memory
              </button>
            </div>
          </div>
        ) : (
          <div className={`space-y-3 p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-zinc-950/50 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <input
              type="text"
              value={echoFor}
              onChange={(e) => setEchoFor(e.target.value)}
              placeholder="Recipient name/initials (optional)"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-purple-500/50'
                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-purple-500/50'
              }`}
            />
            <textarea
              value={echoText}
              onChange={(e) => setEchoText(e.target.value)}
              placeholder="Whisper a secret message locked to this spot..."
              className={`w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none transition-all resize-none h-24 ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-purple-500/50'
                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-purple-500/50'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewEcho(false)
                  setEchoText('')
                  setEchoFor('')
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
                onClick={handleSubmitEcho}
                disabled={submitting || !echoText.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm py-2.5 rounded-xl transition-all font-semibold active:scale-[0.98]"
              >
                Whisper Echo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
