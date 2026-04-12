import { describe, expect, it } from 'vitest'

import type { StandingWaveSettings, WaveSource } from '../types'
import {
  classifyInterference,
  getInterferenceValueAtPoint,
  getStandingAntinodes,
  getStandingFrequency,
  getStandingNodes,
  getStandingWavelength,
  getWaveSpeed,
} from './waveMath'

const baseSource: WaveSource = {
  id: 's1',
  x: 0,
  y: 0,
  wavelength: 4,
  frequency: 0,
  amplitude: 2,
  phase: 0,
  enabled: true,
  accent: '#fff',
}

const fixedFixedSettings: StandingWaveSettings = {
  length: 1,
  tension: 16,
  linearDensity: 1,
  boundary: 'fixed-fixed',
  amplitude: 0.3,
  modeIndex: 3,
  phaseOffset: 0,
  showSnapshots: false,
  snapshotCount: 3,
}

describe('waveMath', () => {
  it('computes wave speed from wavelength and frequency', () => {
    expect(getWaveSpeed(2.5, 4)).toBe(10)
  })

  it('computes interference displacement by linear superposition', () => {
    const value = getInterferenceValueAtPoint({ x: 1, y: 0 }, 0, [baseSource])
    expect(value).toBeCloseTo(2, 6)
  })

  it('classifies interference conditions from the path difference ratio', () => {
    expect(classifyInterference(10, 5)).toBe('constructive')
    expect(classifyInterference(7.5, 5)).toBe('destructive')
    expect(classifyInterference(6, 5)).toBe('mixed')
    expect(classifyInterference(null, 5)).toBe('unavailable')
  })

  it('computes standing-wave frequency and wavelength for fixed-fixed strings', () => {
    expect(getStandingFrequency(fixedFixedSettings)).toBeCloseTo(6, 6)
    expect(getStandingWavelength(fixedFixedSettings)).toBeCloseTo(2 / 3, 6)
  })

  it('returns node and antinode positions for each boundary type', () => {
    expect(getStandingNodes({ ...fixedFixedSettings, modeIndex: 2 })).toEqual([0, 0.5, 1])
    expect(
      getStandingNodes({ ...fixedFixedSettings, boundary: 'fixed-free', modeIndex: 1 }),
    ).toEqual([0])
    expect(
      getStandingNodes({ ...fixedFixedSettings, boundary: 'free-free', modeIndex: 1 }),
    ).toEqual([0.5])

    expect(
      getStandingAntinodes({
        ...fixedFixedSettings,
        boundary: 'fixed-free',
        modeIndex: 2,
      }),
    ).toEqual([1 / 3, 1])
  })
})
