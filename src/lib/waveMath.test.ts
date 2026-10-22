import { describe, expect, it } from 'vitest'

import type { StandingWaveSettings, WaveSource } from '../types'
import {
  classifyInterference,
  classifyPhaseRatio,
  getDrivenModeResponses,
  getLocalAmplitudeAtPoint,
  getNearestResonance,
  getPhaseRatio,
  getResonanceLevel,
  getSlowMotionFactor,
  wrapAngle,
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
  driveMode: 'natural',
  driveFrequency: 4,
  showTraveling: false,
  showSnapshots: false,
  showLabels: false,
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

  it('includes source phase offsets when classifying interference', () => {
    const sourceA = { ...baseSource, id: 'a', x: -5, y: 0, wavelength: 4 }
    const sourceB = { ...baseSource, id: 'b', x: 5, y: 0, wavelength: 4 }
    const midpoint = { x: 0, y: 10 }

    expect(getPhaseRatio(midpoint, [sourceA, sourceB])).toBeCloseTo(0, 6)
    expect(classifyPhaseRatio(getPhaseRatio(midpoint, [sourceA, sourceB]))).toBe('constructive')

    const antiphase = [sourceA, { ...sourceB, phase: Math.PI }]
    expect(Math.abs(getPhaseRatio(midpoint, antiphase) ?? 0)).toBeCloseTo(0.5, 6)
    expect(classifyPhaseRatio(getPhaseRatio(midpoint, antiphase))).toBe('destructive')
    expect(getPhaseRatio(midpoint, [sourceA])).toBeNull()
  })

  it('computes the local oscillation amplitude from phasor addition', () => {
    const sourceA = { ...baseSource, id: 'a', x: -5, y: 0, amplitude: 1 }
    const sourceB = { ...baseSource, id: 'b', x: 5, y: 0, amplitude: 1 }
    expect(getLocalAmplitudeAtPoint({ x: 0, y: 3 }, 0, [sourceA, sourceB])).toBeCloseTo(2, 6)
    expect(
      getLocalAmplitudeAtPoint({ x: 0, y: 3 }, 0, [sourceA, { ...sourceB, phase: Math.PI }]),
    ).toBeCloseTo(0, 6)
  })

  it('wraps angles into (-π, π]', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 6)
    expect(wrapAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2, 6)
    expect(wrapAngle(2 * Math.PI + 0.25)).toBeCloseTo(0.25, 6)
  })

  it('peaks the driven response exactly at each natural frequency', () => {
    // v = 4 m/s, L = 1 m, fixed-fixed → f₁ = 2 Hz.
    const settings = { ...fixedFixedSettings, driveMode: 'driven' as const }
    expect(getResonanceLevel(settings, 4)).toBeCloseTo(1, 3)
    expect(getResonanceLevel(settings, 5)).toBeLessThan(0.2)
    expect(getNearestResonance({ ...settings, driveFrequency: 5.8 }).ratio).toBe(3)

    const fixedFree = { ...settings, boundary: 'fixed-free' as const }
    expect(getDrivenModeResponses(fixedFree).map((response) => response.ratio)).toEqual([
      1, 3, 5, 7, 9, 11,
    ])
  })

  it('slows the string animation so the fundamental is visible', () => {
    // f₁ = 2 Hz → shown at 0.6 Hz.
    expect(getSlowMotionFactor(fixedFixedSettings)).toBeCloseTo(2 / 0.6, 6)
  })
})
