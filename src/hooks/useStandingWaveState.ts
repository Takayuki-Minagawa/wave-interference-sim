import { startTransition, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { standingPresets } from '../data/wavePresets'
import {
  clamp,
  getAntinodesForRatio,
  getFundamentalFrequency,
  getMaxDriveFrequency,
  getMinDriveFrequency,
  getNearestResonance,
  getNodesForRatio,
  getResonanceLevel,
  getSlowMotionFactor,
  getStandingFrequency,
  getStandingModeRatio,
  getStandingWaveSpeed,
} from '../lib/waveMath'
import type { StandingSummary, StandingWaveSettings } from '../types'

export interface StandingWaveStateModel {
  selectedPresetId: string | null
  settings: StandingWaveSettings
  /** Patches settings. Display-only changes pass `keepPreset` so the preset stays highlighted. */
  updateSettings: (patch: Partial<StandingWaveSettings>, keepPreset?: boolean) => void
  setSettings: Dispatch<SetStateAction<StandingWaveSettings>>
  applyPreset: (presetId: string) => void
  summary: StandingSummary
}

export function useStandingWaveState(): StandingWaveStateModel {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(standingPresets[0].id)
  const [settings, setSettings] = useState<StandingWaveSettings>({
    ...standingPresets[0].settings,
  })

  const summary = useMemo<StandingSummary>(() => {
    const waveSpeed = getStandingWaveSpeed(settings.tension, settings.linearDensity)
    const fundamentalFrequency = getFundamentalFrequency(
      settings.length,
      settings.tension,
      settings.linearDensity,
      settings.boundary,
    )
    const nearest = getNearestResonance(settings)
    const isDriven = settings.driveMode === 'driven'
    const modeRatio = isDriven
      ? nearest.ratio
      : getStandingModeRatio(settings.boundary, settings.modeIndex)
    const frequency = isDriven ? settings.driveFrequency : getStandingFrequency(settings)

    return {
      boundary: settings.boundary,
      driveMode: settings.driveMode,
      frequency,
      fundamentalFrequency,
      wavelength: waveSpeed / frequency,
      waveSpeed,
      modeRatio,
      nodePositions: getNodesForRatio(settings.boundary, modeRatio, settings.length),
      antinodePositions: getAntinodesForRatio(settings.boundary, modeRatio, settings.length),
      driveFrequency: settings.driveFrequency,
      nearestResonanceRatio: nearest.ratio,
      nearestResonanceFrequency: nearest.frequency,
      resonanceLevel: getResonanceLevel(settings),
      slowMotionFactor: getSlowMotionFactor(settings),
    }
  }, [settings])

  const updateSettings = (patch: Partial<StandingWaveSettings>, keepPreset = false) => {
    if (!keepPreset) {
      setSelectedPresetId(null)
    }
    setSettings((previous) => {
      const next = { ...previous, ...patch }
      // Keep the drive inside the slider range when the string itself changes.
      return {
        ...next,
        driveFrequency: clamp(
          next.driveFrequency,
          getMinDriveFrequency(next),
          getMaxDriveFrequency(next),
        ),
      }
    })
  }

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
    updateSettings,
    setSettings,
    applyPreset,
    summary,
  }
}
