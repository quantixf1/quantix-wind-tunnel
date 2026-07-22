/**
 * Optional Leva control panel — satisfies the Leva stack requirement.
 * Primary UI remains the minimal sidebars; Leva is collapsed by default.
 */

import { useEffect, useRef } from 'react'
import { useControls, folder, button, Leva } from 'leva'
import { useSimulationStore } from '../../store/simulationStore'
import { exportResultsJson, exportScreenshot } from '../../lib/exportUtils'

export function LevaSync() {
  const setWind = useSimulationStore((s) => s.setWind)
  // Prevent feedback when we programmatically ignore first paint
  const ready = useRef(false)

  const values = useControls({
    Wind: folder({
      speed: { value: 15, min: 0, max: 40, step: 0.5, label: 'Speed (m/s)' },
      direction: { value: 0, min: 0, max: 360, step: 1, label: 'Direction (°)' },
      density: { value: 1.225, min: 0.8, max: 1.4, step: 0.005, label: 'Density' },
      turbulence: { value: 0.15, min: 0, max: 1, step: 0.01 },
      temperature: { value: 20, min: -10, max: 45, step: 0.5, label: 'Temp (°C)' },
      viscosity: {
        value: 1.81e-5,
        min: 1.5e-5,
        max: 2.5e-5,
        step: 1e-7,
        label: 'Viscosity',
      },
    }),
    Simulation: folder({
      Start: button(() => useSimulationStore.getState().start()),
      Pause: button(() => useSimulationStore.getState().pause()),
      Reset: button(() => useSimulationStore.getState().reset()),
      Screenshot: button(() => exportScreenshot(useSimulationStore.getState().glCanvas)),
      'Export JSON': button(() => {
        const s = useSimulationStore.getState()
        exportResultsJson({
          app: 'Quantix Virtual Wind Tunnel',
          disclaimer:
            'Estimates only — simplified educational CFD approximations, not engineering-grade Navier–Stokes solutions.',
          exportedAt: new Date().toISOString(),
          model: s.modelMeta,
          wind: s.wind,
          results: s.results,
          history: s.history,
        })
      }),
    }),
  })

  useEffect(() => {
    // Skip the first effect run (initial defaults already match store)
    if (!ready.current) {
      ready.current = true
      return
    }
    setWind({
      speed: values.speed,
      direction: values.direction,
      density: values.density,
      turbulence: values.turbulence,
      temperature: values.temperature,
      viscosity: values.viscosity,
    })
  }, [
    values.speed,
    values.direction,
    values.density,
    values.turbulence,
    values.temperature,
    values.viscosity,
    setWind,
  ])

  return (
    <Leva
      collapsed
      oneLineLabels
      titleBar={{ title: 'Quantix · Leva', filter: false }}
      theme={{
        colors: {
          elevation1: '#0c0c0e',
          elevation2: '#121214',
          elevation3: '#1a1a1e',
          accent1: '#c8c8cc',
          accent2: '#a0a0a6',
          accent3: '#78787e',
          highlight1: '#e8e8ea',
          highlight2: '#a8a8ae',
          highlight3: '#707076',
          vivid1: '#d0d0d4',
          folderWidgetColor: '#3a3a40',
          folderTextColor: '#a0a0a6',
          toolTipBackground: '#0c0c0e',
          toolTipText: '#e8e8ea',
        },
        fonts: {
          mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          sans: 'Inter, system-ui, sans-serif',
        },
        sizes: {
          rootWidth: '280px',
          controlWidth: '140px',
          numberInputMinWidth: '40px',
        },
      }}
    />
  )
}
