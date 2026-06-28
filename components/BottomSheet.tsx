'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

type SnapPoint = 'peek' | 'half' | 'full'

interface BottomSheetProps {
  isOpen: boolean
  children: React.ReactNode
  onClose?: () => void
  layerName?: string
}

const PEEK = 120
const HALF = (typeof window !== 'undefined' ? window.innerHeight * 0.5 : 0)
const FULL = (typeof window !== 'undefined' ? window.innerHeight * 0.9 : 0)

export default function BottomSheet({ isOpen, children, onClose, layerName }: BottomSheetProps) {
  const { theme } = useTheme()
  const [sheetHeight, setSheetHeight] = useState(PEEK)
  const [isDragging, setIsDragging] = useState(false)
  const [windowHeight, setWindowHeight] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
    const checkSize = () => setIsDesktop(window.innerWidth >= 768)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const calculateSnapPoints = () => {
    const h = windowHeight
    return {
      peek: 120,
      half: h * 0.5,
      full: h * 0.9,
    }
  }

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartY.current = e.clientY
    dragStartHeight.current = sheetHeight
    setIsDragging(true)
  }

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const points = calculateSnapPoints()
    const delta = dragStartY.current - e.clientY
    const newHeight = Math.min(points.full, Math.max(points.peek, dragStartHeight.current + delta))
    setSheetHeight(newHeight)
  }

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)

    // Snap to nearest point
    const points = calculateSnapPoints()
    const pointsArr = [points.peek, points.half, points.full]
    const nearest = pointsArr.reduce((a, b) =>
      Math.abs(a - sheetHeight) < Math.abs(b - sheetHeight) ? a : b
    )
    setSheetHeight(nearest)
  }

  useEffect(() => {
    if (isOpen && sheetHeight === PEEK) {
      const points = calculateSnapPoints()
      setSheetHeight(points.half)
    }
  }, [isOpen, sheetHeight, windowHeight])

  const displayHeight = isOpen ? sheetHeight : 0

  const desktopStyles: React.CSSProperties = isDesktop ? {
    top: '24px',
    right: '24px',
    width: '380px',
    height: 'calc(100vh - 48px)',
    transform: isOpen ? 'translateX(0)' : 'translateX(440px)',
    opacity: isOpen ? 1 : 0,
    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease-in-out',
    borderRadius: '24px',
    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    background: theme === 'dark' ? 'rgba(12, 12, 16, 0.85)' : 'rgba(240, 240, 245, 0.85)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    boxShadow: `0 24px 64px ${theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'}`,
  } : {
    height: displayHeight,
    transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    background: theme === 'dark' ? 'rgba(12, 12, 16, 0.82)' : 'rgba(240, 240, 245, 0.82)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderLeft: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    boxShadow: `0 -12px 48px ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}, inset 0 1px 0 ${
      theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    }`,
  }

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-35 backdrop-blur-[1px] transition-colors duration-300 ${
            theme === 'dark' ? 'bg-black/20' : 'bg-white/20'
          }`}
          onClick={onClose}
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        />
      )}

      {/* Responsive sliding panel/sheet */}
      <div
        ref={sheetRef}
        className={isDesktop ? "fixed z-40 overflow-hidden" : "fixed bottom-0 left-14 right-0 z-40 rounded-t-3xl overflow-hidden"}
        style={desktopStyles}
      >
        {/* Header / handle */}
        <div
          ref={handleRef}
          className={`h-14 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none border-b ${
            theme === 'dark'
              ? 'border-white/5'
              : 'border-black/5'
          }`}
          onPointerDown={isDesktop ? undefined : onHandlePointerDown}
          onPointerMove={isDesktop ? undefined : onHandlePointerMove}
          onPointerUp={isDesktop ? undefined : onHandlePointerUp}
          onPointerCancel={isDesktop ? undefined : onHandlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Close button for desktop */}
          {isDesktop && (
            <button
              onClick={onClose}
              className={`absolute top-3.5 right-4 w-7 h-7 rounded-full flex items-center justify-center border text-xs transition-all hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              ✕
            </button>
          )}

          {/* Handle bar (hidden on desktop) */}
          {!isDesktop && (
            <div
              className="w-9 h-1 rounded-full transition-all duration-300"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                opacity: isDragging ? 0.8 : 0.5,
                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          )}

          {/* Layer label */}
          {layerName && (
            <p
              className={`text-xs font-bold uppercase tracking-widest mt-1 transition-all duration-300 ${
                isDesktop ? 'mr-8' : ''
              }`}
              style={{
                color: isDragging ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.7)',
              }}
            >
              {layerName}
            </p>
          )}
        </div>

        {/* Content area */}
        <div
          className={`overflow-y-auto px-5 pb-6 transition-all duration-300 ${
            isDesktop || sheetHeight > calculateSnapPoints().half ? 'overflow-y-auto' : 'overflow-y-hidden'
          }`}
          style={{
            height: `calc(100% - 56px)`,
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}



