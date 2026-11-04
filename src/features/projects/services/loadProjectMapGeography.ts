import { loadBoundaries } from '../../map/boundaryData.ts'
import { prepareProjectMapGeography } from './projectMapGeography.ts'
import type { ProjectMapGeography } from './projectMapGeography.ts'

// Reuse the verified, prepared dataset when another project opens. Only one
// dataset is retained; Retry invalidates it and page reloads fetch it afresh.
let prepared: ProjectMapGeography | undefined
let generation = 0
export function invalidateProjectMapGeography() { prepared = undefined; generation++ }

export async function loadProjectMapGeography(signal: AbortSignal): Promise<ProjectMapGeography> {
  signal.throwIfAborted()
  if (prepared) return prepared
  const requestGeneration = generation
  if (typeof Worker === 'undefined') {
    const collection = await loadBoundaries('barangays', signal)
    signal.throwIfAborted()
    const result = prepareProjectMapGeography(collection)
    if (generation === requestGeneration) prepared = result
    return result
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./projectMapGeography.worker.ts', import.meta.url), { type: 'module' })
    const finish = () => { worker.terminate(); signal.removeEventListener('abort', abort) }
    const abort = () => { finish(); reject(signal.reason) }
    signal.addEventListener('abort', abort, { once: true })
    worker.onmessage = ({ data }: MessageEvent<{ result?: ProjectMapGeography; error?: string }>) => {
      finish()
      if (signal.aborted) { reject(signal.reason); return }
      if (data.result) {
        if (generation === requestGeneration) prepared = data.result
        resolve(data.result)
      }
      else reject(new Error(data.error || 'Barangay boundaries are unavailable.'))
    }
    worker.onerror = () => { finish(); reject(new Error('Barangay boundaries could not be prepared.')) }
    worker.postMessage({})
  })
}
