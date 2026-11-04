export type MapView = 'natural' | 'satellite'
// Archived terrain helpers still accept their original appearance.
export type MapAppearance = 'custom' | MapView

export const MAP_VIEWS: { id: MapView; label: string; description: string }[] = [
  { id: 'natural', label: 'Standard', description: 'Streets, buildings and place names.' },
  { id: 'satellite', label: 'Satellite', description: 'Aerial imagery with barangay boundaries.' },
]

// Request a real missing-tile error rather than Esri's successful placeholder image.
export const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false'
export const SATELLITE_ATTRIBUTION = 'Source: <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener noreferrer">Esri World Imagery</a>, Vantor, Earthstar Geographics, and the GIS User Community'
