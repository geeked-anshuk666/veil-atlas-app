interface HeatmapGridProps {
  weeklyData: Array<{
    day: number
    morning: number
    afternoon: number
    evening: number
  }>
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeLabels = ['Morning', 'Afternoon', 'Evening']

export default function HeatmapGrid({ weeklyData }: HeatmapGridProps) {
  // Find max value for opacity calculation
  const maxValue = Math.max(
    ...weeklyData.flatMap((d) => [d.morning, d.afternoon, d.evening]),
    1
  )

  const getOpacity = (value: number) => {
    return Math.min(1, value / maxValue)
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header with time labels */}
        <div className="flex gap-2 mb-2">
          <div className="w-14" /> {/* Space for day labels */}
          {timeLabels.map((label) => (
            <div
              key={label}
              className="w-16 text-xs text-center text-gray-400 font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {dayLabels.map((day, dayIndex) => (
          <div key={day} className="flex gap-2 mb-2 items-center">
            <div className="w-14 text-xs text-gray-500 font-medium">{day}</div>
            {weeklyData[dayIndex] && (
              <>
                <div
                  className="w-16 h-12 rounded-lg transition-opacity duration-300"
                  style={{
                    backgroundColor: `rgba(34, 197, 94, ${getOpacity(weeklyData[dayIndex].morning)})`,
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                  }}
                  title={`Morning: ${weeklyData[dayIndex].morning}`}
                />
                <div
                  className="w-16 h-12 rounded-lg transition-opacity duration-300"
                  style={{
                    backgroundColor: `rgba(34, 197, 94, ${getOpacity(weeklyData[dayIndex].afternoon)})`,
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                  }}
                  title={`Afternoon: ${weeklyData[dayIndex].afternoon}`}
                />
                <div
                  className="w-16 h-12 rounded-lg transition-opacity duration-300"
                  style={{
                    backgroundColor: `rgba(34, 197, 94, ${getOpacity(weeklyData[dayIndex].evening)})`,
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                  }}
                  title={`Evening: ${weeklyData[dayIndex].evening}`}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
