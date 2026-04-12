export type Locale = 'ja' | 'en'
export type Theme = 'light' | 'dark'
export type SimulationMode = 'interference' | 'standing'
export type ColorMapId = 'thermal' | 'grayscale' | 'spectral'
export type BoundaryCondition = 'fixed-fixed' | 'fixed-free' | 'free-free'
export type InterferenceClass =
  | 'constructive'
  | 'destructive'
  | 'mixed'
  | 'unavailable'

export interface LocalizedText {
  ja: string
  en: string
}

export interface Point {
  x: number
  y: number
}

export interface WaveSource extends Point {
  id: string
  wavelength: number
  frequency: number
  amplitude: number
  phase: number
  enabled: boolean
  accent: string
}

export interface InterferenceSettings {
  sources: WaveSource[]
  colorMap: ColorMapId
  resolution: number
  showConstructive: boolean
  showDestructive: boolean
  showWavefronts: boolean
  probePoint: Point | null
}

export interface InterferencePreset {
  id: string
  title: LocalizedText
  description: LocalizedText
  sources: WaveSource[]
  colorMap: ColorMapId
}

export interface StandingWaveSettings {
  length: number
  tension: number
  linearDensity: number
  boundary: BoundaryCondition
  amplitude: number
  modeIndex: number
  phaseOffset: number
  showSnapshots: boolean
  snapshotCount: number
}

export interface StandingWavePreset {
  id: string
  title: LocalizedText
  description: LocalizedText
  settings: StandingWaveSettings
}

export interface QuizOption {
  id: string
  label: LocalizedText
}

export interface QuizItem {
  id: string
  prompt: LocalizedText
  options: QuizOption[]
  correctOptionId: string
  explanation: LocalizedText
}

export interface InterferenceSummary {
  sourceCount: number
  representativeWavelength: number | null
  averageSpeed: number
  stablePattern: boolean
  probePoint: Point | null
  pathDifference: number | null
  classification: InterferenceClass
}

export interface StandingSummary {
  boundary: BoundaryCondition
  frequency: number
  fundamentalFrequency: number
  wavelength: number
  waveSpeed: number
  modeRatio: number
  nodePositions: number[]
  antinodePositions: number[]
}
