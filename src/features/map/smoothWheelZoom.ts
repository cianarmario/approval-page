import * as L from 'leaflet'

// Leaflet 1.9's own pinch handler uses these movement primitives. Keeping one
// movement open avoids resetting layers, loading tiles and snapping each frame.
type GestureMap = L.Map & {
  _loaded: boolean
  _animatingZoom?: boolean
  _animateToZoom: number
  _stop(): void
  _moveStart(zoomChanged: boolean): void
  _move(center: L.LatLng, zoom: number, data: { pinch: boolean; round: boolean }): void
  _moveEnd(zoomChanged: boolean): void
  _limitCenter(center: L.LatLng, zoom: number, bounds?: L.LatLngBoundsExpression): L.LatLng
}

/** Continuous wheel/trackpad and queued zoom-button input; native pinch stays intact. */
export function configureSmoothWheelZoom(instance: L.Map) {
  const map = instance as GestureMap
  const container = map.getContainer()
  const original = map.scrollWheelZoom
  original.disable()
  let frame = 0
  let active = false
  let started = false
  let ownMovement = false
  let target = 0
  let lastTime = 0
  let lastInput = 0
  let pointer = L.point(0, 0)
  let anchor: L.LatLng
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const clamp = (zoom: number) => Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom))

  const finish = () => {
    cancelAnimationFrame(frame)
    frame = 0
    active = false
    if (!started) return
    started = false
    ownMovement = true
    // Commit final tile levels without the pinch flag, allowing old tiles to
    // be pruned after the continuous movement rather than retaining them.
    map.fire('zoom')
    map._moveEnd(true)
    ownMovement = false
  }
  const zoomControl = (target: EventTarget | null | undefined) => target instanceof Element ?
    target.closest<HTMLElement>('.leaflet-control-zoom-in, .leaflet-control-zoom-out') : null
  const interrupt = (event?: Event | L.LeafletEvent) => {
    // Pressing a zoom button again extends the current target. A capture-phase
    // mouse/touch start must not discard that target before the click arrives.
    if (map.options.zoomAnimation && zoomControl(event?.target)) return
    if (!ownMovement) finish()
  }
  const step = (now: number) => {
    frame = 0
    if (!active) return
    // Let an existing native double-click/programmatic transition settle first.
    if (map._animatingZoom) { frame = requestAnimationFrame(step); return }
    if (!started) {
      map._stop()
      anchor = map.containerPointToLatLng(pointer)
      ownMovement = true
      map._moveStart(true)
      ownMovement = false
      started = true
      lastTime = now - 16
    }
    target = clamp(target)
    const current = map.getZoom()
    const elapsed = Math.min(64, Math.max(1, now - lastTime))
    const progress = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 40)
    const next = Math.abs(target - current) < .001 ? target : current + (target - current) * progress
    const offset = pointer.subtract(map.getSize().divideBy(2))
    const center = map.unproject(map.project(anchor, next).subtract(offset), next)
    ownMovement = true
    map._move(map._limitCenter(center, next, map.options.maxBounds), next, { pinch: true, round: false })
    ownMovement = false
    lastTime = now
    if (next === target && now - lastInput >= 80) finish()
    else frame = requestAnimationFrame(step)
  }
  const enqueue = (delta: number, point: L.Point) => {
    pointer = point
    if (!active) {
      target = map._animatingZoom ? map._animateToZoom : map.getZoom()
      active = true
    } else if (started) anchor = map.containerPointToLatLng(pointer)
    target = clamp(target + delta)
    lastInput = window.performance.now()
    if (!frame) frame = requestAnimationFrame(step)
  }
  const wheel = (event: WheelEvent) => {
    if (!map._loaded || !Number.isFinite(event.deltaY)) return
    const delta = L.DomEvent.getWheelDelta(event)
    if (!delta) return
    event.preventDefault()
    event.stopPropagation()
    // Keep Leaflet's normalized units, small trackpad deltas and notch limits.
    const sensitivity = event.ctrlKey ? 80 : (map.options.wheelPxPerZoomLevel ?? 180)
    enqueue(Math.max(-1, Math.min(1, delta / sensitivity)), map.mouseEventToContainerPoint(event))
  }
  const control = (event: MouseEvent) => {
    const button = zoomControl(event.target)
    const disabled = (map.zoomControl as (L.Control.Zoom & { _disabled?: boolean }) | undefined)?._disabled
    if (!button || !map._loaded || !map.options.zoomAnimation || !L.Browser.any3d ||
      disabled || (button.classList.contains('leaflet-disabled') && !active)) return
    event.preventDefault(); event.stopImmediatePropagation()
    // Native animated zoom drops repeated setZoom calls during its transition.
    // Accumulate every press while retaining the same controls, limits and steps.
    const direction = button.classList.contains('leaflet-control-zoom-in') ? 1 : -1
    enqueue(direction * (map.options.zoomDelta ?? 1) * (event.shiftKey ? 3 : 1), map.getSize().divideBy(2))
    if (event.screenX > 0 && event.screenY > 0) container.focus({ preventScroll: true })
  }
  const handler = new L.Handler(map)
  handler.addHooks = () => {
    container.addEventListener('wheel', wheel, { passive: false })
    container.addEventListener('click', control, true)
    // Finish before Leaflet samples a new drag, pinch, key or double-click.
    for (const name of ['mousedown', 'touchstart', 'keydown', 'dblclick']) container.addEventListener(name, interrupt, true)
    map.on('zoomstart movestart resize zoomlevelschange', interrupt)
  }
  handler.removeHooks = () => {
    container.removeEventListener('wheel', wheel)
    container.removeEventListener('click', control, true)
    for (const name of ['mousedown', 'touchstart', 'keydown', 'dblclick']) container.removeEventListener(name, interrupt, true)
    map.off('zoomstart movestart resize zoomlevelschange', interrupt)
    finish()
  }
  map.scrollWheelZoom = handler
  handler.enable()
  return () => { handler.disable(); map.scrollWheelZoom = original }
}
