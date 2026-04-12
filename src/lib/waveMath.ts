import type {
  BoundaryCondition,
  ColorMapId,
  InterferenceClass,
  Point,
  StandingWaveSettings,
  WaveSource,
} from '../types'

export const INTERFERENCE_WORLD = {
  width: 100,
  height: 64,
}

export const INTERFERENCE_CANVAS = {
  width: 900,
  height: 576,
}

export const STANDING_CANVAS = {
  width: 900,
  height: 360,
}

type ColorStop = [number, [number, number, number]]

const COLOR_MAPS: Record<ColorMapId, ColorStop[]> = {
  thermal: [
    [0, [20, 58, 108]],
    [0.5, [247, 242, 233]],
    [1, [210, 73, 52]],
  ],
  grayscale: [
    [0, [16, 20, 28]],
    [0.5, [144, 153, 163]],
    [1, [244, 247, 250]],
  ],
  spectral: [
    [0, [58, 42, 137]],
    [0.25, [25, 106, 187]],
    [0.5, [29, 168, 148]],
    [0.75, [240, 190, 52]],
    [1, [208, 61, 61]],
  ],
}

/**
 * Constrains a scalar into the provided closed interval.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Returns the wave speed from the textbook relation v = λf.
 */
export const getWaveSpeed = (wavelength: number, frequency: number) =>
  wavelength * frequency

/**
 * Filters the configured wave sources down to the currently active ones.
 */
export const getEnabledSources = (sources: WaveSource[]) =>
  sources.filter((source) => source.enabled)

/**
 * Computes the mean propagation speed of all enabled interference sources.
 */
export const getAverageSourceSpeed = (sources: WaveSource[]) => {
  const enabledSources = getEnabledSources(sources)

  if (enabledSources.length === 0) {
    return 0
  }

  const speedSum = enabledSources.reduce(
    (sum, source) => sum + getWaveSpeed(source.wavelength, source.frequency),
    0,
  )

  return speedSum / enabledSources.length
}

/**
 * Estimates a representative wavelength for two-source path-difference checks.
 */
export const getRepresentativeWavelength = (sources: WaveSource[]) => {
  const enabledSources = getEnabledSources(sources).slice(0, 2)

  if (enabledSources.length < 2) {
    return enabledSources[0]?.wavelength ?? null
  }

  return (
    enabledSources.reduce((sum, source) => sum + source.wavelength, 0) /
    enabledSources.length
  )
}

/**
 * Detects whether the interference pattern should appear nearly stationary.
 */
export const isStableInterferencePattern = (sources: WaveSource[]) => {
  const enabledSources = getEnabledSources(sources)

  if (enabledSources.length < 2) {
    return false
  }

  const frequencies = enabledSources.map((source) => source.frequency)
  const wavelengths = enabledSources.map((source) => source.wavelength)
  const frequencySpread = Math.max(...frequencies) - Math.min(...frequencies)
  const wavelengthSpread = Math.max(...wavelengths) - Math.min(...wavelengths)

  return frequencySpread < 0.08 && wavelengthSpread < 0.8
}

/**
 * Calculates the linear superposition of all enabled sources at one 2D point.
 *
 * `point` is expressed in the simulator's virtual world coordinates and `time`
 * is expressed in seconds.
 */
export const getInterferenceValueAtPoint = (
  point: Point,
  time: number,
  sources: WaveSource[],
) =>
  getEnabledSources(sources).reduce((sum, source) => {
    const distance = Math.hypot(point.x - source.x, point.y - source.y)
    const k = (2 * Math.PI) / source.wavelength
    const omega = 2 * Math.PI * source.frequency
    return sum + source.amplitude * Math.sin(k * distance - omega * time + source.phase)
  }, 0)

/**
 * Computes |r1 - r2| for the first two enabled sources and a probe point.
 */
export const getPathDifference = (point: Point, sources: WaveSource[]) => {
  const enabledSources = getEnabledSources(sources).slice(0, 2)

  if (enabledSources.length < 2) {
    return null
  }

  const [sourceA, sourceB] = enabledSources
  const r1 = Math.hypot(point.x - sourceA.x, point.y - sourceA.y)
  const r2 = Math.hypot(point.x - sourceB.x, point.y - sourceB.y)
  return Math.abs(r1 - r2)
}

/**
 * Classifies a path-difference ratio as constructive, destructive, or mixed.
 */
export const classifyInterference = (
  pathDifference: number | null,
  wavelength: number | null,
  tolerance = 0.12,
): InterferenceClass => {
  if (pathDifference === null || wavelength === null || wavelength === 0) {
    return 'unavailable'
  }

  const ratio = pathDifference / wavelength
  const nearestInteger = Math.round(ratio)
  const nearestHalf = Math.round(ratio - 0.5) + 0.5

  if (Math.abs(ratio - nearestInteger) < tolerance) {
    return 'constructive'
  }

  if (Math.abs(ratio - nearestHalf) < tolerance) {
    return 'destructive'
  }

  return 'mixed'
}

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount

const interpolateGradient = (stops: ColorStop[], amount: number) => {
  const clamped = clamp(amount, 0, 1)

  for (let index = 0; index < stops.length - 1; index += 1) {
    const [startOffset, startColor] = stops[index]
    const [endOffset, endColor] = stops[index + 1]

    if (clamped <= endOffset) {
      const span = endOffset - startOffset || 1
      const relative = (clamped - startOffset) / span

      return [
        Math.round(lerp(startColor[0], endColor[0], relative)),
        Math.round(lerp(startColor[1], endColor[1], relative)),
        Math.round(lerp(startColor[2], endColor[2], relative)),
      ] as const
    }
  }

  return stops.at(-1)?.[1] ?? [255, 255, 255]
}

/**
 * Maps a normalized displacement value to an RGB color in the chosen palette.
 */
export const getColorFromValue = (value: number, colorMap: ColorMapId) => {
  const normalized = (clamp(value, -1, 1) + 1) / 2
  return interpolateGradient(COLOR_MAPS[colorMap], normalized)
}

/**
 * Calculates string-wave speed from tension and linear density.
 */
export const getStandingWaveSpeed = (tension: number, linearDensity: number) =>
  Math.sqrt(Math.max(tension, 0.01) / Math.max(linearDensity, 0.0001))

/**
 * Converts the UI mode index into the frequency ratio allowed by the boundary.
 */
export const getStandingModeRatio = (
  boundary: BoundaryCondition,
  modeIndex: number,
) => (boundary === 'fixed-free' ? 2 * modeIndex - 1 : modeIndex)

/**
 * Returns the fundamental frequency for the selected boundary condition.
 */
export const getFundamentalFrequency = (
  length: number,
  tension: number,
  linearDensity: number,
  boundary: BoundaryCondition,
) => {
  const waveSpeed = getStandingWaveSpeed(tension, linearDensity)
  return boundary === 'fixed-free' ? waveSpeed / (4 * length) : waveSpeed / (2 * length)
}

/**
 * Computes the resonant frequency of the currently selected standing-wave mode.
 */
export const getStandingFrequency = (settings: StandingWaveSettings) =>
  getFundamentalFrequency(
    settings.length,
    settings.tension,
    settings.linearDensity,
    settings.boundary,
  ) * getStandingModeRatio(settings.boundary, settings.modeIndex)

/**
 * Computes the wavelength associated with the active standing-wave frequency.
 */
export const getStandingWavelength = (settings: StandingWaveSettings) =>
  getStandingWaveSpeed(settings.tension, settings.linearDensity) /
  getStandingFrequency(settings)

/**
 * Returns the standing-wave envelope imposed by the current boundary condition.
 */
const getStandingEnvelope = (x: number, settings: StandingWaveSettings) => {
  const ratio = getStandingModeRatio(settings.boundary, settings.modeIndex)

  switch (settings.boundary) {
    case 'fixed-fixed':
      return Math.sin((ratio * Math.PI * x) / settings.length)
    case 'fixed-free':
      return Math.sin((ratio * Math.PI * x) / (2 * settings.length))
    case 'free-free':
      return Math.cos((ratio * Math.PI * x) / settings.length)
    default:
      return 0
  }
}

/**
 * Evaluates the standing-wave displacement y(x, t) at one position on the string.
 */
export const getStandingDisplacement = (
  x: number,
  time: number,
  settings: StandingWaveSettings,
) =>
  2 *
  settings.amplitude *
  getStandingEnvelope(x, settings) *
  Math.cos(2 * Math.PI * getStandingFrequency(settings) * time + settings.phaseOffset)

/**
 * Returns the right-going and left-going components whose sum forms the standing wave.
 */
export const getTravelingWaveComponents = (
  x: number,
  time: number,
  settings: StandingWaveSettings,
) => {
  const wavelength = getStandingWavelength(settings)
  const frequency = getStandingFrequency(settings)
  const k = (2 * Math.PI) / wavelength
  const omega = 2 * Math.PI * frequency
  const phase = settings.phaseOffset / 2

  if (settings.boundary === 'free-free') {
    return {
      forward: settings.amplitude * Math.cos(k * x - omega * time + phase),
      backward: settings.amplitude * Math.cos(k * x + omega * time + phase),
    }
  }

  return {
    forward: settings.amplitude * Math.sin(k * x - omega * time + phase),
    backward: settings.amplitude * Math.sin(k * x + omega * time + phase),
  }
}

/**
 * Lists analytical node positions for the selected string boundary condition.
 */
export const getStandingNodes = (settings: StandingWaveSettings) => {
  const ratio = getStandingModeRatio(settings.boundary, settings.modeIndex)
  const positions: number[] = []

  switch (settings.boundary) {
    case 'fixed-fixed':
      for (let index = 0; index <= ratio; index += 1) {
        positions.push((settings.length * index) / ratio)
      }
      break
    case 'fixed-free':
      for (let index = 0; ; index += 1) {
        const position = (2 * settings.length * index) / ratio
        if (position > settings.length + 1e-6) {
          break
        }
        positions.push(position)
      }
      break
    case 'free-free':
      for (let index = 0; index < ratio; index += 1) {
        positions.push((settings.length * (index + 0.5)) / ratio)
      }
      break
    default:
      break
  }

  return positions
}

/**
 * Lists analytical antinode positions for the selected string boundary condition.
 */
export const getStandingAntinodes = (settings: StandingWaveSettings) => {
  const ratio = getStandingModeRatio(settings.boundary, settings.modeIndex)
  const positions: number[] = []

  switch (settings.boundary) {
    case 'fixed-fixed':
      for (let index = 0; index < ratio; index += 1) {
        positions.push((settings.length * (index + 0.5)) / ratio)
      }
      break
    case 'fixed-free':
      for (let index = 0; ; index += 1) {
        const position = (settings.length * (2 * index + 1)) / ratio
        if (position > settings.length + 1e-6) {
          break
        }
        positions.push(position)
      }
      break
    case 'free-free':
      for (let index = 0; index <= ratio; index += 1) {
        positions.push((settings.length * index) / ratio)
      }
      break
    default:
      break
  }

  return positions
}
