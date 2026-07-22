/**
 * Global simulation state (Zustand).
 * Keeps wind params, viz toggles, aero results, and model metadata in one place.
 */

import { create } from 'zustand'
import { computeAeroResults } from '../lib/aeroCalculations'
import type {
  AeroResults,
  CameraMode,
  HistoryPoint,
  LoadedModelMeta,
  ModelBounds,
  SimulationStatus,
  VisualizationToggles,
  WindParams,
} from '../types'

const DEFAULT_BOUNDS: ModelBounds = {
  width: 0.55,
  height: 0.28,
  length: 2.2,
  frontalArea: 0.55 * 0.28 * 0.72,
  triangleCount: 0,
}

const DEFAULT_WIND: WindParams = {
  speed: 15,
  direction: 0,
  density: 1.225,
  turbulence: 0.15,
  temperature: 20,
  viscosity: 1.81e-5,
}

const DEFAULT_VIZ: VisualizationToggles = {
  streamlines: true,
  particles: true,
  vectors: false,
  pressureMap: false,
  velocityMap: false,
  separation: false,
  turbulence: false,
  wake: true,
  smoke: false,
  forceArrows: true,
  wireframe: false,
  grid: true,
}

function emptyResults(): AeroResults {
  return computeAeroResults(DEFAULT_WIND, DEFAULT_BOUNDS)
}

interface SimulationState {
  status: SimulationStatus
  wind: WindParams
  viz: VisualizationToggles
  cameraMode: CameraMode
  bounds: ModelBounds
  results: AeroResults
  history: HistoryPoint[]
  modelMeta: LoadedModelMeta | null
  /** Incremented on reset so particle systems reseed */
  resetToken: number
  fps: number
  elapsed: number
  /** Canvas ref setter used by screenshot export */
  glCanvas: HTMLCanvasElement | null

  setStatus: (s: SimulationStatus) => void
  start: () => void
  pause: () => void
  reset: () => void
  setWind: (partial: Partial<WindParams>) => void
  setViz: (partial: Partial<VisualizationToggles>) => void
  setCameraMode: (mode: CameraMode) => void
  setBounds: (bounds: ModelBounds) => void
  setModelMeta: (meta: LoadedModelMeta | null) => void
  setFps: (fps: number) => void
  setGlCanvas: (canvas: HTMLCanvasElement | null) => void
  tick: (dt: number) => void
  recompute: () => void
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  wind: { ...DEFAULT_WIND },
  viz: { ...DEFAULT_VIZ },
  cameraMode: 'perspective',
  bounds: { ...DEFAULT_BOUNDS },
  results: emptyResults(),
  history: [],
  modelMeta: null,
  resetToken: 0,
  fps: 0,
  elapsed: 0,
  glCanvas: null,

  setStatus: (status) => set({ status }),

  start: () => set({ status: 'running' }),

  pause: () => set({ status: 'paused' }),

  reset: () => {
    const { wind, bounds } = get()
    set({
      status: 'idle',
      elapsed: 0,
      history: [],
      results: computeAeroResults(wind, bounds),
      resetToken: get().resetToken + 1,
    })
  },

  setWind: (partial) => {
    const wind = { ...get().wind, ...partial }
    // Auto-adjust density when temperature changes if density not also set
    if (partial.temperature !== undefined && partial.density === undefined) {
      const tK = wind.temperature + 273.15
      wind.density = 1.225 * (288.15 / tK)
    }
    const results = computeAeroResults(wind, get().bounds)
    set({ wind, results })
  },

  setViz: (partial) => set({ viz: { ...get().viz, ...partial } }),

  setCameraMode: (cameraMode) => set({ cameraMode }),

  setBounds: (bounds) => {
    const results = computeAeroResults(get().wind, bounds)
    set({ bounds, results })
  },

  setModelMeta: (modelMeta) => set({ modelMeta }),

  setFps: (fps) => set({ fps }),

  setGlCanvas: (glCanvas) => set({ glCanvas }),

  recompute: () => {
    const results = computeAeroResults(get().wind, get().bounds)
    set({ results })
  },

  tick: (dt) => {
    const { status, wind, bounds, elapsed, history } = get()
    if (status !== 'running') return

    const nextElapsed = elapsed + dt
    const results = computeAeroResults(wind, bounds)

    // Append history ~10 Hz
    let nextHistory = history
    const last = history[history.length - 1]
    if (!last || nextElapsed - last.time >= 0.1) {
      nextHistory = [
        ...history.slice(-120),
        {
          time: nextElapsed,
          drag: results.dragForce,
          lift: results.liftForce,
          cd: results.dragCoefficient,
          speed: wind.speed,
        },
      ]
    }

    set({ elapsed: nextElapsed, results, history: nextHistory })
  },
}))
