# Quantix Virtual Wind Tunnel

Browser-based aerodynamic visualizer for **F1 in Schools** cars. Upload a 3D model, set wind conditions, and explore simplified airflow and force estimates in real time.

> **Disclaimer:** All aerodynamic numbers are **educational approximations**, not engineering-grade CFD. They are not a substitute for tunnel testing or full Navier–Stokes solvers.

## Stack

- React + TypeScript + Vite
- Three.js / React Three Fiber / Drei
- Tailwind CSS (Minimalism theme)
- Zustand

## Features

- 3D viewer with orbit, zoom, pan, grid, lighting, wireframe, perspective / orthographic cameras
- Model upload: **STL**, **OBJ**, **GLB** (STEP not supported in-browser)
- Auto center & scale
- Wind: speed, direction, density, turbulence, temperature, viscosity
- Airflow: streamlines, particles, vectors, pressure/velocity maps, wake, separation, turbulence, smoke, force arrows
- Estimated drag, lift, Cd, downforce, frontal area, pressure & velocity graphs
- Start / Pause / Reset, screenshot, JSON & CSV export
- Demo car on first load

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

```bash
npm run build   # production build
npm run preview # preview production build
```

## Project structure

```
src/
  components/
    controls/     # wind, viz, sim, upload
    layout/       # header, sidebars, dashboard
    ui/           # panel, metrics, toggles, charts
    viewer/       # R3F scene & airflow systems
  lib/            # aero math, loaders, export, flow field
  store/          # Zustand simulation state
  types/
```

## Performance notes

- Instanced particles for airflow / smoke
- DPR capped for high-DPI displays
- Analytic flow field (no volumetric solver) to stay near 60 FPS
- Models up to ~200k triangles are reasonable; denser meshes may reduce FPS

## License

MIT — educational use encouraged.
