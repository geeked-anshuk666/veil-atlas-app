'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void
  onDropdownOpen?: (isOpen: boolean) => void
}

export default function SearchBar({ onLocationSelect, onDropdownOpen }: SearchBarProps) {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'VeilAtlas/1.0',
          },
        }
      )
      const data = await response.json()
      setResults(data)
      setIsOpen(true)
      onDropdownOpen?.(true)
    } catch (error) {
      console.error('[v0] Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value.trim()) {
      setResults([])
      setIsOpen(false)
      onDropdownOpen?.(false)
      return
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value)
    }, 400)
  }

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onLocationSelect(lat, lng, result.display_name)
    setQuery('')
    setResults([])
    setIsOpen(false)
    onDropdownOpen?.(false)
  }

  // Handle clear button
  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onDropdownOpen?.(false)
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        onDropdownOpen?.(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDropdownOpen])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        onDropdownOpen?.(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDropdownOpen])

  return (
    <div
      ref={searchRef}
      className="fixed top-4 left-[68px] right-4 z-40 md:left-[80px]"
      style={{
        maxWidth: 'calc(100% - 88px)',
      }}
    >
      {/* Search Input */}
      <div
        className={`rounded-full px-4 py-3 border transition-all duration-300 flex items-center gap-3 ${
          theme === 'dark'
            ? 'bg-black/70 border-white/10 hover:border-white/20'
            : 'bg-white/70 border-black/10 hover:border-black/20'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Magnifier Icon */}
        <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          🔍
        </span>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search locations..."
          className={`flex-1 bg-transparent outline-none text-sm ${
            theme === 'dark'
              ? 'text-white placeholder-gray-500'
              : 'text-black placeholder-gray-600'
          }`}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className={`text-lg transition-opacity hover:opacity-70 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <span className="text-lg animate-spin-slow">⟳</span>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border max-h-96 overflow-y-auto z-50 ${
            theme === 'dark'
              ? 'bg-black/80 border-white/10'
              : 'bg-white/80 border-black/10'
          }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {results.map((result, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectResult(result)}
              className={`w-full px-4 py-3 text-left border-b transition-colors hover:bg-white/10 last:border-b-0 ${
                theme === 'dark'
                  ? 'border-white/10 hover:bg-white/10'
                  : 'border-black/10 hover:bg-black/10'
              }`}
            >
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-black'
              } line-clamp-2`}>
                {result.display_name}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query && results.length === 0 && !isLoading && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border p-4 text-center text-sm ${
            theme === 'dark'
              ? 'bg-black/80 border-white/10 text-gray-400'
              : 'bg-white/80 border-black/10 text-gray-600'
          }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          No locations found
        </div>
      )}
    </div>
  )
}
