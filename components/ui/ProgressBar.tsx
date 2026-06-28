interface ProgressBarProps {
  percentage: number
  color: 'blue' | 'amber' | 'red' | 'purple' | 'green'
}

export default function ProgressBar({ percentage, color }: ProgressBarProps) {
  const colorMap = {
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
  }

  return (
    <div className="w-full h-0.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorMap[color]} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
