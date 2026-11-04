export type ScreenRectangle = { left: number; right: number; top: number; bottom: number }
export type LandmarkCandidate = { id: string; x: number; y: number; width: number; height: number; priority: number }

export const intersects = (a: ScreenRectangle, b: ScreenRectangle) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

/** Shared exclusions for zoom/orientation, view actions, metric scale and credits. */
export function mapControlRectangles(width: number, height: number): ScreenRectangle[] {
  return [
    { left: 0, top: 0, right: 68, bottom: 168 },
    { left: 64, top: 0, right: Math.min(width, 364), bottom: 64 },
    { left: Math.max(68, width - 220), top: width <= 560 ? height - 120 : 0, right: width, bottom: width <= 560 ? height - 64 : 64 },
    { left: 0, top: height - 54, right: 130, bottom: height },
    { left: Math.max(0, width - 430), top: height - 52, right: width, bottom: height },
  ]
}

/** Recognizable artwork at the widest view; singleton barangays get a larger symbol. */
export function landmarkDimensions(size: [number, number], zoom: number, viewportWidth: number, emphasized = false, mobile = viewportWidth <= 900): [number, number] {
  const minimum = emphasized ? 48 : 32
  const maximum = emphasized ? 160 : 128
  const longest = Math.max(minimum, Math.min(maximum, minimum * 2 ** ((zoom - 11) / 4.5))) * (mobile ? .65 : viewportWidth < 580 ? .95 : 1)
  const scale = longest / Math.max(...size)
  return [Math.round(size[0] * scale), Math.round(size[1] * scale)]
}

/** Screen-pixel diameters keep satellite POIs small without shifting their anchors. */
export function satelliteDotSize(zoom: number): number {
  return 6 + Math.max(0, Math.min(1, (zoom - 11) / 9)) * 3
}

/** The artwork is centered on the published point, with a small label exclusion margin. */
export function landmarkRectangle(candidate: Pick<LandmarkCandidate, 'x' | 'y' | 'width' | 'height'>): ScreenRectangle {
  return { left: candidate.x - candidate.width / 2 - 3, right: candidate.x + candidate.width / 2 + 3,
    top: candidate.y - candidate.height / 2 - 3, bottom: candidate.y + candidate.height / 2 + 3 }
}

/** Overlap is intentional: never shrink, move, or replace an in-view icon to fit neighbors. */
export function layoutLandmarks(candidates: LandmarkCandidate[], viewport: { width: number; height: number }) {
  const visible = new Map<string, ScreenRectangle>()
  const canvas = { left: 0, top: 0, right: viewport.width, bottom: viewport.height }
  for (const candidate of candidates) {
    const rectangle = landmarkRectangle(candidate)
    if (intersects(rectangle, canvas)) visible.set(candidate.id, rectangle)
  }
  return visible
}
