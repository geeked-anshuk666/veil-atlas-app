'use client'

import { useTheme } from '@/lib/theme-context'

interface LocationGatingProps {
  isGeolocating: boolean
  hasLocationPermission: boolean
  onRequestLocation: () => void
  onExploreWithoutLocation: () => void
}

export default function LocationGating({
  isGeolocating,
  hasLocationPermission,
  onRequestLocation,
  onExploreWithoutLocation,
}: LocationGatingProps) {
  const { theme } = useTheme()

  if (!hasLocationPermission) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        style={{
          background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }}
      >
        <div className={`max-w-md mx-4 p-8 rounded-2xl text-center ${
          theme === 'dark'
            ? 'bg-black/70 border border-white/10'
            : 'bg-white/70 border border-black/10'
        }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="mb-6">
            <div className="text-4xl mb-4">📍</div>
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Veil Atlas needs your location
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              to reveal the city's invisible layers
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onRequestLocation}
              disabled={isGeolocating}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isGeolocating ? 'Locating...' : 'Allow location'}
            </button>
            <button
              onClick={onExploreWithoutLocation}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 border ${
                theme === 'dark'
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-black/20 text-black hover:bg-black/10'
              }`}
            >
              Explore without location
            </button>
          </div>

          <p className={`text-xs mt-6 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            We respect your privacy. Your location stays on your device.
          </p>
        </div>
      </div>
    )
  }

  return null
}
