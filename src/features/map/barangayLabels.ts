import * as L from 'leaflet'
import { barangayLabel, labelPosition } from './labelGeometry.ts'
import type { BoundaryFeature } from './boundaryData.ts'
import { intersects, mapControlRectangles } from './landmarkLayout.ts'
import type { ScreenRectangle } from './landmarkLayout.ts'
import { centeredLabelRectangle, mapLabelSizes, minimalBarangayLabelSize } from './labelLayout.ts'
import type { MapAppearance } from './mapViews.ts'
import { createLandMask } from './landMask.ts'
import { createMapFrameTask } from './mapFrameQueue.ts'
import { resizeMarkerIcon } from './resizeMarkerIcon.ts'
import type { LabelGeography } from './labelGeography.ts'

/** Names can use free space inside their own polygon; POI anchors never move. */
export function createBarangayLabels(map: L.Map, group: L.LayerGroup, features: BoundaryFeature[], font: string,
  obstacles: () => ScreenRectangle[] = () => [], selected: () => string = () => '',
  animatedObstacles: (zoom: number, center: L.LatLng) => ScreenRectangle[] = () => [], enabled: () => boolean = () => true,
  appearance: () => MapAppearance = () => 'custom', geography?: Record<string, LabelGeography>) {
  const context = document.createElement('canvas').getContext('2d')
  const labels = features.map(feature => {
    const name = barangayLabel(feature.properties.name)
    const shortName = /^Bgy\.\s*(\d+)/i.exec(feature.properties.name)?.[1] ?? name
    const prepared = geography?.[feature.properties.pcode]
    const position = L.latLng(prepared?.position ?? labelPosition(feature))
    const element = document.createElement('span')
    element.className = 'legazpi-map__label-text'
    element.dataset.barangayCode = feature.properties.pcode
    element.setAttribute('aria-hidden', 'true')
    element.textContent = name
    const marker = L.marker(position, {
      pane: 'legazpi-labels', interactive: false, keyboard: false,
      icon: L.divIcon({ html: element, className: 'legazpi-map__label', iconSize: [1, 1] }),
    })
    let mask: ReturnType<typeof createLandMask> | undefined
    return { marker, element, name, shortName, position, width: 0, height: 0, fontSize: 0, displayText: '',
      bounds: prepared ? L.latLngBounds(prepared.bounds) : L.geoJSON(feature).getBounds(),
      contains: (point: [number, number]) => (mask ??= createLandMask([feature]))(point), code: feature.properties.pcode }
  })
  let disposed = false
  let animating = false
  let fontsDirty = false
  const measurements = new Map<string, number>()
  const measure = (text: string, zoom: number, compact = false) => {
    const minimal = appearance() !== 'custom'
    const fontSize = minimal ? minimalBarangayLabelSize(zoom, map.getSize().x) :
      Math.max(10, mapLabelSizes(zoom, map.getSize().x).barangay - (compact ? 1 : 0))
    const weight = minimal ? 500 : 600
    const key = `${weight}:${fontSize}:${text}`
    let width = measurements.get(key)
    if (width === undefined) {
      const cssFont = `${weight} ${fontSize}px ${font}`
      if (context && context.font !== cssFont) context.font = cssFont
      width = context?.measureText(text).width ?? text.length * fontSize * 0.6
      measurements.set(key, width)
      if (measurements.size > 512) measurements.delete(measurements.keys().next().value!)
    }
    return { text, fontSize, width: Math.ceil(width) + (minimal ? 4 : 10),
      height: Math.ceil(fontSize * (minimal ? 1.35 : 1.5)) + (minimal ? 2 : 6) }
  }
  const apply = (label: typeof labels[number], dimensions: ReturnType<typeof measure>) => {
    if (!fontsDirty && label.displayText === dimensions.text && label.fontSize === dimensions.fontSize &&
      label.width === dimensions.width && label.height === dimensions.height) return
    if (fontsDirty || label.displayText !== dimensions.text) {
      label.element.textContent = dimensions.text
      label.element.title = label.name
    }
    if (fontsDirty || label.fontSize !== dimensions.fontSize) label.element.style.fontSize = `${dimensions.fontSize}px`
    if (fontsDirty || label.height !== dimensions.height) {
      label.element.style.height = `${dimensions.height}px`
      label.element.style.lineHeight = `${dimensions.height}px`
    }
    if (fontsDirty || label.width !== dimensions.width || label.height !== dimensions.height) {
      resizeMarkerIcon(label.marker, dimensions.width, dimensions.height)
    }
    Object.assign(label, { displayText: dimensions.text, fontSize: dimensions.fontSize,
      width: dimensions.width, height: dimensions.height })
  }
  const ordered = (project: (position: L.LatLng) => L.Point, size: L.Point, zoom: number) => labels.map(label => {
    const nw = project(label.bounds.getNorthWest()), se = project(label.bounds.getSouthEast())
    const point = project(label.position)
    return { label, nw, se, point, area: (se.x - nw.x) * (se.y - nw.y), distance: point.distanceTo(size.divideBy(2)) }
  }).sort((a, b) => Number(b.label.code === selected()) - Number(a.label.code === selected()) ||
    (zoom >= 16 ? a.distance - b.distance : b.area - a.area) || a.label.code.localeCompare(b.label.code))

  const findPosition = (label: typeof labels[number], nw: L.Point, se: L.Point, point: L.Point,
    dimensions: ReturnType<typeof measure>, size: L.Point, occupied: ScreenRectangle[]) => {
    const { width, height } = dimensions
    const left = Math.max(10 + width / 2 + 6, nw.x)
    const right = Math.min(size.x - 10 - width / 2 - 6, se.x)
    const top = Math.max(12 + height / 2 + 4, nw.y)
    const bottom = Math.min(size.y - 30 - height / 2 - 4, se.y)
    if (left > right || top > bottom) return null
    const clamp = (p: L.Point) => L.point(Math.max(left, Math.min(right, p.x)), Math.max(top, Math.min(bottom, p.y)))
    const start = clamp(point), middle = L.point((left + right) / 2, (top + bottom) / 2)
    const previous = map.latLngToContainerPoint(label.marker.getLatLng())
    const positions = group.hasLayer(label.marker) ? [previous, point, start, middle] : [point, previous, start, middle]
    for (const radius of [height + 8, width / 2 + 12]) {
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        positions.push(clamp(start.add([dx * radius, dy * radius])))
      }
    }
    for (const x of [0.25, 0.5, 0.75]) for (const y of [0.25, 0.5, 0.75]) {
      positions.push(L.point(left + (right - left) * x, top + (bottom - top) * y))
    }
    for (const p of positions) {
      const rectangle = centeredLabelRectangle(p.x, p.y, width, height)
      if (rectangle.left < 10 || rectangle.right > size.x - 10 || rectangle.top < 12 ||
        rectangle.bottom > size.y - 30 || occupied.some(other => intersects(other, rectangle))) continue
      const position = map.containerPointToLatLng(p)
      if (label.contains([position.lng, position.lat])) return { point: p, rectangle, position }
    }
    return null
  }

  const update = () => {
    if (disposed || animating) return
    render.cancel()
    if (!enabled()) { group.clearLayers(); return }
    const size = map.getSize(), zoom = map.getZoom()
    const occupied: ScreenRectangle[] = [...mapControlRectangles(size.x, size.y), ...obstacles()]
    if (render.isMoving()) {
      // Keep measured text and dimensions stable during a gesture. Repeated
      // font changes force synchronous layout while Leaflet is moving every
      // marker; refresh typography and polygon placement after it settles.
      for (const label of labels) {
        if (!group.hasLayer(label.marker)) continue
        const point = map.latLngToContainerPoint(label.marker.getLatLng())
        const box = centeredLabelRectangle(point.x, point.y, label.width, label.height)
        const hide = box.left < 10 || box.right > size.x - 10 || box.top < 12 || box.bottom > size.y - 30 ||
          occupied.some(other => intersects(other, box))
        const element = label.marker.getElement()
        if (element && element.classList.contains('legazpi-map__label--zoom-hidden') !== hide) {
          element.classList.toggle('legazpi-map__label--zoom-hidden', hide)
        }
        if (!hide) occupied.push(box)
      }
      return
    }
    const visible = new Set<L.Marker>()
    for (const { label, nw, se, point, area } of ordered(position => map.latLngToContainerPoint(position), size, zoom)) {
      const chosen = label.code === selected()
      if (label.element.classList.contains('legazpi-map__label-text--selected') !== chosen) {
        label.element.classList.toggle('legazpi-map__label-text--selected', chosen)
      }
      label.marker.getElement()?.classList.remove('legazpi-map__label--zoom-hidden')
      const full = measure(label.name, zoom)
      const canFitFull = zoom >= 16 || label.code === selected() ||
        (se.x - nw.x >= 36 && se.y - nw.y >= full.height && area >= full.width * full.height)
      let dimensions = full
      let fit = canFitFull ? findPosition(label, nw, se, point, full, size, occupied) : null
      if (!fit && zoom < 16 && label.code !== selected() && label.shortName !== label.name) {
        dimensions = measure(label.shortName, zoom, true)
        fit = findPosition(label, nw, se, point, dimensions, size, occupied)
      }
      if (!fit) continue
      apply(label, dimensions)
      if (!label.marker.getLatLng().equals(fit.position)) label.marker.setLatLng(fit.position)
      occupied.push(fit.rectangle); visible.add(label.marker)
      if (!group.hasLayer(label.marker)) group.addLayer(label.marker)
    }
    fontsDirty = false
    for (const label of labels) if (!visible.has(label.marker) && group.hasLayer(label.marker)) group.removeLayer(label.marker)
  }
  const render = createMapFrameTask(map, 3, update)
  const schedule = render.request
  const animateZoom = (event: L.ZoomAnimEvent) => {
    animating = true
    const size = map.getSize(), center = map.project(event.center, event.zoom)
    const occupied = [...mapControlRectangles(size.x, size.y), ...animatedObstacles(event.zoom, event.center)]
    const project = (position: L.LatLng) => map.project(position, event.zoom).subtract(center).add(size.divideBy(2))
    for (const { label } of ordered(project, size, event.zoom)) {
      if (!group.hasLayer(label.marker)) continue
      const point = project(label.marker.getLatLng())
      const rectangle = centeredLabelRectangle(point.x, point.y, label.width, label.height)
      const hide = rectangle.left < 10 || rectangle.right > size.x - 10 || rectangle.top < 12 ||
        rectangle.bottom > size.y - 30 || occupied.some(other => intersects(other, rectangle))
      label.marker.getElement()?.classList.toggle('legazpi-map__label--zoom-hidden', hide)
      if (!hide) occupied.push(rectangle)
    }
  }
  const settled = () => { animating = false; schedule() }
  map.on('move', schedule)
  map.on('moveend landmarklayout geographiclayout', schedule)
  map.on('resize barangayselection barangaylabelvisibility mapappearance', update)
  map.on('zoomanim', animateZoom)
  map.on('zoomend', settled)
  update()
  void document.fonts.ready.then(() => {
    if (disposed) return
    fontsDirty = true; schedule()
    measurements.clear()
  })
  return () => {
    disposed = true; render.dispose()
    map.off('move', schedule); map.off('moveend landmarklayout geographiclayout', schedule)
    map.off('resize barangayselection barangaylabelvisibility mapappearance', update)
    map.off('zoomanim', animateZoom); map.off('zoomend', settled); group.clearLayers()
  }
}
