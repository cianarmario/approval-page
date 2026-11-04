import type * as L from 'leaflet'

type Job = { priority: number; run: () => void; dirty: boolean; last: number }
type Queue = ReturnType<typeof createQueue>
const queues = new WeakMap<L.Map, Queue>()

/** One ordered layout pass per map; Leaflet still moves geographic anchors every frame. */
function createQueue(map: L.Map) {
  const jobs = new Set<Job>()
  let frame = 0, timer = 0, moving = false, flushing = false
  let batch: Job[] | undefined
  const wake = () => {
    window.clearTimeout(timer); timer = 0
    if (!frame) frame = requestAnimationFrame(flush)
  }
  const flush = (now: number) => {
    frame = 0
    flushing = true
    let wait = Infinity, yielded = false, ran = false
    const start = performance.now(), budget = moving ? 6 : 10
    // Dependencies request later jobs during this same pass, rather than
    // synchronously repeating the entire marker -> geography -> names chain.
    const pending = batch ?? [...jobs].sort((a, b) => a.priority - b.priority)
    batch = undefined
    for (let index = 0; index < pending.length; index++) {
      const job = pending[index]
      if (!jobs.has(job) || !job.dirty) continue
      const remaining = moving ? 80 - (now - job.last) : 0
      if (remaining > 0) { wait = Math.min(wait, remaining); continue }
      // Leave time for Leaflet's camera, input and paint instead of running the
      // entire marker -> boats -> geography -> names chain in one long frame.
      if (ran && performance.now() - start >= budget) {
        // Finish this ordered batch before newer high-priority requests, so
        // continuous input cannot starve geographic names or boundary updates.
        batch = pending.slice(index); yielded = true; break
      }
      job.dirty = false; job.last = now; job.run()
      ran = true
    }
    flushing = false
    if (jobs.size && [...jobs].some(job => job.dirty)) {
      if (yielded) frame = requestAnimationFrame(flush)
      else timer = window.setTimeout(wake, Number.isFinite(wait) ? wait : 0)
    }
  }
  const start = () => { moving = true; batch = undefined }
  const end = () => { moving = false; batch = undefined; if ([...jobs].some(job => job.dirty)) wake() }
  map.on('zoomstart movestart', start)
  map.on('zoomend moveend', end)
  return {
    add(priority: number, run: () => void) {
      const job: Job = { priority, run, dirty: false, last: -Infinity }
      jobs.add(job)
      return {
        request() { if (!jobs.has(job)) return; job.dirty = true; if (!flushing && !frame && !timer) wake() },
        isMoving: () => moving,
        cancel() { job.dirty = false },
        dispose() {
          jobs.delete(job)
          if (jobs.size) return
          batch = undefined
          cancelAnimationFrame(frame); window.clearTimeout(timer)
          map.off('zoomstart movestart', start); map.off('zoomend moveend', end)
          queues.delete(map)
        },
      }
    },
  }
}

export function createMapFrameTask(map: L.Map, priority: number, run: () => void) {
  let queue = queues.get(map)
  if (!queue) { queue = createQueue(map); queues.set(map, queue) }
  return queue.add(priority, run)
}
