import * as L from 'leaflet'

/** Keep the Chromium tile fallback, using tile coordinates instead of forced
 * DOM measurements, polling or rebuilding all loaded images after every move. */
export function mirrorNaturalTiles(map: L.Map, layer: L.TileLayer, pane: HTMLElement, appearance: 'natural' | 'satellite' = 'natural') {
  const sources = new Map<HTMLImageElement, L.Coords>()
  const copies = new Map<HTMLImageElement, { image: HTMLImageElement; corner: L.LatLng; zoom: number }>()
  let frame = 0, disposed = false, animating = false
  const position = (event?: L.ZoomAnimEvent) => {
    if (!copies.size) return
    const zoom = event?.zoom ?? map.getZoom()
    const origin = event ? map.project(event.center, zoom).subtract(map.getSize().divideBy(2))
      .add(L.DomUtil.getPosition(map.getPane('mapPane')!)).round() : map.getPixelOrigin()
    for (const { image, corner, zoom: sourceZoom } of copies.values()) {
      L.DomUtil.setTransform(image, map.project(corner, zoom).subtract(origin), map.getZoomScale(zoom, sourceZoom))
    }
  }
  const clear = () => {
    for (const copy of copies.values()) copy.image.remove()
    copies.clear(); sources.clear()
  }
  const paint = () => {
    frame = 0
    if (disposed || animating) return
    if (map.getContainer().dataset.appearance !== appearance) { clear(); return }
    for (const [source, copy] of copies) {
      if (!sources.has(source)) { copy.image.remove(); copies.delete(source) }
    }
    const size = layer.getTileSize()
    for (const [source, coords] of sources) {
      if (copies.has(source) || !source.complete || !source.naturalWidth) continue
      const image = document.createElement('img')
      image.alt = ''; image.setAttribute('aria-hidden', 'true')
      image.dataset.naturalMirror = 'true'; image.dataset.basemapMirror = appearance
      image.className = 'leaflet-zoom-animated'
      image.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;z-index:1;pointer-events:none'
      image.style.width = size.x + 'px'; image.style.height = size.y + 'px'
      image.src = source.currentSrc || source.src
      pane.append(image)
      copies.set(source, { image, corner: map.unproject([coords.x * size.x, coords.y * size.y], coords.z), zoom: coords.z })
    }
    position()
  }
  const schedule = () => { if (!disposed && !frame && !animating) frame = requestAnimationFrame(paint) }
  const loaded = (event: L.TileEvent) => { sources.set(event.tile as HTMLImageElement, event.coords); schedule() }
  const unloaded = (event: L.TileEvent) => { sources.delete(event.tile as HTMLImageElement); schedule() }
  const reset = () => position()
  const animate = (event: L.ZoomAnimEvent) => { animating = true; position(event) }
  const end = () => { animating = false; position(); schedule() }
  layer.on('tileload', loaded); layer.on('tileunload', unloaded); layer.on('remove', clear)
  map.on('zoom viewreset', reset); map.on('zoomanim', animate)
  map.on('zoomend', end); map.on('moveend resize', schedule)
  return {
    sync: schedule,
    dispose() {
      disposed = true; cancelAnimationFrame(frame)
      layer.off('tileload', loaded); layer.off('tileunload', unloaded); layer.off('remove', clear)
      map.off('zoom viewreset', reset); map.off('zoomanim', animate)
      map.off('zoomend', end); map.off('moveend resize', schedule)
      clear()
    },
  }
}
