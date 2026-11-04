import type { BoundaryCollection } from '../../map/boundaryData.ts'
import { completeBoundaries } from '../../map/sharedBoundaries.ts'
import { prepareLabelGeography } from '../../map/labelGeography.ts'
import type { LabelGeography } from '../../map/labelGeography.ts'

export type ProjectMapGeography = {
  collection: BoundaryCollection
  outlines: ReturnType<typeof completeBoundaries>
  labels: Record<string, LabelGeography>
}

export function prepareProjectMapGeography(collection: BoundaryCollection): ProjectMapGeography {
  return {
    collection,
    outlines: completeBoundaries(collection.features),
    labels: Object.fromEntries(collection.features.map(feature => [feature.properties.pcode, prepareLabelGeography(feature)])),
  }
}
