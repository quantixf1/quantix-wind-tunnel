import { useCallback, useRef, useState } from 'react'
import * as THREE from 'three'
import { loadModelFromFile } from '../../lib/modelLoader'
import { useSimulationStore } from '../../store/simulationStore'
import { Panel } from '../ui/Panel'

interface ModelUploadProps {
  onModelLoaded: (object: THREE.Object3D) => void
}

export function ModelUpload({ onModelLoaded }: ModelUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const setBounds = useSimulationStore((s) => s.setBounds)
  const setModelMeta = useSimulationStore((s) => s.setModelMeta)
  const reset = useSimulationStore((s) => s.reset)
  const modelMeta = useSimulationStore((s) => s.modelMeta)
  const bounds = useSimulationStore((s) => s.bounds)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setLoading(true)
      try {
        const result = await loadModelFromFile(file)
        setBounds(result.bounds)
        setModelMeta({
          name: result.name,
          format: result.format,
          triangleCount: result.bounds.triangleCount,
        })
        onModelLoaded(result.object)
        reset()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load model')
      } finally {
        setLoading(false)
      }
    },
    [onModelLoaded, setBounds, setModelMeta, reset],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <Panel title="Model">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-md border border-dashed px-3 py-5 text-center transition-colors ${
          dragOver
            ? 'border-neutral-400 bg-white/[0.04]'
            : 'border-white/[0.1] bg-white/[0.015]'
        }`}
      >
        <p className="text-[12px] text-neutral-300">
          {loading ? 'Loading…' : 'Drop STL, OBJ, or GLB'}
        </p>
        <p className="mt-1 text-[10px] text-neutral-600">STEP not supported in-browser</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-neutral-200 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.glb,.gltf,.step,.stp"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {error && (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{error}</p>
      )}

      {modelMeta && (
        <dl className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-neutral-500">Name</dt>
            <dd className="truncate font-mono text-neutral-300">{modelMeta.name}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-neutral-500">Triangles</dt>
            <dd className="font-mono text-neutral-300">
              {bounds.triangleCount.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-neutral-500">Frontal area</dt>
            <dd className="font-mono text-neutral-300">
              {bounds.frontalArea.toFixed(4)} m²
            </dd>
          </div>
        </dl>
      )}
    </Panel>
  )
}
