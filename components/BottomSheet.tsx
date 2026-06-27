'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { getCardClass, getTextClass, getBgClass } from '@/lib/theme-colors'

type SnapPoint = 'peek' | 'half' | 'full'

interface BottomSheetProps {
  isOpen: boolean
  children: React.ReactNode
  onClose?: () => void
  layerName?: string
}

const SNAP_POINTS = {
  peek: 0.25,  // 25vh
  half: 0.6,   // 60vh
  full: 0.9,   // 90vh
}

export default function BottomSheet({ isOpen, children, onClose, layerName }: BottomSheetProps) {
  const { theme } = useTheme()
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('half')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
  }, [])

  const getHeight = () => {
    return windowHeight * SNAP_POINTS[snapPoint]
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const startPos = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart(startPos)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return

    const currentPos = 'touches' in e ? e.touches[0].clientY : e.clientY
    const delta = currentPos - dragStart

    // Determine new snap point based on drag direction
    if (delta > 100 && snapPoint === 'full') {
      setSnapPoint('half')
      setIsDragging(false)
    } else if (delta > 100 && snapPoint === 'half') {
      setSnapPoint('peek')
      setIsDragging(false)
    } else if (delta < -100 && snapPoint === 'peek') {
      setSnapPoint('half')
      setIsDragging(false)
    } else if (delta < -100 && snapPoint === 'half') {
      setSnapPoint('full')
      setIsDragging(false)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isOpen && snapPoint === 'peek') {
      setSnapPoint('half')
    }
  }, [isOpen, snapPoint])

  const height = getHeight()
  const displayHeight = isOpen ? height : 0

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-30 backdrop-blur-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-black/50' : 'bg-white/50'
          }`}
          onClick={onClose}
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        />
      )}

      {/* Premium Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl overflow-hidden transition-all duration-300 ease-out will-change-transform ${
          theme === 'dark'
            ? 'bg-[#0f0f0f]/80 border border-white/10 backdrop-blur-2xl'
            : 'bg-white/80 border border-black/10 backdrop-blur-2xl'
        }`}
        style={{
          height: displayHeight,
          transform: `translateY(${isOpen ? 0 : '100%'})`,
          boxShadow: isOpen
            ? theme === 'dark'
              ? '0 -20px 60px rgba(0, 0, 0, 0.4)'
              : '0 -20px 60px rgba(0, 0, 0, 0.1)'
            : 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          className={`flex justify-center py-3 ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-100'} cursor-grab active:cursor-grabbing border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-black/10'
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          <div
            className={`w-12 h-1.5 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Layer name header with breathing animation */}
        {layerName && (
          <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <h2 className={`text-lg font-semibold ${getTextClass(theme, 'primary')} animate-breathing`}>
              {layerName}
            </h2>
          </div>
        )}

        {/* Content area with scroll */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-none px-6 py-4"
          style={{
            height: displayHeight - (layerName ? 140 : 60),
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
