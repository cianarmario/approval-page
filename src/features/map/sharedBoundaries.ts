import type { FeatureCollection, LineString, Position } from 'geojson'
import type { BoundaryFeature } from './boundaryData.ts'

/** Draw internal administrative edges once; never repeat the older coastal outline. */
export function sharedBoundaries(features: BoundaryFeature[]): FeatureCollection<LineString> {
  return boundaryLines(features, true)
}

/** Standard and Satellite include every verified edge, including the city perimeter. */
export function completeBoundaries(features: BoundaryFeature[]): FeatureCollection<LineString> {
  return boundaryLines(features, false)
}

function boundaryLines(features: BoundaryFeature[], sharedOnly: boolean): FeatureCollection<LineString> {
  const edges = new Map<string, { a: Position; b: Position; owners: Set<number> }>()
  // Keep Topography's existing shared-edge matching. Complete outlines use
  // exact source vertices so no short source segment disappears by rounding.
  const pointKey = ([lng, lat]: Position) => sharedOnly ? `${lng.toFixed(7)},${lat.toFixed(7)}` : `${lng},${lat}`
  features.forEach((feature, owner) => {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    for (const polygon of polygons) for (const ring of polygon) for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i], start = pointKey(a), end = pointKey(b)
      if (start === end) continue
      const key = start < end ? `${start}|${end}` : `${end}|${start}`
      const edge = edges.get(key) ?? { a, b, owners: new Set<number>() }
      edge.owners.add(owner); edges.set(key, edge)
    }
  })
  const shared = [...edges.values()].filter(edge => !sharedOnly || edge.owners.size > 1)
  const adjacency = new Map<string, number[]>()
  shared.forEach((edge, index) => {
    for (const point of [edge.a, edge.b]) {
      const key = pointKey(point), list = adjacency.get(key) ?? []
      list.push(index); adjacency.set(key, list)
    }
  })
  const visited = new Set<number>(), lines: Position[][] = []
  const trace = (start: Position, first: number) => {
    const coordinates = [start]
    let point = start, index = first
    while (!visited.has(index)) {
      visited.add(index)
      const edge = shared[index]
      point = pointKey(point) === pointKey(edge.a) ? edge.b : edge.a
      coordinates.push(point)
      const neighbors = adjacency.get(pointKey(point))!
      if (neighbors.length !== 2) break
      const next = neighbors.find(candidate => !visited.has(candidate))
      if (next === undefined) break
      index = next
    }
    lines.push(coordinates)
  }
  shared.forEach((edge, index) => {
    if (visited.has(index)) return
    if (adjacency.get(pointKey(edge.a))!.length !== 2) trace(edge.a, index)
    else if (adjacency.get(pointKey(edge.b))!.length !== 2) trace(edge.b, index)
  })
  shared.forEach((edge, index) => { if (!visited.has(index)) trace(edge.a, index) })
  return { type: 'FeatureCollection', features: lines.map(coordinates => ({
    type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates },
  })) }
}
