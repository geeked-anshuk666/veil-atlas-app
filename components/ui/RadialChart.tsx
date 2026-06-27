'use client'

import { useEffect, useState } from 'react'

interface RadialChartProps {
  hourlyData: Array<{
    hour: number
    count: number
  }>
}

export default function RadialChart({ hourlyData }: RadialChartProps) {
  const [currentHour, setCurrentHour] = useState(0)

  useEffect(() => {
    setCurrentHour(new Date().getHours())
  }, [])

  const maxCount = Math.max(...hourlyData.map((h) => h.count), 1)
  const centerX = 120
  const centerY = 120
  const radius = 100

  // Create 24 segments in a circle
  const segments = hourlyData.map((data) => {
    const angle = (data.hour * 360) / 24 - 90 // Start from top
    const rad = (angle * Math.PI) / 180

    // Inner and outer radius
    const inner = 30
    const outer = radius

    // Activity opacity
    const opacity = Math.min(1, data.count / maxCount)

    // Segment width
    const segmentWidth = 360 / 24 / 2

    return {
      ...data,
      angle,
      rad,
      inner,
      outer,
      opacity,
      segmentWidth,
    }
  })

  const svgWidth = 240
  const svgHeight = 240

  return (
    <div className="flex justify-center py-4">
      <div className="relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="drop-shadow-lg"
        >
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#3f3f3f"
            strokeWidth={1}
          />

          {/* Inner circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={30}
            fill="none"
            stroke="#3f3f3f"
            strokeWidth={1}
          />

          {/* Segments */}
          {segments.map((seg) => {
            const x1 = centerX + seg.inner * Math.cos(seg.rad)
            const y1 = centerY + seg.inner * Math.sin(seg.rad)
            const x2 = centerX + seg.outer * Math.cos(seg.rad)
            const y2 = centerY + seg.outer * Math.sin(seg.rad)

            // Segment wedge
            const nextAngle = ((seg.hour + 1) * 360) / 24 - 90
            const nextRad = (nextAngle * Math.PI) / 180
            const x3 = centerX + seg.outer * Math.cos(nextRad)
            const y3 = centerY + seg.outer * Math.sin(nextRad)
            const x4 = centerX + seg.inner * Math.cos(nextRad)
            const y4 = centerY + seg.inner * Math.sin(nextRad)

            const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${seg.outer} ${seg.outer} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${seg.inner} ${seg.inner} 0 0 0 ${x1} ${y1}`

            return (
              <path
                key={seg.hour}
                d={pathData}
                fill={`rgba(34, 197, 94, ${seg.opacity})`}
                stroke="none"
              />
            )
          })}

          {/* Current hour marker (white dot) */}
          {segments[currentHour] && (
            <circle
              cx={
                centerX +
                (radius + 5) *
                  Math.cos(
                    ((currentHour * 360) / 24 - 90) * (Math.PI / 180)
                  )
              }
              cy={
                centerY +
                (radius + 5) *
                  Math.sin(
                    ((currentHour * 360) / 24 - 90) * (Math.PI / 180)
                  )
              }
              r={4}
              fill="white"
              stroke="#22c55e"
              strokeWidth={2}
            />
          )}

          {/* Hour labels (every 6 hours) */}
          {[0, 6, 12, 18].map((hour) => {
            const angle = (hour * 360) / 24 - 90
            const rad = (angle * Math.PI) / 180
            const x = centerX + (radius + 20) * Math.cos(rad)
            const y = centerY + (radius + 20) * Math.sin(rad)

            return (
              <text
                key={`label-${hour}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#999"
                className="pointer-events-none"
              >
                {String(hour).padStart(2, '0')}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
