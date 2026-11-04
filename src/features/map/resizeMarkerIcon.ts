import * as L from 'leaflet'

/** Resize the existing artwork DOM without replacing icons or rebinding events. */
export function resizeMarkerIcon(marker: L.Marker, width: number, height: number, popup = false) {
  const icon = marker.options.icon!
  icon.options.iconSize = [width, height]
  icon.options.iconAnchor = [width / 2, height / 2]
  if (popup) icon.options.popupAnchor = [0, -height / 2]
  const root = marker.getElement()
  if (root) {
    root.style.width = `${width}px`; root.style.height = `${height}px`
    root.style.marginLeft = `${-width / 2}px`; root.style.marginTop = `${-height / 2}px`
  }
}
