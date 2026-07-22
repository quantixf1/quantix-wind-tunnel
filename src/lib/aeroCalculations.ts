/**
 * Simplified aerodynamic estimators for browser use.
 *
 * These are educational approximations — NOT full Navier–Stokes CFD.
 * They combine classical drag/lift equations with geometry-derived shape factors
 * so students can explore trends (speed, density, shape) without a solver backend.
 */

import type { AeroResults, ModelBounds, WindParams } from '../types'

/** Standard sea-level air properties helper (optional override via WindParams) */
export function densityFromTemperature(tempC: number, baseDensity = 1.225): number {
  // Ideal-gas style correction around 15 °C reference
  const tK = tempC + 273.15
  const tRef = 288.15
  return baseDensity * (tRef / tK)
}

/**
 * Shape factor from bounding-box aspect ratios.
 * Longer, lower cars get slightly better (lower) Cd estimates.
 */
export function estimateShapeFactor(bounds: ModelBounds): number {
  const { width, height, length } = bounds
  if (length <= 0 || height <= 0 || width <= 0) return 1

  const fineness = length / Math.max(height, 0.01)
  const widthRatio = width / Math.max(height, 0.01)

  // Baseline Cd ~0.55 for a bluff F1-in-Schools-like body
  let factor = 0.55

  // Streamlined length helps
  factor -= Math.min(0.18, (fineness - 2) * 0.04)
  // Wide tall faces hurt
  factor += Math.max(0, (widthRatio - 1.2) * 0.05)
  // Very tall relative to length hurts
  factor += Math.max(0, (height / length - 0.25) * 0.3)

  return Math.max(0.28, Math.min(0.95, factor))
}

/** Dynamic pressure q = ½ ρ V² */
export function dynamicPressure(density: number, speed: number): number {
  return 0.5 * density * speed * speed
}

/** Reynolds number Re = ρ V L / μ */
export function reynoldsNumber(
  density: number,
  speed: number,
  length: number,
  viscosity: number,
): number {
  if (viscosity <= 0 || length <= 0) return 0
  return (density * speed * length) / viscosity
}

/**
 * Estimate frontal area from model bounds.
 * Applies a fill factor — cars are not solid rectangles.
 */
export function estimateFrontalArea(bounds: ModelBounds): number {
  if (bounds.frontalArea > 0) return bounds.frontalArea
  return bounds.width * bounds.height * 0.72
}

/**
 * Approximate lift / downforce coefficient from height and turbulence.
 * Negative Cl ⇒ downforce (common for race cars with wings).
 */
export function estimateLiftCoefficient(bounds: ModelBounds, turbulence: number): number {
  const hOverL = bounds.height / Math.max(bounds.length, 0.01)
  // Low bodies with some turbulence → mild downforce
  let cl = -0.35 + hOverL * 0.4 + turbulence * 0.15
  return Math.max(-1.2, Math.min(0.4, cl))
}

/**
 * Build pressure distribution samples along body length (Cp-like).
 * Stagnation at nose, recovery, mild suction on upper surfaces, base pressure in wake.
 */
export function samplePressureDistribution(
  sampleCount: number,
  cd: number,
  speed: number,
): number[] {
  const samples: number[] = []
  const n = Math.max(8, sampleCount)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    // Stagnation peak near nose, suction mid-body, low base pressure
    const stagnation = Math.exp(-t * 8) * 1.0
    const suction = -0.35 * Math.sin(Math.PI * t) * (0.6 + cd)
    const base = t > 0.85 ? -0.2 * cd : 0
    // Slight speed-dependent fluctuation for liveliness
    const wobble = Math.sin(t * 12 + speed * 0.1) * 0.02
    samples.push(stagnation + suction + base + wobble)
  }
  return samples
}

/**
 * Velocity magnitude samples along a mid-plane streamline (normalized to free-stream).
 */
export function sampleVelocityDistribution(
  sampleCount: number,
  cd: number,
  turbulence: number,
): number[] {
  const samples: number[] = []
  const n = Math.max(8, sampleCount)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    // Slowdown near body midsection, recovery in far wake with deficit
    let v = 1.0
    if (t < 0.15) v = 0.95 + t * 0.2
    else if (t < 0.55) v = 1.15 - (t - 0.15) * 0.9 // acceleration over body then drop
    else if (t < 0.75) v = 0.55 + turbulence * 0.1 // wake core
    else v = 0.55 + (t - 0.75) * 1.2 // recovery

    v -= cd * 0.08 * Math.exp(-Math.pow((t - 0.65) / 0.15, 2))
    samples.push(Math.max(0.15, Math.min(1.4, v)))
  }
  return samples
}

/**
 * Core aero estimation used by the results dashboard and force arrows.
 */
export function computeAeroResults(wind: WindParams, bounds: ModelBounds): AeroResults {
  const density = wind.density
  const speed = Math.max(0, wind.speed)
  const area = estimateFrontalArea(bounds)
  const cdBase = estimateShapeFactor(bounds)

  // Turbulence and viscosity mildly increase effective drag
  const turbPenalty = 1 + wind.turbulence * 0.12
  const re = reynoldsNumber(density, speed, bounds.length, wind.viscosity)
  // Crude Re correction: very low Re → higher Cd
  const reFactor = re > 0 ? 1 + 800 / Math.sqrt(re + 1) * 0.02 : 1.15
  const cd = Math.max(0.2, Math.min(1.2, cdBase * turbPenalty * reFactor * 0.92))

  const cl = estimateLiftCoefficient(bounds, wind.turbulence)
  const q = dynamicPressure(density, speed)

  const dragForce = q * cd * area
  const liftForce = q * cl * area // negative = downforce
  const downforce = -Math.min(0, liftForce)

  return {
    dragForce,
    liftForce,
    downforce,
    dragCoefficient: cd,
    liftCoefficient: cl,
    frontalArea: area,
    reynoldsNumber: re,
    dynamicPressure: q,
    pressureSamples: samplePressureDistribution(32, cd, speed),
    velocitySamples: sampleVelocityDistribution(32, cd, wind.turbulence),
  }
}

/** Format helpers for UI */
export function formatForce(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(3)
}

export function formatCd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(3)
}

export function formatArea(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(4)
}
