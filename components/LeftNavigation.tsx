'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'

const layers = [
  { id: 'now', icon: '⚡', label: 'Now', color: '#3b82f6' },
  { id: 'feel', icon: '🌡', label: 'Feel', color: '#f59e0b' },
  { id: 'truth', icon: '👁', label: 'Truth', color: '#ef4444' },
  { id: 'memory', icon: '🕰', label: 'Memory', color: '#a855f7' },
  { id: 'rhythm', icon: '〜', label: 'Rhythm', color: '#22c55e' },
] as const

interface LeftNavigationProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  onLayerChange: (layer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm') => void
}

export default function LeftNavigation({ activeLayer, onLayerChange }: LeftNavigationProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLayerClick = (layerId: string) => {
    onLayerChange(layerId as 'now' | 'feel' | 'truth' | 'memory' | 'rhythm')
    setIsExpanded(false)
  }

  return (
    <>
      {/* Overlay backdrop when expanded (mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Left Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen z-45 transition-all duration-300 ease-out ${
          isExpanded ? 'w-48' : 'w-14'
        } ${
          theme === 'dark'
            ? 'bg-black/70 border-r border-white/5'
            : 'bg-white/70 border-r border-black/5'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Hamburger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg transition-all duration-300 ${
            theme === 'dark'
              ? 'hover:bg-white/10 text-gray-400 hover:text-white'
              : 'hover:bg-black/10 text-gray-600 hover:text-black'
          }`}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Navigation Items */}
        <div className="pt-16 space-y-2 px-2">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => handleLayerClick(layer.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                activeLayer === layer.id
                  ? 'scale-110 md:scale-100'
                  : 'scale-100 hover:scale-105'
              } ${
                activeLayer === layer.id
                  ? theme === 'dark'
                    ? 'bg-white/10'
                    : 'bg-black/10'
                  : theme === 'dark'
                    ? 'hover:bg-white/5'
                    : 'hover:bg-black/5'
              }`}
              style={{
                borderLeft:
                  activeLayer === layer.id
                    ? `3px solid ${layer.color}`
                    : '3px solid transparent',
                color:
                  activeLayer === layer.id
                    ? layer.color
                    : theme === 'dark'
                      ? '#999'
                      : '#666',
                boxShadow:
                  activeLayer === layer.id
                    ? `inset 0 0 12px ${layer.color}20`
                    : 'none',
              }}
            >
              <span className="text-2xl flex-shrink-0">{layer.icon}</span>
              {isExpanded && (
                <span className="text-xs font-semibold uppercase tracking-widest truncate">
                  {layer.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for content shift */}
      <div
        className="fixed left-0 top-0 h-screen pointer-events-none transition-all duration-300"
        style={{ width: isExpanded ? '12rem' : '3.5rem' }}
      />
    </>
  )
}
