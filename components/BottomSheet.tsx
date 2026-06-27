'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { getCardClass, getTextClass, getBgClass } from '@/lib/theme-colors'

interface BottomSheetProps {
  isOpen: boolean
  children: React.ReactNode
  onClose?: () => void
}

export default function BottomSheet({ isOpen, children, onClose }: BottomSheetProps) {
  const { theme } = useTheme()
  const [displayHeight, setDisplayHeight] = useState('0vh')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDisplayHeight(isOpen ? '60vh' : '0vh')
  }, [isOpen])

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

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl overflow-hidden transition-all duration-300 ease-out ${getCardClass(theme)}`}
        style={{
          height: displayHeight,
          transform: `translateY(${isOpen ? 0 : '100%'})`,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`} />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="h-full overflow-y-auto px-6 pb-8"
          style={{
            scrollBehavior: 'smooth',
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(100, 100, 100, 0.5);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.7);
        }
      `}</style>
    </>
  )
}
