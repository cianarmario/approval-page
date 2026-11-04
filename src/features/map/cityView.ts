import * as L from 'leaflet'

type BoundedMap = L.Map & {
  _limitCenter(center: L.LatLng, zoom: number, bounds?: L.LatLngBounds): L.LatLng
}

/** Center the full city in its canvas; the information sidebar is outside it. */
export function createCityView(map: L.Map, bounds: L.LatLngBounds) {
  let fitting = false
  let overviewZoom = 0
  let overviewBounds: L.LatLngBounds | undefined
  let previousSize = map.getSize()
  const closeBounds = bounds.pad(0.06)
  const calculateOverview = () => {
    const padding: L.PointTuple = map.getSize().x < 580 ? [32, 64] : [56, 56]
    // Preserve the existing overview framing while allowing unsnapped gestures.
    overviewZoom = Math.floor(map.getBoundsZoom(bounds, false, L.point(padding).multiplyBy(2)) * 10 + 1e-9) / 10
    const centerPoint = map.project(bounds.getNorthWest(), overviewZoom)
      .add(map.project(bounds.getSouthEast(), overviewZoom)).divideBy(2)
    const center = map.unproject(centerPoint, overviewZoom)
    const halfSize = map.getSize().divideBy(2)
    overviewBounds = L.latLngBounds(map.unproject(centerPoint.subtract(halfSize), overviewZoom),
      map.unproject(centerPoint.add(halfSize), overviewZoom)).extend(closeBounds).pad(0.01)
    return center
  }
  const limitForZoom = (zoom: number) => zoom < overviewZoom + 1 ? overviewBounds ?? closeBounds : closeBounds
  const limitCenter = (center: L.LatLng, zoom: number) =>
    (map as BoundedMap)._limitCenter(center, zoom, limitForZoom(zoom))
  const constrain = () => {
    if (fitting || !overviewBounds) return
    const limit = limitForZoom(map.getZoom())
    map.setMaxBounds(limit)
    map.panInsideBounds(limit, { animate: false })
  }
  const fit = () => {
    fitting = true
    map.stop()
    map.setMaxBounds(undefined)
    map.setMinZoom(0)
    const center = calculateOverview()
    map.setView(center, overviewZoom, { animate: false })
    map.setMinZoom(overviewZoom)
    fitting = false
    constrain()
  }
  const resize = () => {
    const size = L.point(map.getContainer().clientWidth, map.getContainer().clientHeight)
    if (size.equals(previousSize)) return
    previousSize = size
    const center = map.getCenter(), zoom = map.getZoom()
    const wasOverview = zoom <= overviewZoom + 0.15
    fitting = true
    map.setMaxBounds(undefined)
    map.setMinZoom(0)
    map.invalidateSize({ pan: false })
    // Compute limits without briefly zooming to the overview and closing popups.
    const overviewCenter = calculateOverview()
    map.setView(wasOverview ? overviewCenter : center, wasOverview ? overviewZoom : Math.max(zoom, overviewZoom), { animate: false })
    map.setMinZoom(overviewZoom)
    fitting = false
    constrain()
  }
  map.on('zoomend', constrain)
  return { fit, resize, limitCenter, dispose: () => map.off('zoomend', constrain) }
}
