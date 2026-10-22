import { startTransition, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { MAX_SOURCES, SOURCE_ACCENTS, interferencePresets } from '../data/wavePresets'
import {
  INTERFERENCE_WORLD,
  clamp,
  classifyPhaseRatio,
  getAverageSourceSpeed,
  getEnabledSources,
  getPathDifference,
  getPhaseRatio,
  getRepresentativeWavelength,
  getSourceDistances,
  isStableInterferencePattern,
  wrapAngle,
} from '../lib/waveMath'
import type { InterferenceSettings, InterferenceSummary, Point, WaveSource } from '../types'

export type SourceField = keyof Pick<WaveSource, 'wavelength' | 'frequency' | 'amplitude' | 'phase'>

/** Parameters shared by every source while "link sources" is on. */
const LINKED_FIELDS: SourceField[] = ['wavelength', 'frequency']

const cloneSource = (source: WaveSource): WaveSource => ({ ...source })

const createExtraSource = (existing: WaveSource[]): WaveSource => {
  const usedAccents = new Set(existing.map((source) => source.accent))
  const template = existing[0]
  let serial = existing.length + 1
  while (existing.some((source) => source.id === `src-${serial}`)) {
    serial += 1
  }

  return {
    id: `src-${serial}`,
    x: clamp(20 + existing.length * 20, 8, INTERFERENCE_WORLD.width - 8),
    y: 44,
    wavelength: template?.wavelength ?? 9,
    frequency: template?.frequency ?? 0.95,
    amplitude: template?.amplitude ?? 1,
    phase: 0,
    enabled: true,
    accent:
      SOURCE_ACCENTS.find((accent) => !usedAccents.has(accent)) ??
      SOURCE_ACCENTS[existing.length % SOURCE_ACCENTS.length],
  }
}

const initialPreset = interferencePresets[0]

export interface InterferenceStateModel {
  selectedPresetId: string | null
  settings: InterferenceSettings
  setSettings: Dispatch<SetStateAction<InterferenceSettings>>
  selectedSourceId: string | null
  setSelectedSourceId: (sourceId: string | null) => void
  applyPreset: (presetId: string) => void
  updateSource: (sourceId: string, field: SourceField, value: number) => void
  toggleSource: (sourceId: string) => void
  addSource: () => void
  removeSource: (sourceId: string) => void
  setProbePoint: (point: Point | null) => void
  setSources: Dispatch<SetStateAction<WaveSource[]>>
  moveSelectedSource: (deltaX: number, deltaY: number) => void
  summary: InterferenceSummary
}

export function useInterferenceState(): InterferenceStateModel {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(initialPreset.id)
  const [settings, setSettings] = useState<InterferenceSettings>({
    sources: initialPreset.sources.map(cloneSource),
    colorMap: initialPreset.colorMap,
    viewMode: 'wave',
    quality: 'standard',
    linkSources: initialPreset.linkSources,
    showConstructive: false,
    showDestructive: false,
    showWavefronts: false,
    probePoint: null,
  })
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    initialPreset.sources[0]?.id ?? null,
  )

  const resolvedSelectedSourceId = settings.sources.some((source) => source.id === selectedSourceId)
    ? selectedSourceId
    : (settings.sources[0]?.id ?? null)

  const summary = useMemo<InterferenceSummary>(() => {
    const enabled = getEnabledSources(settings.sources)
    const [first, second] = enabled
    const phaseRatio = settings.probePoint
      ? getPhaseRatio(settings.probePoint, settings.sources)
      : null

    return {
      sourceCount: enabled.length,
      representativeWavelength: getRepresentativeWavelength(settings.sources),
      averageSpeed: getAverageSourceSpeed(settings.sources),
      stablePattern: isStableInterferencePattern(settings.sources),
      sourceSeparation: first && second ? Math.hypot(first.x - second.x, first.y - second.y) : null,
      phaseDifference: first && second ? wrapAngle(second.phase - first.phase) : null,
      probePoint: settings.probePoint,
      distances: settings.probePoint
        ? getSourceDistances(settings.probePoint, settings.sources)
        : null,
      pathDifference: settings.probePoint
        ? getPathDifference(settings.probePoint, settings.sources)
        : null,
      phaseRatio,
      classification: classifyPhaseRatio(phaseRatio),
      viewMode: settings.viewMode,
    }
  }, [settings.probePoint, settings.sources, settings.viewMode])

  const markCustom = () => setSelectedPresetId(null)

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
        linkSources: preset.linkSources,
        probePoint: null,
      }))
    })
  }

  const updateSource = (sourceId: string, field: SourceField, value: number) => {
    markCustom()
    setSettings((previous) => {
      const applyToAll = previous.linkSources && LINKED_FIELDS.includes(field)
      return {
        ...previous,
        sources: previous.sources.map((source) =>
          applyToAll || source.id === sourceId ? { ...source, [field]: value } : source,
        ),
      }
    })
  }

  const toggleSource = (sourceId: string) => {
    markCustom()
    setSettings((previous) => ({
      ...previous,
      sources: previous.sources.map((source) =>
        source.id === sourceId ? { ...source, enabled: !source.enabled } : source,
      ),
    }))
  }

  const addSource = () => {
    if (settings.sources.length >= MAX_SOURCES) {
      return
    }

    const nextSource = createExtraSource(settings.sources)
    markCustom()
    setSelectedSourceId(nextSource.id)
    setSettings((previous) => ({
      ...previous,
      sources: [...previous.sources, nextSource],
    }))
  }

  const removeSource = (sourceId: string) => {
    if (settings.sources.length <= 1) {
      return
    }

    markCustom()
    setSettings((previous) => ({
      ...previous,
      sources: previous.sources.filter((source) => source.id !== sourceId),
    }))
  }

  const setProbePoint = (point: Point | null) => {
    setSettings((previous) => ({
      ...previous,
      probePoint: point,
    }))
  }

  const setSources: Dispatch<SetStateAction<WaveSource[]>> = (updater) => {
    markCustom()
    setSettings((previous) => ({
      ...previous,
      sources: typeof updater === 'function' ? updater(previous.sources) : updater,
    }))
  }

  const moveSelectedSource = (deltaX: number, deltaY: number) => {
    if (!resolvedSelectedSourceId) {
      return
    }

    setSources((previous) =>
      previous.map((source) =>
        source.id === resolvedSelectedSourceId
          ? {
              ...source,
              x: clamp(source.x + deltaX, 0, INTERFERENCE_WORLD.width),
              y: clamp(source.y + deltaY, 0, INTERFERENCE_WORLD.height),
            }
          : source,
      ),
    )
  }

  return {
    selectedPresetId,
    settings,
    setSettings,
    selectedSourceId: resolvedSelectedSourceId,
    setSelectedSourceId,
    applyPreset,
    updateSource,
    toggleSource,
    addSource,
    removeSource,
    setProbePoint,
    setSources,
    moveSelectedSource,
    summary,
  }
}
