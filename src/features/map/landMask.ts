import type { Feature, Polygon, MultiPolygon, Position } from 'geojson'

type Edge = { a: Position; b: Position; west: number; east: number; south: number; north: number }
const CONTAINMENT_ROWS = 1000

/** Exact coastline checks with row-indexed containment and a 2D edge index. */
export function createLandMask(features: Array<Feature<Polygon | MultiPolygon>>) {
  const cells = new Map<number, Map<number, Edge[]>>()
  const allEdges: Edge[] = [], longEdges: Edge[] = []
  let indexed = false
  const rings = features.flatMap(feature => feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates)
    .map(polygon => polygon.map(ring => {
      const rows = new Map<number, Edge[]>()
      let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i], b = ring[j]
        const edge: Edge = { a, b, west: Math.min(a[0], b[0]), east: Math.max(a[0], b[0]),
          south: Math.min(a[1], b[1]), north: Math.max(a[1], b[1]) }
        west = Math.min(west, edge.west); east = Math.max(east, edge.east)
        south = Math.min(south, edge.south); north = Math.max(north, edge.north)
        allEdges.push(edge)
        // Fine latitude buckets keep detailed coastline point tests from
        // repeatedly scanning thousands of edges in a kilometre-wide strip.
        const firstRow = Math.floor(edge.south * CONTAINMENT_ROWS), lastRow = Math.floor(edge.north * CONTAINMENT_ROWS)
        for (let row = firstRow; row <= lastRow; row++) {
          const bucket = rows.get(row) ?? []
          bucket.push(edge); rows.set(row, bucket)
        }
      }
      return { rows, west, east, south, north }
    }))
  const inRing = (point: [number, number], ring: typeof rings[number][number]) => {
    const [x, y] = point
    if (x < ring.west || x > ring.east || y < ring.south || y > ring.north) return false
    let inside = false
    for (const { a: [xi, yi], b: [xj, yj] } of ring.rows.get(Math.floor(y * CONTAINMENT_ROWS)) ?? []) {
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
  const contains = (point: [number, number]) => rings.some(polygon => {
    if (!inRing(point, polygon[0])) return false
    for (let i = 1; i < polygon.length; i++) if (inRing(point, polygon[i])) return false
    return true
  })
  const indexEdges = () => {
    if (indexed) return
    indexed = true
    // Barangay labels only ask for containment; build the box-query index
    // lazily for the coast checks that actually need it.
    for (const edge of allEdges) {
      const firstRow = Math.floor(edge.south * 100), lastRow = Math.floor(edge.north * 100)
      const firstColumn = Math.floor(edge.west * 100), lastColumn = Math.floor(edge.east * 100)
      if ((lastRow - firstRow + 1) * (lastColumn - firstColumn + 1) > 256) { longEdges.push(edge); continue }
      for (let row = firstRow; row <= lastRow; row++) {
        let columns = cells.get(row)
        if (!columns) { columns = new Map(); cells.set(row, columns) }
        for (let column = firstColumn; column <= lastColumn; column++) {
          const bucket = columns.get(column) ?? []
          bucket.push(edge); columns.set(column, bucket)
        }
      }
    }
  }
  const touchesBox = (west: number, south: number, east: number, north: number) => {
    const intersects = (edge: Edge) => {
      if (edge.east < west || edge.west > east || edge.north < south || edge.south > north) return false
      const { a, b } = edge, dx = b[0] - a[0], dy = b[1] - a[1]
      let low = 0, high = 1
      if (dx !== 0) {
        const start = (west - a[0]) / dx, end = (east - a[0]) / dx
        low = Math.max(low, Math.min(start, end)); high = Math.min(high, Math.max(start, end))
      }
      if (dy !== 0) {
        const start = (south - a[1]) / dy, end = (north - a[1]) / dy
        low = Math.max(low, Math.min(start, end)); high = Math.min(high, Math.max(start, end))
      }
      return low <= high
    }
    const firstRow = Math.floor(south * 100), lastRow = Math.floor(north * 100)
    const firstColumn = Math.floor(west * 100), lastColumn = Math.floor(east * 100)
    // Broad overview queries and unusually long source edges use the same exact
    // intersection test without allocating a potentially enormous grid range.
    if ((lastRow - firstRow + 1) * (lastColumn - firstColumn + 1) > 2048) return allEdges.some(intersects)
    indexEdges()
    if (longEdges.some(intersects)) return true
    const visited = new Set<Edge>()
    for (let row = firstRow; row <= lastRow; row++) {
      const columns = cells.get(row)
      if (!columns) continue
      for (let column = firstColumn; column <= lastColumn; column++) {
        for (const edge of columns.get(column) ?? []) {
          if (visited.has(edge)) continue
          visited.add(edge)
          if (intersects(edge)) return true
        }
      }
    }
    return false
  }
  return Object.assign(contains, { touchesBox })
}
