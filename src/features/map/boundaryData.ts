import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'

export type BoundaryProperties = {
  name: string
  pcode: string
  cityPcode: string
  city: string
  province: string
}
export type BoundaryFeature = Feature<Polygon | MultiPolygon, BoundaryProperties>
export type BoundaryCollection = FeatureCollection<Polygon | MultiPolygon, BoundaryProperties>
export const CITY_PCODE = 'PH0500506'
export const EXPECTED_BARANGAYS = 70
export const BOUNDARY_SOURCE_URL = 'https://data.humdata.org/dataset/cod-ab-phl'
export const GEOMETRY_DATE = 'November 2023'

function validRing(ring: Position[]): boolean {
  if (ring.length < 4) return false
  if (!ring.every(position => Array.isArray(position) && position.length >= 2 && Number.isFinite(position[0]) &&
    Number.isFinite(position[1]) && Math.abs(position[0]) <= 180 && Math.abs(position[1]) <= 90)) return false
  return ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1]
}

/** Reject missing, malformed, duplicate, and neighboring municipality records. */
export function validateBoundaries(data: unknown, kind: 'city' | 'barangays'): BoundaryCollection {
  if (!data || typeof data !== 'object') throw new Error('Boundary data is unavailable.')
  const collection = data as BoundaryCollection
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features) ||
    collection.features.length !== (kind === 'city' ? 1 : EXPECTED_BARANGAYS)) {
    throw new Error(`The ${kind} dataset is incomplete.`)
  }
  const codes = new Set<string>()
  for (const feature of collection.features) {
    const properties = feature?.properties
    const geometry = feature?.geometry
    if (feature?.type !== 'Feature' || !properties || typeof properties.name !== 'string' ||
      !properties.name.trim() || typeof properties.pcode !== 'string' || codes.has(properties.pcode) ||
      properties.cityPcode !== CITY_PCODE || properties.province !== 'Albay' ||
      (kind === 'city' ? properties.pcode !== CITY_PCODE :
        !properties.pcode.startsWith(CITY_PCODE) || properties.pcode === CITY_PCODE) ||
      !geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type) || !Array.isArray(geometry.coordinates)) {
      throw new Error('Boundary data contains invalid or non-Legazpi records.')
    }
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    if (!polygons.length || !polygons.every(polygon => Array.isArray(polygon) && polygon.length > 0 &&
      polygon.every(ring => Array.isArray(ring) && validRing(ring)))) {
      throw new Error('Boundary data contains invalid polygon coordinates.')
    }
    codes.add(properties.pcode)
  }
  return collection
}

export async function loadBoundaries(kind: 'city' | 'barangays', signal: AbortSignal): Promise<BoundaryCollection> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/legazpi/${kind}.geojson`, { signal })
  if (!response.ok) throw new Error(`The verified ${kind} dataset could not be loaded.`)
  return validateBoundaries(await response.json(), kind)
}
