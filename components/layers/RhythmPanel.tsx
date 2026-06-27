'use client'

import { useEffect, useState } from 'react'
import RadialChart from '../ui/RadialChart'
import HeatmapGrid from '../ui/HeatmapGrid'

interface RhythmData {
  hourly: Array<{
    hour: number
    count: number
  }>
  weekly: Array<{
    day: number
    morning: number
    afternoon: number
    evening: number
  }>
}

interface RhythmPanelProps {
  userLocation: [number, number] | null
}

export default function RhythmPanel({ userLocation }: RhythmPanelProps) {
  const [data, setData] = useState<RhythmData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLocation) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/rhythm?lat=${userLocation[1]}&lng=${userLocation[0]}`
        )
        const rhythmData = await response.json()
        setData(rhythmData)
      } catch (error) {
        console.error('[v0] Error fetching rhythm data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userLocation])

  // Find busiest time of week
  const getMostAliveTime = () => {
    if (!data) return 'unknown'
    let maxCount = 0
    let maxDay = 0
    let maxPeriod = 'morning'

    data.weekly.forEach((week) => {
      if (week.morning > maxCount) {
        maxCount = week.morning
        maxDay = week.day
        maxPeriod = 'morning'
      }
      if (week.afternoon > maxCount) {
        maxCount = week.afternoon
        maxDay = week.day
        maxPeriod = 'afternoon'
      }
      if (week.evening > maxCount) {
        maxCount = week.evening
        maxDay = week.day
        maxPeriod = 'evening'
      }
    })

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return `${dayNames[maxDay]} ${maxPeriod}s`
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
      <h2 className="text-xs font-medium text-gray-400">when this place breathes</h2>

      {/* Radial chart */}
      {data && <RadialChart hourlyData={data.hourly} />}

      {/* Insight */}
      <div className="text-center text-sm text-green-400">
        most alive: {getMostAliveTime()}
      </div>

      {/* Alert banner */}
      <div className="bg-amber-900 bg-opacity-30 border border-amber-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚡</span>
          <div className="text-sm text-amber-300">
            Shifting since March — something is changing here
          </div>
        </div>
      </div>

      {/* Heatmap */}
      {data && <HeatmapGrid weeklyData={data.weekly} />}
    </div>
  )
}
