'use client'

import { useEffect, useRef } from 'react'

interface LayerSelectorProps {
  activeLayer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'
  onLayerChange: (layer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm') => void
}

const layers = [
  { id: 'now', label: 'Now', color: 'blue', hex: '#3b82f6' },
  { id: 'feel', label: 'Feel', color: 'amber', hex: '#fbbf24' },
  { id: 'truth', label: 'Truth', color: 'red', hex: '#ef4444' },
  { id: 'memory', label: 'Memory', color: 'purple', hex: '#a855f7' },
  { id: 'rhythm', label: 'Rhythm', color: 'green', hex: '#22c55e' },
] as const

export default function LayerSelector({ activeLayer, onLayerChange }: LayerSelectorProps) {
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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-6 px-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {layers.map(({ id, label, hex }) => (
          <button
            key={id}
            onClick={() => onLayerChange(id as 'now' | 'feel' | 'truth' | 'memory' | 'rhythm')}
            data-active={activeLayer === id}
            className={`
              px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap
              ${
                activeLayer === id
                  ? `bg-opacity-100 text-black shadow-lg`
                  : 'bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400'
              }
            `}
            style={{
              backgroundColor: activeLayer === id ? hex : 'transparent',
              boxShadow:
                activeLayer === id
                  ? `0 0 20px ${hex}40, inset 0 0 10px ${hex}20`
                  : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
