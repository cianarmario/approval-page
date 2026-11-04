import { BARANGAY_PROFILES, barangayAddress } from '../../map/barangayProfiles.ts'

/** Share the existing city catalog; keep current barangay numbers, not PCODE suffixes. */
export const legazpiBarangays = Object.entries(BARANGAY_PROFILES)
  .map(([number, profile]) => ({ number: Number(number), name: profile.name,
    formerNumbers: profile.formerNumbers ?? [], label: barangayAddress(Number(number))! }))
  .sort((a, b) => a.number - b.number)

const labels = new Map(legazpiBarangays.map(barangay => [barangay.name, barangay.label]))

export const isBarangayLocation = (location: string) => labels.has(location)
export const projectLocationLabel = (location: string) => labels.get(location) ?? location
