import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import { cachedTileLayer } from '../../features/map/cachedTileLayer'
import { BOUNDARY_SOURCE_URL } from '../../features/map/boundaryData'
import { createBarangayLabels } from '../../features/map/barangayLabels'
import { configureSmoothWheelZoom } from '../../features/map/smoothWheelZoom'
import { mirrorNaturalTiles } from '../../features/map/naturalTileMirror'
import { LEGAZPI_CITY_BOUNDS } from '../../features/map/cityBounds'
import { createCityView } from '../../features/map/cityView'
import '../../features/map/leaflet.scoped.css'
import type { Project } from '../../types/approval'
import { projectBarangay } from '../../features/projects/services/projectBarangay'
import { invalidateProjectMapGeography, loadProjectMapGeography } from '../../features/projects/services/loadProjectMapGeography'
import { projectLocationLabel } from '../../features/projects/data/barangays'
import Icon from '../ui/Icon'
import '../../features/map/projectLocation.css'

export default function ProjectMap({ project, expanded = false }: { project: Project; expanded?: boolean }) {
  const canvas = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const recenter = useRef<(() => void) | null>(null)
  const barangayView = useRef<(() => void) | null>(null)
  const streetDetail = useRef<(() => void) | null>(null)
  const [streetView, setStreetView] = useState(false)
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  const [boundaryMessage, setBoundaryMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const point = project.coordinates
    if (!canvas.current || !point) return
    let disposed = false
    const controller = new AbortController()
    let disposeLabels: (() => void) | undefined
    setStreetView(false)
    setTilesUnavailable(false)
    setBoundaryMessage('')
    const cityBounds = L.latLngBounds(LEGAZPI_CITY_BOUNDS)
    const map = L.map(canvas.current, {
      scrollWheelZoom: false, dragging: true, keyboard: true,
      zoomAnimation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      fadeAnimation: false, touchZoom: true, bounceAtZoomLimits: false, doubleClickZoom: true,
      maxZoom: 20, maxBoundsViscosity: 1,
      zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 180, trackResize: false,
    })
    mapInstance.current = map
    const disposeWheelZoom = configureSmoothWheelZoom(map)
    map.scrollWheelZoom.disable()
    const cityView = createCityView(map, cityBounds)
    cityView.fit()
    const defaultZoom = expanded ? 15 : 16
    map.setView(point, defaultZoom, { animate: false })
    let previousSize = map.getSize()
    let barangayBounds: L.LatLngBounds | undefined
    let showStreets = false
    let overviewZoom = map.getZoom()
    const atBarangayOverview = () => !showStreets && Math.abs(map.getZoom() - overviewZoom) < 0.15 && map.getCenter().equals(point)
    const showBarangay = () => {
      showStreets = false
      setStreetView(false)
      map.closePopup()
      let zoom = defaultZoom
      if (expanded && barangayBounds?.isValid()) {
        // Frame the whole barangay while keeping the project pin in the center.
        const latitudeSpan = Math.max(Math.abs(barangayBounds.getSouth() - point[0]), Math.abs(barangayBounds.getNorth() - point[0]))
        const longitudeSpan = Math.max(Math.abs(barangayBounds.getWest() - point[1]), Math.abs(barangayBounds.getEast() - point[1]))
        const centeredBounds = L.latLngBounds(
          [point[0] - latitudeSpan, point[1] - longitudeSpan],
          [point[0] + latitudeSpan, point[1] + longitudeSpan],
        )
        const padding = map.getSize().x < 580 ? L.point(64, 112) : L.point(96, 96)
        zoom = Math.min(16, map.getBoundsZoom(centeredBounds, false, padding))
      }
      map.setView(point, zoom, { animate: false })
      overviewZoom = map.getZoom()
    }
    barangayView.current = showBarangay
    recenter.current = () => {
      map.closePopup()
      map.setView(point, map.getZoom(), { animate: false })
    }
    streetDetail.current = () => {
      showStreets = true
      setStreetView(true)
      map.closePopup()
      map.setView(point, 18, { animate: false })
    }
    map.attributionControl.setPrefix(false)
    map.attributionControl.addAttribution(`Boundaries: <a href="${BOUNDARY_SOURCE_URL}" target="_blank" rel="noopener noreferrer">PSA / NAMRIA / OCHA</a>`)
    const tiles = cachedTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19, maxZoom: 20, referrerPolicy: 'strict-origin-when-cross-origin',
      bounds: cityBounds.pad(1), noWrap: true,
      className: 'legazpi-map__natural-tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)
    const tileMirror = mirrorNaturalTiles(map, tiles, map.getPane('tilePane')!)
    const failedTiles = new Set<HTMLElement>()
    tiles.on('tileerror', (event: L.TileEvent) => { failedTiles.add(event.tile); if (!disposed) setTilesUnavailable(true) })
    tiles.on('tileload', (event: L.TileEvent) => { failedTiles.delete(event.tile) })
    tiles.on('tileunload', (event: L.TileEvent) => { failedTiles.delete(event.tile) })
    tiles.on('load', () => {
      if (!disposed) setTilesUnavailable(failedTiles.size > 0)
    })
    const marker = L.marker(point, {
      title: project.name, alt: project.name,
      icon: L.divIcon({ className: 'project-detail-marker', html: '<span></span>', iconSize: [32, 38], iconAnchor: [16, 36], popupAnchor: [0, -34] }),
    }).addTo(map)
    const popup = document.createElement('div')
    popup.className = 'project-marker-card'
    const heading = document.createElement('div')
    heading.className = 'project-marker-header'
    const reference = document.createElement('p')
    reference.className = 'project-marker-code'
    reference.textContent = project.id
    const name = document.createElement('h3')
    name.className = 'project-marker-name'
    name.textContent = project.name
    const address = document.createElement('p')
    address.className = 'project-marker-location'
    address.textContent = project.address
    heading.append(reference, name, address)
    const body = document.createElement('div')
    body.className = 'project-marker-body'
    const progress = document.createElement('p')
    progress.textContent = project.progress + '% reported physical completion'
    body.append(progress)
    popup.append(heading, body)
    marker.bindPopup(popup, { className: 'project-map-popup', maxWidth: 290, minWidth: 220 })
    map.createPane('legazpi-labels').style.zIndex = '450'
    map.getPane('legazpi-labels')!.style.pointerEvents = 'none'
    void loadProjectMapGeography(controller.signal).then(({ collection, outlines, labels: geography }) => {
      if (disposed) return
      const selected = projectBarangay(project.barangay, collection.features)
      L.geoJSON(outlines, {
        interactive: false,
        style: { color: '#4e6974', weight: 1.15, opacity: 0.66, fill: false, lineCap: 'round', lineJoin: 'round', smoothFactor: 0 } as L.PolylineOptions,
      }).addTo(map)
      if (selected) {
        const outline = L.geoJSON(selected, {
          interactive: false,
          style: { color: '#2d6281', weight: 1.7, opacity: 0.9, fill: false },
        }).addTo(map)
        barangayBounds = outline.getBounds().extend(point)
        if (expanded && atBarangayOverview()) showBarangay()
      } else setBoundaryMessage('The project’s barangay boundary could not be matched. Showing its location point.')
      const labels = L.layerGroup().addTo(map)
      disposeLabels = createBarangayLabels(map, labels, collection.features,
        getComputedStyle(canvas.current!).fontFamily || 'Inter, sans-serif', () => {
          const pin = map.latLngToContainerPoint(point)
          const width = map.getSize().x
          return [
            { left: pin.x - 22, right: pin.x + 22, top: pin.y - 42, bottom: pin.y + 8 },
            { left: width - 100, right: width, top: 0, bottom: 48 },
          ]
        }, () => selected?.properties.pcode ?? '', undefined, undefined, () => 'natural', geography)
    }).catch(() => {
      if (!disposed) setBoundaryMessage('Barangay boundaries are unavailable. Showing the project’s location point.')
    })
    const observer = new ResizeObserver(() => {
      const size = L.point(map.getContainer().clientWidth, map.getContainer().clientHeight)
      if (size.equals(previousSize)) return
      previousSize = size
      const keepBarangayOverview = expanded && atBarangayOverview()
      cityView.resize()
      if (keepBarangayOverview) showBarangay()
    })
    observer.observe(canvas.current)
    return () => {
      disposed = true; controller.abort(); observer.disconnect(); disposeLabels?.()
      disposeWheelZoom(); cityView.dispose(); tileMirror.dispose()
      mapInstance.current = null
      recenter.current = null; barangayView.current = null; streetDetail.current = null; map.remove()
    }
  }, [expanded, project, retry])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    // Allow mouse/touch movement and double-tap zoom in either map size.
    map.dragging.enable()
    map.doubleClickZoom.enable()
    map.touchZoom.enable()
    if (expanded) map.scrollWheelZoom.enable()
    else map.scrollWheelZoom.disable()
  }, [expanded, project, retry])

  const message = tilesUnavailable ? 'Map tiles are unavailable. The project marker and available boundaries are still shown.' : boundaryMessage
  return <div className="map-card"><div className="project-detail-map legazpi-map" data-navigation={expanded ? 'map' : 'page'}>
    <div className="project-detail-map-canvas" data-appearance="natural" ref={canvas} role="region" aria-label={`Natural map of ${projectLocationLabel(project.barangay)}: ${project.name}, illustrative location. Restricted to Legazpi City. Drag to move. Double-tap, double-click, or pinch to zoom.${expanded ? ' Scroll to zoom.' : ''} Use arrow keys to pan and plus or minus to zoom when focused.`} />
    <div className="project-detail-map-views" role="group" aria-label="Map detail level"><button type="button" aria-pressed={!streetView} onClick={() => barangayView.current?.()}>Barangay</button><button type="button" aria-pressed={streetView} onClick={() => streetDetail.current?.()}>Street detail</button></div>
    <button className="project-detail-recenter" type="button" aria-label="Center on project marker" title="Center on project marker" onClick={() => recenter.current?.()}><Icon name="location" size={17} /></button>
    {message && <div className="project-detail-map-error" role="status"><span>{message}</span><button type="button" onClick={() => { invalidateProjectMapGeography(); setRetry(value => value + 1) }}>Retry</button></div>}
  </div><div className="map-caption"><div><b>{project.coordinates[0].toFixed(5)}, {project.coordinates[1].toFixed(5)}</b><small>Demo coordinates</small></div></div></div>
}
