'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[v0] Service Worker not supported')
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[v0] Service Worker registered:', registration)
      })
      .catch((error) => {
        console.warn('[v0] Service Worker registration failed:', error)
      })
  }, [])

  return null
}
