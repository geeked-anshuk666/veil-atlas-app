export type LayerType = 'now' | 'feel' | 'truth' | 'memory' | 'rhythm'

export interface Post {
  id: string
  content: string
  lat: number
  lng: number
  created_at: string
  user_hash: string
}

export interface Memory {
  id: string
  content: string
  year_label: string
  lat: number
  lng: number
  created_at: string
}

export interface Rhythm {
  hourly: Array<{ hour: number; count: number }>
  weekly: Array<{ day: number; morning: number; afternoon: number; evening: number }>
}

export interface Echo {
  id: string
  content: string
  lat: number
  lng: number
  for_whom?: string
  created_at: string
}

