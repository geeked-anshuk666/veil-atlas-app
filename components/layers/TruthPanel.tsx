'use client'

import { useEffect, useState } from 'react'
import IncidentModal from '../ui/IncidentModal'

interface TruthData {
  total: number
  breakdown: Array<{
    type: string
    count: number
  }>
}

interface TruthPanelProps {
  userLocation: [number, number] | null
  userId: string
}

const incidentTypes = [
  'Service refusal',
  'Felt unsafe',
  'Being followed',
  'Exclusion',
]

export default function TruthPanel({ userLocation, userId }: TruthPanelProps) {
  const [data, setData] = useState<TruthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!userLocation) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/truth?lat=${userLocation[1]}&lng=${userLocation[0]}`
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
  }, [userLocation])

  const handleSubmitIncident = async (
    type: string,
    timeOfDay: string
  ) => {
    if (!userLocation) return

    try {
      await fetch('/api/truth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation[1],
          lng: userLocation[0],
          incident_type: type,
          time_of_day: timeOfDay,
          user_id: userId,
        }),
      })
      setShowModal(false)
      // Refetch
      const response = await fetch(
        `/api/truth?lat=${userLocation[1]}&lng=${userLocation[0]}`
      )
      const truthData = await response.json()
      setData(truthData)
    } catch (error) {
      console.error('[v0] Error submitting incident:', error)
    }
  }

  const getMaxCount = (breakdown: TruthData['breakdown']) => {
    return Math.max(...breakdown.map((b) => b.count), 1)
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
      <h2 className="text-xs font-medium text-gray-400">documented nearby</h2>

      {/* Incident count badge */}
      <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-400">{data?.total || 0}</div>
        <div className="text-xs text-gray-400">incidents in the past year</div>
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
                  <span className="text-gray-400">{item.type}</span>
                  <span className="text-gray-500">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Note */}
      <div className="text-xs text-gray-500 italic px-3 py-2 bg-gray-900 rounded">
        All data anonymized and aggregated. Individual reports are never shown.
      </div>

      {/* Action button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors font-medium"
      >
        document an incident
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
