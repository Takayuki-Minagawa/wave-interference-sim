export type Locale = 'ja' | 'en'
export type Theme = 'light' | 'dark'
export type SimulationMode = 'interference' | 'standing'
export type InspectorTab = 'controls' | 'missions' | 'learn' | 'quiz'
export type ColorMapId = 'ocean' | 'thermal' | 'spectral' | 'grayscale'
export type InterferenceViewMode = 'wave' | 'intensity'
export type RenderQuality = 'high' | 'standard' | 'light'
export type BoundaryCondition = 'fixed-fixed' | 'fixed-free' | 'free-free'
export type StandingDriveMode = 'natural' | 'driven'
export type InterferenceClass = 'constructive' | 'destructive' | 'mixed' | 'unavailable'

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
  viewMode: InterferenceViewMode
  quality: RenderQuality
  linkSources: boolean
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
  linkSources: boolean
}

export interface StandingWaveSettings {
  length: number
  tension: number
  linearDensity: number
  boundary: BoundaryCondition
  amplitude: number
  modeIndex: number
  driveMode: StandingDriveMode
  driveFrequency: number
  showTraveling: boolean
  showSnapshots: boolean
  showLabels: boolean
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
  sourceSeparation: number | null
  phaseDifference: number | null
  probePoint: Point | null
  distances: [number, number] | null
  pathDifference: number | null
  phaseRatio: number | null
  classification: InterferenceClass
  viewMode: InterferenceViewMode
}

export interface StandingSummary {
  boundary: BoundaryCondition
  driveMode: StandingDriveMode
  frequency: number
  fundamentalFrequency: number
  wavelength: number
  waveSpeed: number
  modeRatio: number
  nodePositions: number[]
  antinodePositions: number[]
  driveFrequency: number
  nearestResonanceRatio: number
  nearestResonanceFrequency: number
  resonanceLevel: number
  slowMotionFactor: number
}
