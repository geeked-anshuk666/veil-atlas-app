'use client'

import { useState } from 'react'

interface IncidentModalProps {
  types: string[]
  onSubmit: (type: string, timeOfDay: string) => void
  onClose: () => void
}

const timeOfDayOptions = ['morning', 'afternoon', 'evening', 'night']

export default function IncidentModal({
  types,
  onSubmit,
  onClose,
}: IncidentModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedType || !selectedTime) return

    setSubmitting(true)
    try {
      await onSubmit(selectedType, selectedTime)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full bg-[#1a1a1a] rounded-t-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            document an incident
          </h3>
          <p className="text-sm text-gray-400">
            Your report helps keep this community safe
          </p>
        </div>

        {/* Incident type selector */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-3">
            What happened?
          </label>
          <div className="space-y-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedType === type
                    ? 'border-red-500 bg-red-900 bg-opacity-20 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Time of day selector */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-3">
            When?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeOfDayOptions.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                  selectedTime === time
                    ? 'border-red-500 bg-red-900 bg-opacity-20 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType || !selectedTime || submitting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
