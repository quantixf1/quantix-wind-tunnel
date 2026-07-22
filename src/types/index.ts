/** Shared domain types for Quantix Virtual Wind Tunnel */

export type CameraMode = 'perspective' | 'orthographic'

export type VisualizationMode =
  | 'streamlines'
  | 'particles'
  | 'vectors'
  | 'pressure'
  | 'velocity'
  | 'smoke'
  | 'wake'
  | 'separation'
  | 'turbulence'

export type SimulationStatus = 'idle' | 'running' | 'paused'

export interface WindParams {
  /** Free-stream wind speed in m/s (0–40) */
  speed: number
  /**
   * Wind yaw angle in degrees (0–360).
   * 0° front→rear, 90° left→right, 180° rear→front, 270° right→left.
   */
  direction: number
  /** Air density in kg/m³ */
  density: number
  /** Turbulence intensity 0–1 */
  turbulence: number
  /** Ambient temperature in °C */
  temperature: number
  /** Dynamic viscosity in Pa·s */
  viscosity: number
}

export interface ModelBounds {
  width: number
  height: number
  length: number
  /** Approximate frontal area in m² (after scale normalization) */
  frontalArea: number
  triangleCount: number
}

export interface AeroResults {
  dragForce: number
  liftForce: number
  downforce: number
  dragCoefficient: number
  liftCoefficient: number
  frontalArea: number
  reynoldsNumber: number
  dynamicPressure: number
  /** Sampled pressure coefficients along the body (normalized 0–1 length) */
  pressureSamples: number[]
  /** Sampled velocity magnitudes along streamwise axis */
  velocitySamples: number[]
}

export interface VisualizationToggles {
  streamlines: boolean
  particles: boolean
  vectors: boolean
  pressureMap: boolean
  velocityMap: boolean
  separation: boolean
  turbulence: boolean
  wake: boolean
  smoke: boolean
  forceArrows: boolean
  wireframe: boolean
  grid: boolean
}

export interface HistoryPoint {
  time: number
  drag: number
  lift: number
  cd: number
  speed: number
}

export interface LoadedModelMeta {
  name: string
  format: string
  triangleCount: number
}
