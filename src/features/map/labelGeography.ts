import type { BoundaryFeature } from './boundaryData.ts'
import { labelPosition } from './labelGeometry.ts'

export type LabelGeography = {
  position: [number, number]
  bounds: [[number, number], [number, number]]
}

/** Pure geographic preparation, suitable for a worker; no Leaflet or DOM work. */
export function prepareLabelGeography(feature: BoundaryFeature): LabelGeography {
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  for (const polygon of polygons) for (const ring of polygon) for (const [lng, lat] of ring) {
    south = Math.min(south, lat); north = Math.max(north, lat)
    west = Math.min(west, lng); east = Math.max(east, lng)
  }
  return { position: labelPosition(feature), bounds: [[south, west], [north, east]] }
}
