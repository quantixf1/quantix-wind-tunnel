/**
 * Export helpers: screenshot PNG and results JSON/CSV.
 */

import type { AeroResults, WindParams, HistoryPoint, LoadedModelMeta } from '../types'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Capture the WebGL canvas as PNG */
export function exportScreenshot(canvas: HTMLCanvasElement | null, name = 'quantix-screenshot'): void {
  if (!canvas) {
    console.warn('No canvas available for screenshot')
    return
  }
  canvas.toBlob((blob) => {
    if (!blob) return
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    downloadBlob(blob, `${name}-${stamp}.png`)
  }, 'image/png')
}

export interface ExportPayload {
  app: string
  disclaimer: string
  exportedAt: string
  model: LoadedModelMeta | null
  wind: WindParams
  results: AeroResults
  history: HistoryPoint[]
}

export function exportResultsJson(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadBlob(blob, `quantix-results-${stamp}.json`)
}

export function exportResultsCsv(payload: ExportPayload): void {
  const { wind, results, model } = payload
  const rows = [
    ['field', 'value', 'unit'],
    ['model', model?.name ?? 'none', ''],
    ['wind_speed', String(wind.speed), 'm/s'],
    ['wind_direction', String(wind.direction), 'deg'],
    ['air_density', String(wind.density), 'kg/m3'],
    ['turbulence', String(wind.turbulence), '0-1'],
    ['temperature', String(wind.temperature), 'C'],
    ['viscosity', String(wind.viscosity), 'Pa.s'],
    ['drag_force', String(results.dragForce), 'N'],
    ['lift_force', String(results.liftForce), 'N'],
    ['downforce', String(results.downforce), 'N'],
    ['Cd', String(results.dragCoefficient), ''],
    ['Cl', String(results.liftCoefficient), ''],
    ['frontal_area', String(results.frontalArea), 'm2'],
    ['reynolds', String(results.reynoldsNumber), ''],
    ['dynamic_pressure', String(results.dynamicPressure), 'Pa'],
    ['disclaimer', payload.disclaimer, ''],
  ]
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadBlob(blob, `quantix-results-${stamp}.csv`)
}
