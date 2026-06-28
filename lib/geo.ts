export function geoCell(lat: number, lng: number): string {
  return `${(Math.round(lat * 100) / 100).toFixed(2)}_${(Math.round(lng * 100) / 100).toFixed(2)}`
}

export function neighborCells(lat: number, lng: number): string[] {
  const step = 0.01
  const cells: string[] = []
  for (let dlat = -step; dlat <= step; dlat += step) {
    for (let dlng = -step; dlng <= step; dlng += step) {
      cells.push(geoCell(lat + dlat, lng + dlng))
    }
  }
  return cells
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
