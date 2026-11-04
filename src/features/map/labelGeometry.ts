import polylabel from 'polylabel'
import type { BoundaryFeature } from './boundaryData.ts'
import { BARANGAY_PROFILES, barangayAddress, barangayFormerNumberLabel } from './barangayProfiles.ts'

function polygonArea(ring: number[][]): number {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

/** Use the interior of the largest polygon, avoiding holes and detached fragments. */
export function labelPosition(feature: BoundaryFeature): [number, number] {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const largest = polygons.reduce((a, b) => polygonArea(a[0]) >= polygonArea(b[0]) ? a : b)
  const coordinates = largest.map(ring => ring.map(([lng, lat]): [number, number] => [lng, lat]))
  const [lng, lat] = polylabel(coordinates, 0.00001)
  return [lat, lng]
}

/** Use the shared, verified display names; preserve original names in GeoJSON. */
export function labelName(name: string): string {
  const number = /^Bgy\.\s*(\d+)\s*-/i.exec(name)?.[1]
  const profile = number && BARANGAY_PROFILES[Number(number)]
  if (profile) return `${number} · ${profile.name}${barangayFormerNumberLabel(Number(number))}`
  return name.replace(/^Bgy\.\s*/i, '').replace(/\s*\([^)]*\)/g, '').replace(/\s+-\s+/, ' · ').trim()
}

/** Full address with the current number and documented former number in parentheses. */
export function barangayOptionLabel(name: string): string {
  const number = /^Bgy\.\s*(\d+)\s*-/i.exec(name)?.[1]
  return (number && barangayAddress(Number(number), true)) || barangayName(name)
}

/** Compact hover text: verified display name without numbers or old aliases. */
export function barangayName(name: string): string {
  const number = /^Bgy\.\s*(\d+)\s*-/i.exec(name)?.[1]
  const profile = number && BARANGAY_PROFILES[Number(number)]
  if (profile) return profile.name
  return labelName(name).replace(/^\d+\s*·\s*/, '').replace(/\s+Pob\.?$/i, '').trim()
}

export function barangayLabel(name: string): string {
  const number = /^Bgy\.\s*(\d+)\s*-/i.exec(name)?.[1]
  return number ? `${number} · ${barangayName(name)}${barangayFormerNumberLabel(Number(number))}` : barangayName(name)
}
