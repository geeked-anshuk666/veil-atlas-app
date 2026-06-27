import { NextRequest, NextResponse } from 'next/server'

// Mock daily and weekly rhythm data
const mockRhythmData = {
  hourly: Array.from({ length: 24 }, (_, hour) => {
    // More activity during day/evening
    let count = Math.floor(Math.random() * 20)
    if (hour >= 8 && hour <= 12) count += Math.floor(Math.random() * 15)
    if (hour >= 17 && hour <= 20) count += Math.floor(Math.random() * 20)
    return { hour, count }
  }),
  weekly: [
    // Mon
    {
      day: 0,
      morning: 12,
      afternoon: 18,
      evening: 9,
    },
    // Tue
    {
      day: 1,
      morning: 15,
      afternoon: 22,
      evening: 14,
    },
    // Wed
    {
      day: 2,
      morning: 10,
      afternoon: 16,
      evening: 11,
    },
    // Thu
    {
      day: 3,
      morning: 14,
      afternoon: 20,
      evening: 13,
    },
    // Fri
    {
      day: 4,
      morning: 18,
      afternoon: 25,
      evening: 20,
    },
    // Sat
    {
      day: 5,
      morning: 8,
      afternoon: 20,
      evening: 18,
    },
    // Sun
    {
      day: 6,
      morning: 6,
      afternoon: 12,
      evening: 10,
    },
  ],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  // In production, this would query the database for activity at this location
  // For now, return mock data with slight variation based on location hash
  const hash =
    Math.abs(Math.sin(lat) * Math.cos(lng) * 100000) % 1 || 0.5

  const variatedHourly = mockRhythmData.hourly.map((h) => ({
    ...h,
    count: Math.floor(h.count * (0.8 + hash * 0.4)),
  }))

  const variatedWeekly = mockRhythmData.weekly.map((w) => ({
    ...w,
    morning: Math.floor(w.morning * (0.8 + hash * 0.4)),
    afternoon: Math.floor(w.afternoon * (0.8 + hash * 0.4)),
    evening: Math.floor(w.evening * (0.8 + hash * 0.4)),
  }))

  return NextResponse.json({
    hourly: variatedHourly,
    weekly: variatedWeekly,
  })
}
