import { loadBoundaries } from '../../map/boundaryData.ts'
import { prepareProjectMapGeography } from './projectMapGeography.ts'

const scope = self as unknown as { onmessage: (() => void) | null; postMessage(message: unknown): void }
scope.onmessage = async () => {
  try {
    const collection = await loadBoundaries('barangays', new AbortController().signal)
    scope.postMessage({ result: prepareProjectMapGeography(collection) })
  } catch (error) {
    scope.postMessage({ error: error instanceof Error ? error.message : 'Barangay boundaries are unavailable.' })
  }
}
