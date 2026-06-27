'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/lib/theme-context'
import { getBgClass, getTextClass } from '@/lib/theme-colors'

interface LayerSelectorProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  onLayerChange: (layer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm') => void
}

const layers = [
  { id: 'now', label: 'Now', icon: '⚡', color: 'blue', hex: '#3b82f6' },
  { id: 'feel', label: 'Feel', icon: '🌡', color: 'amber', hex: '#fbbf24' },
  { id: 'truth', label: 'Truth', icon: '👁', color: 'red', hex: '#ef4444' },
  { id: 'memory', label: 'Memory', icon: '🕰', color: 'purple', hex: '#a855f7' },
  { id: 'rhythm', label: 'Rhythm', icon: '〰', color: 'green', hex: '#22c55e' },
] as const

export default function LayerSelector({ activeLayer, onLayerChange }: LayerSelectorProps) {
  const { theme } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll active pill into view
  useEffect(() => {
    if (!scrollRef.current) return
    const active = scrollRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeLayer])

  return (
    <div className="hidden fixed bottom-0 left-0 right-0 z-50 pb-6 px-4 pointer-events-none">
      <div
        ref={scrollRef}
        className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto rounded-full p-1 transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-black/30 backdrop-blur-xl border border-white/10'
            : 'bg-white/30 backdrop-blur-xl border border-black/10'
        }`}
        style={{
          scrollBehavior: 'smooth',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {layers.map(({ id, label, icon, hex }) => (
          <button
            key={id}
            onClick={() => onLayerChange(id as 'now' | 'feel' | 'truth' | 'memory' | 'rhythm')}
            data-active={activeLayer === id}
            className={`
              px-3 py-2 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-1
              ${
                activeLayer === id
                  ? `${theme === 'dark' ? 'text-black' : 'text-white'} animate-pulse-custom`
                  : `${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`
              }
            `}
            style={{
              backgroundColor: activeLayer === id ? hex : 'transparent',
              boxShadow:
                activeLayer === id
                  ? `0 0 24px ${hex}60, inset 0 0 12px ${hex}30`
                  : 'none',
            }}
          >
            <span className="text-lg">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
