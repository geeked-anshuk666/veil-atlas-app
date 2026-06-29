'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import type { Memory, Echo } from '@/types'

interface MemoryPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
  selectedPinId?: string | null
  onCardSelect?: (lat: number, lng: number, pinId: string) => void
  onRefreshMapData?: () => void


}

export default function MemoryPanel({ userLocation, selectedLocation, userId, selectedPinId, onCardSelect, onRefreshMapData }: MemoryPanelProps) {


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
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editYear, setEditYear] = useState('')

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

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Reset pagination when location changes
  useEffect(() => {
    setPage(1)
    setHasMore(true)
  }, [selectedLocation, userLocation])

  useEffect(() => {
    if (!targetLocation) return

    const fetchData = async () => {
      try {
        if (page === 1) {
          setLoading(true)
          const echoRes = await fetch(`/api/echo?lat=${targetLocation[0]}&lng=${targetLocation[1]}`)
          const echData = await echoRes.json()
          setEchoData(echData && echData.id ? echData : null)
        } else {
          setLoadingMore(true)
        }

        const memRes = await fetch(
          `/api/memory?lat=${targetLocation[0]}&lng=${targetLocation[1]}&user_id=${encodeURIComponent(userId)}&page=${page}&limit=10`
        )
        const memData = await memRes.json()
        const memList = Array.isArray(memData) ? memData : []

        if (page === 1) {
          setMemories(memList)
        } else {
          setMemories((prev) => [...prev, ...memList])
        }

        if (memList.length < 10) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
      } catch (error) {
        console.error('[v0] Error fetching memory data:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }

    fetchData()
  }, [selectedLocation, userLocation, page])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((p) => p + 1)
    }
  }


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
        `/api/memory?lat=${targetLocation[0]}&lng=${targetLocation[1]}&user_id=${encodeURIComponent(userId)}`
      )
      const data = await res.json()
      setMemories(Array.isArray(data) ? data : [])
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting memory:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory?id=${id}&user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      setMemories((prev) => prev.filter((m) => m.id !== id))
      onRefreshMapData?.()
    } catch (e) {
      console.error('Failed to delete memory:', e)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: userId, content: editText, year_label: editYear }),
      })
      setMemories((prev) => prev.map((m) => m.id === id ? { ...m, content: editText, year_label: editYear } : m))
      setEditingMemoryId(null)
    } catch (e) {
      console.error('Failed to edit memory:', e)
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
      setEchoData(data && data.id ? data : null)

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
    return !!(echo as any).unlocked
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `~${(meters / 1000).toFixed(1)} km`
    return `~${Math.round(meters)}m`
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
        {echoData && (echoData as any).id ? (

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
                      A voice was whispered here. Get within <strong>50m</strong> to unlock. (Currently {formatDistance(dist)} away)
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
            {memories.map((mem) => {
              const isSelected = mem.id === selectedPinId
              return (
                <div
                  key={mem.id}
                  id={`card-${mem.id}`}
                  onClick={() => editingMemoryId !== mem.id && onCardSelect?.(mem.lat, mem.lng, mem.id)}
                  className={`rounded-2xl p-4 border border-l-2 transition-all duration-300 cursor-pointer hover:bg-zinc-900/60 ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-purple-500/10 border-purple-500 text-zinc-100 scale-[1.02]'
                        : 'bg-purple-50/50 border-purple-500 text-zinc-800 scale-[1.02]'
                      : theme === 'dark'
                        ? 'bg-zinc-950/40 border-zinc-900 border-l-purple-500 text-zinc-200'
                        : 'bg-white border-zinc-200 border-l-purple-500 text-zinc-700'
                  }`}
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: isSelected ? '0 0 15px rgba(168, 85, 247, 0.4)' : undefined
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-extrabold tracking-wider bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full uppercase">
                      Year: {mem.year_label}
                    </span>
                    {(mem as any).is_mine && editingMemoryId !== mem.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingMemoryId(mem.id); setEditText(mem.content); setEditYear(mem.year_label || '') }}
                          className="text-[10px] uppercase font-bold tracking-wider text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          ✏ edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMemory(mem.id) }}
                          className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-400 transition-colors"
                        >
                          🗑 delete
                        </button>
                      </div>
                    )}
                  </div>
                  {editingMemoryId === mem.id ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        placeholder="Year"
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none resize-none h-20 ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(mem.id)} className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded-lg font-bold">Save</button>
                        <button onClick={() => setEditingMemoryId(null)} className="flex-1 border text-xs py-1.5 rounded-lg font-semibold border-zinc-700 text-zinc-400">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{mem.content}</p>
                  )}
                </div>
              )
            })}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] mt-2 ${
                  theme === 'dark'
                    ? 'border-zinc-900 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {loadingMore ? 'Retrieving memories...' : 'Load More Memories'}
              </button>
            )}
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
