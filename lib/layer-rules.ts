/**
 * Layer-specific rules and constraints
 * Implements distance-based access control for each layer
 */

export interface LocationRules {
  canRead: boolean
  canWrite: boolean
  readTooltip?: string
  writeTooltip?: string
  radius: number
}

export const LAYER_RULES = {
  now: {
    isLocked: true, // Map cannot be tapped
    readRadius: 500, // Can read within 500m
    writeRadius: 0, // Only from user location
    description: 'Now only shows what\'s around you',
  },
  feel: {
    isLocked: false,
    readRadius: Infinity, // Can read anywhere
    writeRadius: 300, // Can write within 300m
    description: 'Read anywhere, write from where you are',
  },
  truth: {
    isLocked: false,
    readRadius: Infinity, // Can read anywhere
    writeRadius: 200, // Requires confirmation beyond 200m
    description: 'Read anywhere, report requires presence confirmation',
  },
  memory: {
    isLocked: false,
    readRadius: Infinity, // Can read anywhere
    writeRadius: 100, // Can write within 100m
    echoRadius: 50, // Echo only within 50m
    description: 'Read anywhere, write allows remote with confirmation',
  },
  rhythm: {
    isLocked: false,
    readRadius: Infinity, // Can read anywhere
    checkInRadius: 150, // Check-in within 150m
    description: 'Read anywhere, check-in requires presence',
  },
} as const

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Get location rules for a specific layer
 */
export function getLocationRules(
  layer: 'now' | 'feel' | 'truth' | 'memory' | 'rhythm',
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number
): LocationRules {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng)
  const rules = LAYER_RULES[layer]

  if (layer === 'now') {
    // Now is locked to user location only
    return {
      canRead: distance < rules.readRadius,
      canWrite: distance < 50, // Only from current location
      radius: rules.readRadius,
    }
  }

  if (layer === 'feel') {
    return {
      canRead: true, // Can read anywhere
      canWrite: distance < rules.writeRadius,
      writeTooltip: distance >= rules.writeRadius 
        ? 'You can only feel from where you are' 
        : undefined,
      radius: rules.writeRadius,
    }
  }

  if (layer === 'truth') {
    return {
      canRead: true, // Can read anywhere
      canWrite: distance < rules.writeRadius ? true : 'confirm', // Confirm if beyond 200m
      writeTooltip: distance >= rules.writeRadius 
        ? 'Did this happen to you here?' 
        : undefined,
      radius: rules.writeRadius,
    }
  }

  if (layer === 'memory') {
    return {
      canRead: true, // Can read anywhere
      canWrite: distance < rules.writeRadius ? true : 'confirm', // Confirm if beyond 100m
      writeTooltip: distance >= rules.writeRadius 
        ? 'Are you adding a memory from when you were here before?' 
        : undefined,
      radius: rules.writeRadius,
    }
  }

  if (layer === 'rhythm') {
    return {
      canRead: true, // Can read anywhere
      canWrite: distance < rules.checkInRadius,
      writeTooltip: distance >= rules.checkInRadius 
        ? 'Visit this place to join its rhythm' 
        : undefined,
      radius: rules.checkInRadius,
    }
  }

  return {
    canRead: false,
    canWrite: false,
    radius: 0,
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
