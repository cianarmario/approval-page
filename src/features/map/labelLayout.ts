import type { ScreenRectangle } from './landmarkLayout.ts'

/** Fractional zoom typography stays legible at overview and bounded at street level. */
export function mapLabelSizes(zoom: number, viewportWidth: number) {
  const detail = Math.max(0, Math.min(1, (zoom - 11) / 8))
  const compact = viewportWidth < 580
  return {
    barangay: 11 + detail * (compact ? 3 : 4),
    badge: 10 + detail * 2,
    pin: 8 + detail * 4,
    mountain: 13 + detail * 5,
    direction: (compact ? 12 : 13) + detail * 2,
  }
}

/** Unboxed Standard and Satellite names remain small at street-level zoom. */
export function minimalBarangayLabelSize(zoom: number, viewportWidth: number) {
  const detail = Math.max(0, Math.min(1, (zoom - 11) / 9))
  return 10 + detail * (viewportWidth < 580 ? 1 : 2)
}

export function centeredLabelRectangle(x: number, y: number, width: number, height: number): ScreenRectangle {
  return { left: x - width / 2 - 6, right: x + width / 2 + 6,
    top: y - height / 2 - 4, bottom: y + height / 2 + 4 }
}
