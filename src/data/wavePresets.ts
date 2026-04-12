import type { InterferencePreset, StandingWavePreset, WaveSource } from '../types'

const createSource = (
  id: string,
  x: number,
  y: number,
  accent: string,
  wavelength: number,
  frequency: number,
  amplitude: number,
  phase: number,
): WaveSource => ({
  id,
  x,
  y,
  accent,
  wavelength,
  frequency,
  amplitude,
  phase,
  enabled: true,
})

export const interferencePresets: InterferencePreset[] = [
  {
    id: 'young',
    title: {
      ja: 'ヤング型の二波源',
      en: 'Young-style twin source',
    },
    description: {
      ja: '同位相・同波長の2波源。経路差による干渉縞を観察しやすい基本例。',
      en: 'Two in-phase sources with equal wavelength, ideal for observing fringe lines.',
    },
    colorMap: 'thermal',
    sources: [
      createSource('s1', 36, 26, '#ff8c61', 9, 0.95, 1.1, 0),
      createSource('s2', 64, 26, '#4cc7d9', 9, 0.95, 1.1, 0),
    ],
  },
  {
    id: 'phase-shift',
    title: {
      ja: '位相差つき二波源',
      en: 'Phase-shifted pair',
    },
    description: {
      ja: '一方の波源に位相差を与え、強めあい線がずれる様子を確認する。',
      en: 'Adds phase offset to one source so the constructive lines slide sideways.',
    },
    colorMap: 'spectral',
    sources: [
      createSource('s1', 34, 25, '#ff9d4d', 8.5, 1.05, 1.1, 0),
      createSource('s2', 66, 25, '#5fb5ff', 8.5, 1.05, 1.1, Math.PI / 2),
    ],
  },
  {
    id: 'speaker-array',
    title: {
      ja: '4波源アレイ',
      en: 'Four-source array',
    },
    description: {
      ja: '波源数を増やして干渉パターンが細かくなる様子を比べる。',
      en: 'Extends the setup to four sources for a denser interference pattern.',
    },
    colorMap: 'thermal',
    sources: [
      createSource('s1', 24, 20, '#ff9d4d', 10, 0.9, 0.9, 0),
      createSource('s2', 44, 20, '#5fb5ff', 10, 0.9, 0.9, 0),
      createSource('s3', 56, 20, '#8de35c', 10, 0.9, 0.9, 0),
      createSource('s4', 76, 20, '#ff5f9c', 10, 0.9, 0.9, 0),
    ],
  },
]

export const standingPresets: StandingWavePreset[] = [
  {
    id: 'fundamental',
    title: {
      ja: '基本振動',
      en: 'Fundamental mode',
    },
    description: {
      ja: '両端固定の弦で最も低い固有振動数を観察する。',
      en: 'The lowest resonant mode of a fixed-fixed string.',
    },
    settings: {
      length: 1.2,
      tension: 70,
      linearDensity: 0.015,
      boundary: 'fixed-fixed',
      amplitude: 0.35,
      modeIndex: 1,
      phaseOffset: 0,
      showSnapshots: true,
      snapshotCount: 4,
    },
  },
  {
    id: 'second-harmonic',
    title: {
      ja: '二倍振動',
      en: 'Second harmonic',
    },
    description: {
      ja: '両端固定で腹が2つ現れる標準的な倍振動モード。',
      en: 'A fixed-fixed string with two antinodes.',
    },
    settings: {
      length: 1.2,
      tension: 70,
      linearDensity: 0.015,
      boundary: 'fixed-fixed',
      amplitude: 0.32,
      modeIndex: 2,
      phaseOffset: 0,
      showSnapshots: true,
      snapshotCount: 5,
    },
  },
  {
    id: 'closed-pipe-analogy',
    title: {
      ja: '片側自由モード',
      en: 'Fixed-free analogy',
    },
    description: {
      ja: '片端が自由な系として、閉管の基本モードに似た節と腹を観察する。',
      en: 'A fixed-free setup analogous to the fundamental of a closed pipe.',
    },
    settings: {
      length: 1.2,
      tension: 55,
      linearDensity: 0.013,
      boundary: 'fixed-free',
      amplitude: 0.34,
      modeIndex: 1,
      phaseOffset: 0,
      showSnapshots: true,
      snapshotCount: 4,
    },
  },
]
