'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import IncidentModal from '../ui/IncidentModal'

interface IncidentItem {
  id: string
  type: string
  time_of_day: string
  created_at: string
  distance: number
}

interface TruthData {
  total: number
  breakdown: Array<{
    type: string
    count: number
  }>
  list?: IncidentItem[]
}

interface TruthPanelProps {
  userLocation: [number, number] | null
  selectedLocation: [number, number] | null
  userId: string
  selectedPinId?: string | null
  onCardSelect?: (lat: number, lng: number, pinId: string) => void
  onRefreshMapData?: () => void


}

const incidentTypes = [
  'Service refusal',
  'Felt unsafe',
  'Being followed',
  'Exclusion',
]

export default function TruthPanel({ userLocation, selectedLocation, userId, selectedPinId, onCardSelect, onRefreshMapData }: TruthPanelProps) {


  const { theme } = useTheme()
  const [data, setData] = useState<TruthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
        const response = await fetch(
          `/api/truth?lat=${targetLocation[0]}&lng=${targetLocation[1]}`
        )
        const truthData = await response.json()
        setData(truthData)
      } catch (error) {
        console.error('[v0] Error fetching truth data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedLocation, userLocation])

  const handleSubmitIncident = async (
    type: string,
    timeOfDay: string
  ) => {
    if (!targetLocation) return

    try {
      await fetch('/api/truth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLocation[0],
          lng: targetLocation[1],
          incident_type: type,
          time_of_day: timeOfDay,
          user_id: userId,
        }),
      })
      setShowModal(false)
      // Refetch
      const response = await fetch(
        `/api/truth?lat=${targetLocation[0]}&lng=${targetLocation[1]}`
      )
      const truthData = await response.json()
      setData(truthData)
      onRefreshMapData?.()
    } catch (error) {
      console.error('[v0] Error submitting incident:', error)
    }
  }


  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return 'today'
    if (diffDays === 2) return 'yesterday'
    return `${diffDays} days ago`
  }

  const getMaxCount = (breakdown: TruthData['breakdown']) => {
    return Math.max(...breakdown.map((b) => b.count), 1)
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
      <div className="flex justify-between items-center">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          👁 documented nearby
        </h2>
      </div>

      {/* Incident count badge */}
      <div className={`p-5 rounded-2xl text-center border transition-all ${
        theme === 'dark'
          ? 'bg-red-500/5 border-red-500/10'
          : 'bg-red-500/5 border-red-500/20'
      }`}>
        <div className="text-5xl font-extrabold text-red-500 tracking-tight">{data?.total || 0}</div>
        <div className={`text-xs mt-1.5 font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
          incidents logged within 800m
        </div>
      </div>

      {/* Breakdown */}
      {data && data.breakdown.length > 0 && (
        <div className="space-y-3">
          {data.breakdown.map((item) => {
            const maxCount = getMaxCount(data.breakdown)
            const percentage = (item.count / maxCount) * 100

            return (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>{item.type}</span>
                  <span className="font-semibold text-red-500">{item.count}</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Chronological Incident Log */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Recent Incident Log
        </h3>
        {data?.list && data.list.length > 0 ? (
          <div className="space-y-2.5">
            {data.list.map((item) => {
              const isSelected = item.id === selectedPinId
                  const formatDistance = (meters: number) => {
                    if (meters >= 1000) return `~${(meters / 1000).toFixed(1)} km`
                    return `~${Math.round(meters)}m`
                  }
                  return (
                    <div 
                      key={item.id}
                      id={`card-${item.id}`}
                      onClick={() => onCardSelect?.(item.lat, item.lng, item.id)}
                      className={`rounded-xl p-4 border border-l-2 transition-all duration-300 cursor-pointer hover:bg-zinc-900/60 ${
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-red-500/10 border-red-500 text-zinc-100 scale-[1.02]'
                            : 'bg-red-50/50 border-red-500 text-zinc-800 scale-[1.02]'
                          : theme === 'dark'
                            ? 'bg-zinc-950/40 border-zinc-900 border-l-red-500 hover:border-zinc-800 hover:border-l-red-500'
                            : 'bg-white border-zinc-200 border-l-red-500 hover:border-zinc-300 hover:border-l-red-500'
                      }`}
                      style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.4)' : undefined
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                          {item.type}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {item.time_of_day}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 text-xs text-zinc-500 font-medium">
                        <span>{formatDistance(item.distance)} away</span>
                        <span>·</span>
                        <span>{getRelativeTime(item.created_at)}</span>
                      </div>
                    </div>
                  )

            })}


          </div>
        ) : (
          <div className={`text-center py-6 text-sm border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-600'
          }`}>
            No incidents reported here this year.
          </div>
        )}
      </div>

      {/* Note */}
      <div className={`text-[10px] leading-relaxed rounded-xl p-3 border ${
        theme === 'dark' 
          ? 'bg-zinc-950/20 border-zinc-900 text-zinc-500' 
          : 'bg-zinc-50 border-zinc-200 text-zinc-600'
      }`}>
        🛡️ <strong>Privacy Protection:</strong> All records are anonymized, hashed, and aggregated geographically. Specific location coordinates and contributor hashes are never exposed.
      </div>

      {/* Action button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-3.5 rounded-xl transition-all font-semibold shadow-lg shadow-red-600/10 active:scale-[0.98]"
      >
        Document an Incident
      </button>

      {/* Modal */}
      {showModal && (
        <IncidentModal
          types={incidentTypes}
          onSubmit={handleSubmitIncident}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
