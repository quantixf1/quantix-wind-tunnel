/**
 * Analytic flow field around a simplified car body (ellipsoid + wake).
 *
 * Every visualization shares one wind basis (forward / right / up). The field is
 * evaluated in wind-space (free stream always +Z_w / streamwise), then velocities
 * are transformed back to world space. World +Z is never assumed to be upstream.
 */

import * as THREE from 'three'
import type { ModelBounds, WindParams } from '../types'

// ─── Shared wind basis ───────────────────────────────────────────────────────

export interface WindBasis {
  /** Unit free-stream direction (where the wind goes / downstream) */
  forward: THREE.Vector3
  /** Unit lateral axis (perpendicular to forward on the ground plane) */
  right: THREE.Vector3
  /** Unit vertical axis */
  up: THREE.Vector3
  /** Yaw in radians */
  yaw: number
}

/**
 * Build the orthonormal wind basis from a direction angle in degrees.
 *
 *  0° → (0, 0, -1)  front → rear
 * 90° → (1, 0,  0)  left  → right
 * 180° → (0, 0, 1)  rear  → front
 * 270° → (-1, 0, 0) right → left
 */
export function getWindBasis(directionDeg: number): WindBasis {
  // Normalize so 0/360 and negative angles map cleanly
  const deg = ((directionDeg % 360) + 360) % 360
  const yaw = THREE.MathUtils.degToRad(deg)
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw)).normalize()
  // Ground-plane perpendicular: matches up × forward
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize()
  const up = new THREE.Vector3(0, 1, 0)
  return { forward, right, up, yaw }
}

// Scratch vectors (module-private, never returned)
const _pWind = new THREE.Vector3()
const _vWind = new THREE.Vector3()
const _vWorld = new THREE.Vector3()
const _tmp = new THREE.Vector3()

/**
 * World → wind space.
 * X_w = lateral (right), Y_w = vertical (up), Z_w = streamwise (forward, +downstream).
 */
export function worldToWind(
  worldPos: THREE.Vector3,
  basis: WindBasis,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  return out.set(
    basis.right.dot(worldPos),
    basis.up.dot(worldPos),
    basis.forward.dot(worldPos),
  )
}

/**
 * Wind-space velocity → world velocity.
 * v_world = v_x * right + v_y * up + v_z * forward
 */
export function windVelocityToWorld(
  vWind: THREE.Vector3,
  basis: WindBasis,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  return out
    .copy(basis.right)
    .multiplyScalar(vWind.x)
    .addScaledVector(basis.up, vWind.y)
    .addScaledVector(basis.forward, vWind.z)
}

/**
 * Point on the rotating inlet (upstream) plane:
 *   seed = forward * inletDistance + right * lateralOffset + up * verticalOffset
 *
 * Pass a **negative** inletDistance so seeds sit upstream of the origin
 * (forward points downstream).
 */
export function inletSeed(
  basis: WindBasis,
  inletDistance: number,
  lateral: number,
  vertical: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  return out
    .copy(basis.forward)
    .multiplyScalar(inletDistance)
    .addScaledVector(basis.right, lateral)
    .addScaledVector(basis.up, vertical)
}

/** Upstream inlet distance (positive length → negative streamwise offset). */
export function defaultInletDistance(bounds: ModelBounds): number {
  return -(bounds.length * 0.75 + 0.8)
}

/** Downstream far-field streamwise coordinate for domain exit tests. */
export function defaultOutletDistance(bounds: ModelBounds): number {
  return bounds.length * 1.3 + 1.2
}

// ─── Flow sample ─────────────────────────────────────────────────────────────

export interface FlowSample {
  velocity: THREE.Vector3
  speed: number
  /** Normalized 0–1 pressure proxy (high = stagnation) */
  pressure: number
  /** 0–1 turbulence / separation intensity */
  turbulence: number
  inWake: boolean
}

/**
 * Analytic flow in wind-space (free stream always +Z_w), returned in world space.
 */
function sampleFlowWindSpace(
  pWind: THREE.Vector3,
  speed: number,
  turbulenceLevel: number,
  bounds: ModelBounds,
  outWindVel: THREE.Vector3,
): { pressure: number; turbulence: number; inWake: boolean } {
  // Body ellipsoid aligned with wind axes (educational approximation)
  const rx = Math.max(bounds.width * 0.55, 0.15)
  const ry = Math.max(bounds.height * 0.65, 0.1)
  const rz = Math.max(bounds.length * 0.5, 0.4)

  const x = pWind.x
  const y = pWind.y
  const z = pWind.z // +downstream

  const nx = x / rx
  const ny = (y - ry * 0.5) / ry
  const nz = z / rz
  const r2 = nx * nx + ny * ny + nz * nz
  const r = Math.sqrt(Math.max(r2, 1e-8))

  // Free stream in wind space: (0, 0, +U)
  if (r2 < 0.85) {
    outWindVel.set(0, 0, speed * 0.05)
    return { pressure: 0.9, turbulence: 0.2, inWake: false }
  }

  // Dipole-like deflection around body (potential-flow inspired)
  const invR3 = 1 / Math.max(r2 * r, 0.2)
  const dipole = 1.8 * invR3
  outWindVel.set(0, 0, speed)

  // Free stream · n  (free stream is ê_z)
  const nDotU = nz / Math.max(r, 0.01)
  _tmp.set(nx, ny * 0.4, nz).multiplyScalar(dipole * nDotU * speed)
  outWindVel.add(_tmp)

  // Roof acceleration (venturi-ish) near body in streamwise band
  if (y > ry * 0.3 && Math.abs(z) < rz * 1.1 && Math.abs(x) < rx * 1.4) {
    const roof = Math.exp(-Math.pow((y - ry) / (ry * 0.8), 2))
    outWindVel.z *= 1 + 0.65 * roof
    // Mild lift over the body, settle behind
    outWindVel.y += roof * speed * 0.12 * (z < 0 ? 1 : -0.4)
  }

  // Wake: only downstream of the body (z > +rz * 0.3 in wind space)
  const behind = z > rz * 0.3
  const lateralR = Math.sqrt(x * x + Math.pow(y - ry * 0.3, 2))
  const wakeRadius = rz * 0.85 + Math.max(0, z - rz * 0.3) * 0.35
  const inWake = behind && lateralR < wakeRadius * (1 + turbulenceLevel)

  let turb = turbulenceLevel * 0.3
  if (inWake) {
    const wakeDepth = Math.min(1, (z - rz * 0.3) / (rz * 2))
    const core = 1 - lateralR / Math.max(wakeRadius, 0.01)
    const deficit = 0.82 * core * (1 - wakeDepth * 0.25)
    outWindVel.multiplyScalar(1 - deficit)
    // Swirl / recirculation near base (in wind-space lateral/vertical)
    outWindVel.x += Math.sin(z * 5 + y * 3) * speed * 0.22 * core
    outWindVel.y += Math.cos(x * 6) * speed * 0.14 * core * (1 - wakeDepth)
    turb = Math.min(1, 0.6 + core * 0.7 + turbulenceLevel * 0.4)
  }

  // Separation near rear of body (streamwise ≈ +rz)
  const nearRear = Math.abs(z - rz * 0.85) < 0.2 && Math.abs(y) < ry * 1.2
  if (nearRear) turb = Math.min(1, turb + 0.35)

  // Turbulent noise in wind space
  if (turbulenceLevel > 0.01) {
    const t = turbulenceLevel
    outWindVel.x += Math.sin(x * 5.1 + z * 2.3) * speed * 0.04 * t
    outWindVel.y += Math.cos(y * 4.7 + x * 3.1) * speed * 0.03 * t
    outWindVel.z += Math.sin(z * 3.9 + y * 2.7) * speed * 0.04 * t
  }

  // Floor boundary (Y_w ≈ world Y)
  if (y < 0.08) {
    outWindVel.y *= y / 0.08
    outWindVel.x *= 0.85 + y * 2
    outWindVel.z *= 0.85 + y * 2
  }

  const spd = outWindVel.length()
  const ratio = spd / Math.max(speed, 1e-6)
  const pressure = Math.max(0, Math.min(1, 1.1 - ratio * 0.9))

  return { pressure, turbulence: turb, inWake }
}

/**
 * Sample approximate velocity at a world-space point.
 * Rotates the entire field with wind.direction via the shared wind basis.
 */
export function sampleFlow(
  position: THREE.Vector3,
  wind: WindParams,
  bounds: ModelBounds,
  out: FlowSample = {
    velocity: new THREE.Vector3(),
    speed: 0,
    pressure: 0,
    turbulence: 0,
    inWake: false,
  },
  basis?: WindBasis,
): FlowSample {
  const speed = Math.max(0.01, wind.speed)
  const b = basis ?? getWindBasis(wind.direction)

  worldToWind(position, b, _pWind)
  const meta = sampleFlowWindSpace(_pWind, speed, wind.turbulence, bounds, _vWind)
  windVelocityToWorld(_vWind, b, _vWorld)

  out.velocity.copy(_vWorld)
  out.speed = _vWorld.length()
  out.pressure = meta.pressure
  out.turbulence = meta.turbulence
  out.inWake = meta.inWake
  return out
}

/**
 * True when a world point is outside the simulation domain (wind-space box).
 */
export function isOutsideDomain(
  worldPos: THREE.Vector3,
  basis: WindBasis,
  bounds: ModelBounds,
): boolean {
  worldToWind(worldPos, basis, _pWind)
  const inlet = defaultInletDistance(bounds) - 0.5
  const outlet = defaultOutletDistance(bounds) + 0.5
  const halfLat = Math.max(bounds.width * 2.2, 2.2)
  const maxY = Math.max(bounds.height * 3.2, 2.5)

  if (_pWind.z < inlet || _pWind.z > outlet) return true
  if (Math.abs(_pWind.x) > halfLat) return true
  if (_pWind.y < -0.15 || _pWind.y > maxY) return true
  return false
}

/** Random seed on the rotating inlet plane (world space). */
export function randomInletSeed(
  basis: WindBasis,
  bounds: ModelBounds,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const inletDist = defaultInletDistance(bounds) - Math.random() * 0.6
  const halfLat = Math.max(bounds.width * 1.75, 0.9)
  const lateral = (Math.random() - 0.5) * halfLat * 2
  const vertical = 0.02 + Math.random() * Math.max(bounds.height * 2.8, 0.9)
  return inletSeed(basis, inletDist, lateral, vertical, out)
}

/** Integrate a streamline downstream from a world-space seed. */
export function integrateStreamline(
  seed: THREE.Vector3,
  wind: WindParams,
  bounds: ModelBounds,
  steps = 48,
  dt = 0.04,
  basis?: WindBasis,
): THREE.Vector3[] {
  const b = basis ?? getWindBasis(wind.direction)
  const points: THREE.Vector3[] = []
  const p = seed.clone()
  const sample: FlowSample = {
    velocity: new THREE.Vector3(),
    speed: 0,
    pressure: 0,
    turbulence: 0,
    inWake: false,
  }

  for (let i = 0; i < steps; i++) {
    points.push(p.clone())
    sampleFlow(p, wind, bounds, sample, b)
    if (sample.speed < 0.01) break
    const step = Math.min(dt, 0.12 / sample.speed)
    p.addScaledVector(sample.velocity, step)
    if (isOutsideDomain(p, b, bounds)) break
  }
  return points
}

/** Grid point in wind-aligned coordinates → world (for vector field sampling). */
export function windGridToWorld(
  basis: WindBasis,
  lateral: number,
  vertical: number,
  streamwise: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  return inletSeed(basis, streamwise, lateral, vertical, out)
}
