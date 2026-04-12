import { startTransition, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { standingPresets } from '../data/wavePresets'
import {
  getFundamentalFrequency,
  getStandingAntinodes,
  getStandingFrequency,
  getStandingModeRatio,
  getStandingNodes,
  getStandingWaveSpeed,
  getStandingWavelength,
} from '../lib/waveMath'
import type { StandingWaveSettings } from '../types'

export interface StandingWaveStateModel {
  selectedPresetId: string
  settings: StandingWaveSettings
  setSettings: Dispatch<SetStateAction<StandingWaveSettings>>
  applyPreset: (presetId: string) => void
  summary: {
    boundary: StandingWaveSettings['boundary']
    frequency: number
    fundamentalFrequency: number
    wavelength: number
    waveSpeed: number
    modeRatio: number
    nodePositions: number[]
    antinodePositions: number[]
  }
}

export function useStandingWaveState(): StandingWaveStateModel {
  const [selectedPresetId, setSelectedPresetId] = useState(standingPresets[0].id)
  const [settings, setSettings] = useState<StandingWaveSettings>({
    ...standingPresets[0].settings,
  })

  const summary = useMemo(() => {
    const frequency = getStandingFrequency(settings)
    const waveSpeed = getStandingWaveSpeed(settings.tension, settings.linearDensity)

    return {
      boundary: settings.boundary,
      frequency,
      fundamentalFrequency: getFundamentalFrequency(
        settings.length,
        settings.tension,
        settings.linearDensity,
        settings.boundary,
      ),
      wavelength: getStandingWavelength(settings),
      waveSpeed,
      modeRatio: getStandingModeRatio(settings.boundary, settings.modeIndex),
      nodePositions: getStandingNodes(settings),
      antinodePositions: getStandingAntinodes(settings),
    }
  }, [settings])

  const applyPreset = (presetId: string) => {
    const preset = standingPresets.find((candidate) => candidate.id === presetId)

    if (!preset) {
      return
    }

    startTransition(() => {
      setSelectedPresetId(preset.id)
      setSettings({ ...preset.settings })
    })
  }

  return {
    selectedPresetId,
    settings,
    setSettings,
    applyPreset,
    summary,
  }
}
