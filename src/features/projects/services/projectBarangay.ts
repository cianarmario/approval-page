import type { BoundaryFeature } from '../../map/boundaryData.ts'
import { legazpiBarangays } from '../data/barangays.ts'

const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ').trim()

/** Source names contain the current barangay number; PCODE suffixes can differ. */
export function projectBarangay(location: string, features: BoundaryFeature[]): BoundaryFeature | undefined {
  const name = normalize(location)
  const barangay = legazpiBarangays.find(item => [item.name, item.label, `${item.label}, Legazpi City`,
    `Barangay ${item.number} - ${item.name}`].some(label => normalize(label) === name))
  if (!barangay) return undefined
  return features.find(feature => Number(/^Bgy\.\s*(\d+)\s*-/i.exec(feature.properties.name)?.[1]) === barangay.number)
}
