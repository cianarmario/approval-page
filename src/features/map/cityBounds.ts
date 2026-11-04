import type { LatLngBoundsLiteral } from 'leaflet'

/** Exact extent of public/data/legazpi/city.geojson (PSA/NAMRIA, November 2023).
 * Keep the map scoped before asynchronous boundary layers load; tests verify
 * these values against the source geometry.
 */
export const LEGAZPI_CITY_BOUNDS: LatLngBoundsLiteral = [
  [12.986184890000061, 123.68355123800006],
  [13.253206272000057, 123.86231079600009],
]
