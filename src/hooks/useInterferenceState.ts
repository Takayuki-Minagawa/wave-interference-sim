import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { interferencePresets } from '../data/wavePresets'
import {
  INTERFERENCE_WORLD,
  clamp,
  classifyInterference,
  getAverageSourceSpeed,
  getInterferenceValueAtPoint,
  getPathDifference,
  getRepresentativeWavelength,
  isStableInterferencePattern,
} from '../lib/waveMath'
import type { InterferenceSettings, Point, WaveSource } from '../types'

const SOURCE_ACCENTS = ['#ff8c61', '#4cc7d9', '#8de35c', '#ff5f9c']

const cloneSource = (source: WaveSource): WaveSource => ({ ...source })

const createExtraSource = (index: number): WaveSource => ({
  id: `extra-${index + 1}`,
  x: 22 + index * 18,
  y: 40,
  wavelength: 9.2,
  frequency: 0.92,
  amplitude: 0.85,
  phase: 0,
  enabled: true,
  accent: SOURCE_ACCENTS[index % SOURCE_ACCENTS.length],
})

export interface InterferenceStateModel {
  selectedPresetId: string
  settings: InterferenceSettings
  setSettings: Dispatch<SetStateAction<InterferenceSettings>>
  selectedSourceId: string | null
  setSelectedSourceId: Dispatch<SetStateAction<string | null>>
  applyPreset: (presetId: string) => void
  updateSource: (
    sourceId: string,
    field: keyof Pick<WaveSource, 'wavelength' | 'frequency' | 'amplitude' | 'phase'>,
    value: number,
  ) => void
  addSource: () => void
  removeSource: () => void
  setProbePoint: (point: Point) => void
  setSources: Dispatch<SetStateAction<WaveSource[]>>
  moveSelectedSource: (deltaX: number, deltaY: number) => void
  summary: {
    sourceCount: number
    representativeWavelength: number | null
    averageSpeed: number
    stablePattern: boolean
    probePoint: Point | null
    pathDifference: number | null
    classification: ReturnType<typeof classifyInterference>
  }
  probeSamples: number[]
}

export function useInterferenceState(time: number): InterferenceStateModel {
  const [selectedPresetId, setSelectedPresetId] = useState(interferencePresets[0].id)
  const [settings, setSettings] = useState<InterferenceSettings>({
    sources: interferencePresets[0].sources.map(cloneSource),
    colorMap: interferencePresets[0].colorMap,
    resolution: 8,
    showConstructive: true,
    showDestructive: false,
    showWavefronts: true,
    probePoint: null,
  })
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    interferencePresets[0].sources[0]?.id ?? null,
  )

  const deferredTime = useDeferredValue(time)
  const resolvedSelectedSourceId = useMemo(
    () =>
      settings.sources.some((source) => source.id === selectedSourceId)
        ? selectedSourceId
        : settings.sources[0]?.id ?? null,
    [selectedSourceId, settings.sources],
  )

  const representativeWavelength = useMemo(
    () => getRepresentativeWavelength(settings.sources),
    [settings.sources],
  )
  const pathDifference = useMemo(
    () =>
      settings.probePoint
        ? getPathDifference(settings.probePoint, settings.sources)
        : null,
    [settings.probePoint, settings.sources],
  )
  const classification = useMemo(
    () => classifyInterference(pathDifference, representativeWavelength),
    [pathDifference, representativeWavelength],
  )

  const summary = useMemo(
    () => ({
      sourceCount: settings.sources.filter((source) => source.enabled).length,
      representativeWavelength,
      averageSpeed: getAverageSourceSpeed(settings.sources),
      stablePattern: isStableInterferencePattern(settings.sources),
      probePoint: settings.probePoint,
      pathDifference,
      classification,
    }),
    [classification, pathDifference, representativeWavelength, settings.probePoint, settings.sources],
  )

  const probeSamples = useMemo(() => {
    if (!settings.probePoint) {
      return []
    }

    return Array.from({ length: 160 }, (_, index) => {
      const sampleTime = deferredTime - (159 - index) * 0.03
      return getInterferenceValueAtPoint(
        settings.probePoint as Point,
        sampleTime,
        settings.sources,
      )
    })
  }, [deferredTime, settings.probePoint, settings.sources])

  const applyPreset = (presetId: string) => {
    const preset = interferencePresets.find((candidate) => candidate.id === presetId)

    if (!preset) {
      return
    }

    startTransition(() => {
      setSelectedPresetId(preset.id)
      setSelectedSourceId(preset.sources[0]?.id ?? null)
      setSettings((previous) => ({
        ...previous,
        sources: preset.sources.map(cloneSource),
        colorMap: preset.colorMap,
        probePoint: null,
      }))
    })
  }

  const updateSource = (
    sourceId: string,
    field: keyof Pick<WaveSource, 'wavelength' | 'frequency' | 'amplitude' | 'phase'>,
    value: number,
  ) => {
    setSettings((previous) => ({
      ...previous,
      sources: previous.sources.map((source) =>
        source.id === sourceId ? { ...source, [field]: value } : source,
      ),
    }))
  }

  const addSource = () => {
    startTransition(() => {
      setSettings((previous) => {
        if (previous.sources.length >= 4) {
          return previous
        }

        const nextSource = createExtraSource(previous.sources.length)
        setSelectedSourceId(nextSource.id)

        return {
          ...previous,
          sources: [...previous.sources, nextSource],
        }
      })
    })
  }

  const removeSource = () => {
    startTransition(() => {
      setSettings((previous) => ({
        ...previous,
        sources:
          previous.sources.length <= 1
            ? previous.sources
            : previous.sources.slice(0, -1),
      }))
    })
  }

  const setProbePoint = (point: Point) => {
    setSettings((previous) => ({
      ...previous,
      probePoint: point,
    }))
  }

  const setSources: Dispatch<SetStateAction<WaveSource[]>> = (updater) => {
    setSettings((previous) => ({
      ...previous,
      sources:
        typeof updater === 'function' ? updater(previous.sources) : updater,
    }))
  }

  const moveSelectedSource = (deltaX: number, deltaY: number) => {
    if (!resolvedSelectedSourceId) {
      return
    }

    setSettings((previous) => ({
      ...previous,
      sources: previous.sources.map((source) =>
        source.id === resolvedSelectedSourceId
          ? {
              ...source,
              x: clamp(source.x + deltaX, 0, INTERFERENCE_WORLD.width),
              y: clamp(source.y + deltaY, 0, INTERFERENCE_WORLD.height),
            }
          : source,
      ),
    }))
  }

  return {
    selectedPresetId,
    settings,
    setSettings,
    selectedSourceId: resolvedSelectedSourceId,
    setSelectedSourceId,
    applyPreset,
    updateSource,
    addSource,
    removeSource,
    setProbePoint,
    setSources,
    moveSelectedSource,
    summary,
    probeSamples,
  }
}
