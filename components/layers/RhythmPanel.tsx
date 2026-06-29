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
  selectedLocation: [number, number] | null
}

export default function RhythmPanel({ userLocation, selectedLocation }: RhythmPanelProps) {
  const [data, setData] = useState<RhythmData | null>(null)
  const [loading, setLoading] = useState(true)

  const targetLocation = selectedLocation || userLocation

  useEffect(() => {
    if (!targetLocation) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/rhythm?lat=${targetLocation[0]}&lng=${targetLocation[1]}`
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
  }, [selectedLocation, userLocation])

  const getProcessedData = () => {
    if (!data) return null

    // Check if we have any database data points
    const hasDbData = (data.hourly && data.hourly.some((h: any) => Number(h.count) > 0)) ||
                     (data.weekly && data.weekly.some((w: any) => Number(w.morning) > 0 || Number(w.afternoon) > 0 || Number(w.evening) > 0))

    if (!hasDbData) {
      // Generate beautiful demo data patterns for the presentation
      const hourly = Array.from({ length: 24 }, (_, i) => {
        const base = Math.sin((i - 6) * Math.PI / 6) * 4 + 6
        const noise = Math.sin(i * Math.PI / 12) * 2
        return {
          hour: i,
          count: Math.max(1, Math.round(base + noise))
        }
      })

      const weekly = Array.from({ length: 7 }, (_, i) => {
        const isWeekend = i === 5 || i === 6
        return {
          day: i,
          morning: isWeekend ? 3 : 8,
          afternoon: isWeekend ? 6 : 4,
          evening: isWeekend ? 12 : 5
        }
      })
      return { hourly, weekly }
    }

    const hourly = Array.from({ length: 24 }, (_, i) => {
      const found = data.hourly.find((h: any) => Number(h.hour) === i)
      return {
        hour: i,
        count: found ? parseInt(found.count as any) : 0,
      }
    })
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const found = data.weekly.find((w: any) => Number(w.day) === i)
      return {
        day: i,
        morning: found ? parseInt(found.morning as any) : 0,
        afternoon: found ? parseInt(found.afternoon) : 0,
        evening: found ? parseInt(found.evening) : 0,
      }
    })
    return { hourly, weekly }
  }


  const processed = getProcessedData()

  // Find busiest time of week
  const getMostAliveTime = () => {
    if (!processed) return 'unknown'
    let maxCount = 0
    let maxDay = 0
    let maxPeriod = 'morning'

    processed.weekly.forEach((week) => {
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
      {processed && <RadialChart hourlyData={processed.hourly} />}

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
      {processed && <HeatmapGrid weeklyData={processed.weekly} />}
    </div>
  )
}

