import type { InterferencePreset, StandingWavePreset, WaveSource } from '../types'

export const SOURCE_ACCENTS = ['#ff8c61', '#4cc7d9', '#a3e35c', '#ff6fae']

export const MAX_SOURCES = 4

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
      ja: 'ふたつの波源',
      en: 'Twin sources',
    },
    description: {
      ja: '同じ波を出す2つの波源。干渉縞の基本形。',
      en: 'Two identical sources — the classic fringe pattern.',
    },
    colorMap: 'ocean',
    linkSources: true,
    sources: [
      createSource('s1', 38, 26, SOURCE_ACCENTS[0], 9, 0.95, 1.1, 0),
      createSource('s2', 62, 26, SOURCE_ACCENTS[1], 9, 0.95, 1.1, 0),
    ],
  },
  {
    id: 'single',
    title: {
      ja: 'ひとつの波源',
      en: 'Single source',
    },
    description: {
      ja: 'まずは1つ。同心円状に広がる波を観察。',
      en: 'Start simple: circular ripples from one point.',
    },
    colorMap: 'ocean',
    linkSources: true,
    sources: [createSource('s1', 50, 32, SOURCE_ACCENTS[0], 9, 0.95, 1.2, 0)],
  },
  {
    id: 'antiphase',
    title: {
      ja: '逆位相の二波源',
      en: 'Opposite phase',
    },
    description: {
      ja: '片方を半周期ずらすと、中央線が弱めあいに。',
      en: 'Shift one source by half a cycle — the centre line goes dark.',
    },
    colorMap: 'ocean',
    linkSources: true,
    sources: [
      createSource('s1', 38, 26, SOURCE_ACCENTS[0], 9, 0.95, 1.1, 0),
      createSource('s2', 62, 26, SOURCE_ACCENTS[1], 9, 0.95, 1.1, Math.PI),
    ],
  },
  {
    id: 'drift',
    title: {
      ja: '周波数がちがう',
      en: 'Detuned pair',
    },
    description: {
      ja: '周波数がわずかに違うと、縞が流れ続ける。',
      en: 'Slightly different frequencies make the fringes sweep.',
    },
    colorMap: 'spectral',
    linkSources: false,
    sources: [
      createSource('s1', 38, 26, SOURCE_ACCENTS[0], 9, 0.95, 1.1, 0),
      createSource('s2', 62, 26, SOURCE_ACCENTS[1], 8.4, 1.02, 1.1, 0),
    ],
  },
  {
    id: 'speaker-array',
    title: {
      ja: '4波源アレイ',
      en: 'Four-source array',
    },
    description: {
      ja: '波源を増やすと、強い波がビームのように進む。',
      en: 'More sources focus the energy into sharp beams.',
    },
    colorMap: 'thermal',
    linkSources: true,
    sources: [
      createSource('s1', 32, 14, SOURCE_ACCENTS[0], 8, 0.9, 0.9, 0),
      createSource('s2', 44, 14, SOURCE_ACCENTS[1], 8, 0.9, 0.9, 0),
      createSource('s3', 56, 14, SOURCE_ACCENTS[2], 8, 0.9, 0.9, 0),
      createSource('s4', 68, 14, SOURCE_ACCENTS[3], 8, 0.9, 0.9, 0),
    ],
  },
]

const baseStandingSettings = {
  length: 1.2,
  tension: 70,
  linearDensity: 0.015,
  amplitude: 0.34,
  driveFrequency: 46,
  showTraveling: true,
  showSnapshots: true,
  showLabels: true,
} as const

export const standingPresets: StandingWavePreset[] = [
  {
    id: 'fundamental',
    title: {
      ja: '基本振動',
      en: 'Fundamental',
    },
    description: {
      ja: '両端固定の弦の、いちばん低い音。',
      en: 'The lowest mode of a string fixed at both ends.',
    },
    settings: {
      ...baseStandingSettings,
      boundary: 'fixed-fixed',
      modeIndex: 1,
      driveMode: 'natural',
    },
  },
  {
    id: 'third-harmonic',
    title: {
      ja: '3倍振動',
      en: 'Third harmonic',
    },
    description: {
      ja: '腹が3つ。振動数は基本振動の3倍。',
      en: 'Three loops at three times the fundamental.',
    },
    settings: {
      ...baseStandingSettings,
      amplitude: 0.3,
      boundary: 'fixed-fixed',
      modeIndex: 3,
      driveMode: 'natural',
    },
  },
  {
    id: 'closed-pipe-analogy',
    title: {
      ja: '片側が自由端',
      en: 'One free end',
    },
    description: {
      ja: '閉管と同じ形。奇数倍の振動だけが現れる。',
      en: 'Like a closed pipe — only odd harmonics exist.',
    },
    settings: {
      ...baseStandingSettings,
      tension: 55,
      linearDensity: 0.013,
      boundary: 'fixed-free',
      modeIndex: 1,
      driveMode: 'natural',
    },
  },
  {
    id: 'resonance-hunt',
    title: {
      ja: '共鳴さがし',
      en: 'Resonance hunt',
    },
    description: {
      ja: '弦をゆらす振動数を変えて、大きく揺れる点を探そう。',
      en: 'Sweep the driving frequency and find where the string comes alive.',
    },
    settings: {
      ...baseStandingSettings,
      boundary: 'fixed-fixed',
      modeIndex: 1,
      driveMode: 'driven',
      showTraveling: false,
    },
  },
]
