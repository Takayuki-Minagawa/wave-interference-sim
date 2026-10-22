import type {
  BoundaryCondition,
  ColorMapId,
  InterferenceClass,
  Point,
  StandingWaveSettings,
  WaveSource,
} from '../types'

/** Virtual ripple-tank size in centimetres. */
export const INTERFERENCE_WORLD = {
  width: 100,
  height: 64,
}

/** Logical drawing size of the interference canvas (CSS pixels before DPR scaling). */
export const INTERFERENCE_CANVAS = {
  width: 900,
  height: 576,
}

export const STANDING_CANVAS = {
  width: 900,
  height: 420,
}

/** Apparent frequency (Hz) the fundamental is slowed down to in the string view. */
export const SLOW_VISUAL_FUNDAMENTAL = 0.6

/** Relative damping of each string mode in the driven (resonance) simulation. */
export const DRIVE_DAMPING = 0.05

/** Number of normal modes the UI exposes and the driven model sums over. */
export const STANDING_MODE_COUNT = 6

type ColorStop = [number, [number, number, number]]

const COLOR_MAPS: Record<ColorMapId, ColorStop[]> = {
  ocean: [
    [0, [4, 14, 40]],
    [0.32, [12, 62, 116]],
    [0.5, [20, 112, 156]],
    [0.72, [62, 192, 206]],
    [1, [236, 253, 255]],
  ],
  thermal: [
    [0, [20, 58, 108]],
    [0.5, [247, 242, 233]],
    [1, [210, 73, 52]],
  ],
  spectral: [
    [0, [58, 42, 137]],
    [0.25, [25, 106, 187]],
    [0.5, [29, 168, 148]],
    [0.75, [240, 190, 52]],
    [1, [208, 61, 61]],
  ],
  grayscale: [
    [0, [16, 20, 28]],
    [0.5, [144, 153, 163]],
    [1, [244, 247, 250]],
  ],
}

export const COLOR_MAP_IDS = Object.keys(COLOR_MAPS) as ColorMapId[]

/**
 * Constrains a scalar into the provided closed interval.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Wraps an angle into the half-open interval (-π, π].
 */
export const wrapAngle = (angle: number) => {
  const wrapped = angle - 2 * Math.PI * Math.floor((angle + Math.PI) / (2 * Math.PI))
  return wrapped === -Math.PI ? Math.PI : wrapped
}

/**
 * Returns the wave speed from the textbook relation v = λf.
 */
export const getWaveSpeed = (wavelength: number, frequency: number) => wavelength * frequency

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

  return enabledSources.reduce((sum, source) => sum + source.wavelength, 0) / enabledSources.length
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
export const getInterferenceValueAtPoint = (point: Point, time: number, sources: WaveSource[]) =>
  getEnabledSources(sources).reduce((sum, source) => {
    const distance = Math.hypot(point.x - source.x, point.y - source.y)
    const k = (2 * Math.PI) / source.wavelength
    const omega = 2 * Math.PI * source.frequency
    return sum + source.amplitude * Math.sin(k * distance - omega * time + source.phase)
  }, 0)

/**
 * Returns the local oscillation amplitude |Σ Aᵢ e^{iθᵢ}| at one point.
 *
 * For sources sharing one frequency this is constant in time and equals the
 * envelope that the bright and dark fringes trace out. With mismatched
 * frequencies the envelope drifts, which is exactly what the UI should show.
 */
export const getLocalAmplitudeAtPoint = (point: Point, time: number, sources: WaveSource[]) => {
  let real = 0
  let imaginary = 0

  for (const source of sources) {
    if (!source.enabled) {
      continue
    }

    const distance = Math.hypot(point.x - source.x, point.y - source.y)
    const theta =
      ((2 * Math.PI) / source.wavelength) * distance -
      2 * Math.PI * source.frequency * time +
      source.phase
    real += source.amplitude * Math.cos(theta)
    imaginary += source.amplitude * Math.sin(theta)
  }

  return Math.hypot(real, imaginary)
}

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
 * Returns the distances from the first two enabled sources to a point.
 */
export const getSourceDistances = (
  point: Point,
  sources: WaveSource[],
): [number, number] | null => {
  const enabledSources = getEnabledSources(sources).slice(0, 2)

  if (enabledSources.length < 2) {
    return null
  }

  const [sourceA, sourceB] = enabledSources
  return [
    Math.hypot(point.x - sourceA.x, point.y - sourceA.y),
    Math.hypot(point.x - sourceB.x, point.y - sourceB.y),
  ]
}

/**
 * Expresses the phase difference of the first two enabled sources at a point
 * in units of whole cycles: r₁/λ₁ − r₂/λ₂ + (φ₁ − φ₂)/2π.
 *
 * Integer values mean the crests arrive together (constructive), half-integer
 * values mean a crest meets a trough (destructive). Unlike the bare path
 * difference this also accounts for the sources' own phase offsets.
 */
export const getPhaseRatio = (point: Point, sources: WaveSource[]) => {
  const enabledSources = getEnabledSources(sources).slice(0, 2)

  if (enabledSources.length < 2) {
    return null
  }

  const [sourceA, sourceB] = enabledSources
  const r1 = Math.hypot(point.x - sourceA.x, point.y - sourceA.y)
  const r2 = Math.hypot(point.x - sourceB.x, point.y - sourceB.y)

  return (
    r1 / sourceA.wavelength -
    r2 / sourceB.wavelength +
    (sourceA.phase - sourceB.phase) / (2 * Math.PI)
  )
}

/**
 * Classifies a cycle ratio as constructive, destructive, or mixed.
 */
export const classifyPhaseRatio = (ratio: number | null, tolerance = 0.12): InterferenceClass => {
  if (ratio === null || !Number.isFinite(ratio)) {
    return 'unavailable'
  }

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

  return classifyPhaseRatio(pathDifference / wavelength, tolerance)
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
 * Builds a 256-entry RGB lookup table spanning the value range [-1, 1].
 */
export const buildColorLookup = (colorMap: ColorMapId) => {
  const table = new Uint8ClampedArray(256 * 3)

  for (let index = 0; index < 256; index += 1) {
    const [red, green, blue] = getColorFromValue((index / 255) * 2 - 1, colorMap)
    table[index * 3] = red
    table[index * 3 + 1] = green
    table[index * 3 + 2] = blue
  }

  return table
}

/**
 * Returns a CSS linear-gradient string that previews a color map.
 */
export const getColorMapGradient = (colorMap: ColorMapId) =>
  `linear-gradient(90deg, ${COLOR_MAPS[colorMap]
    .map(([offset, [red, green, blue]]) => `rgb(${red} ${green} ${blue}) ${offset * 100}%`)
    .join(', ')})`

/**
 * Calculates string-wave speed from tension and linear density.
 */
export const getStandingWaveSpeed = (tension: number, linearDensity: number) =>
  Math.sqrt(Math.max(tension, 0.01) / Math.max(linearDensity, 0.0001))

/**
 * Converts the UI mode index into the frequency ratio allowed by the boundary.
 */
export const getStandingModeRatio = (boundary: BoundaryCondition, modeIndex: number) =>
  boundary === 'fixed-free' ? 2 * modeIndex - 1 : modeIndex

/**
 * Lists the frequency ratios of the first `count` normal modes.
 */
export const getModeRatios = (boundary: BoundaryCondition, count = STANDING_MODE_COUNT) =>
  Array.from({ length: count }, (_, index) => getStandingModeRatio(boundary, index + 1))

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

const getSettingsFundamental = (settings: StandingWaveSettings) =>
  getFundamentalFrequency(
    settings.length,
    settings.tension,
    settings.linearDensity,
    settings.boundary,
  )

/**
 * Computes the resonant frequency of the currently selected standing-wave mode.
 */
export const getStandingFrequency = (settings: StandingWaveSettings) =>
  getSettingsFundamental(settings) * getStandingModeRatio(settings.boundary, settings.modeIndex)

/**
 * Computes the wavelength associated with the active standing-wave frequency.
 */
export const getStandingWavelength = (settings: StandingWaveSettings) =>
  getStandingWaveSpeed(settings.tension, settings.linearDensity) / getStandingFrequency(settings)

/**
 * Converts real seconds into the slowed-down clock used to animate the string.
 *
 * Real string frequencies (tens to hundreds of Hz) are far above the display
 * refresh rate, so the animation is slowed until the fundamental appears to
 * oscillate at SLOW_VISUAL_FUNDAMENTAL Hz. Frequency ratios are preserved.
 */
export const getSlowMotionFactor = (settings: StandingWaveSettings) =>
  Math.max(getSettingsFundamental(settings) / SLOW_VISUAL_FUNDAMENTAL, 1)

/**
 * Evaluates the normalized mode shape of a given frequency ratio.
 */
export const getModeShape = (
  x: number,
  ratio: number,
  boundary: BoundaryCondition,
  length: number,
) => {
  switch (boundary) {
    case 'fixed-fixed':
      return Math.sin((ratio * Math.PI * x) / length)
    case 'fixed-free':
      return Math.sin((ratio * Math.PI * x) / (2 * length))
    case 'free-free':
      return Math.cos((ratio * Math.PI * x) / length)
    default:
      return 0
  }
}

/**
 * Evaluates the standing-wave displacement y(x, t) at one position on the string.
 */
export const getStandingDisplacement = (x: number, time: number, settings: StandingWaveSettings) =>
  2 *
  settings.amplitude *
  getModeShape(
    x,
    getStandingModeRatio(settings.boundary, settings.modeIndex),
    settings.boundary,
    settings.length,
  ) *
  Math.cos(2 * Math.PI * getStandingFrequency(settings) * time)

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

  if (settings.boundary === 'free-free') {
    return {
      forward: settings.amplitude * Math.cos(k * x - omega * time),
      backward: settings.amplitude * Math.cos(k * x + omega * time),
    }
  }

  return {
    forward: settings.amplitude * Math.sin(k * x - omega * time),
    backward: settings.amplitude * Math.sin(k * x + omega * time),
  }
}

/**
 * Lists analytical node positions for a mode ratio and boundary condition.
 */
export const getNodesForRatio = (boundary: BoundaryCondition, ratio: number, length: number) => {
  const positions: number[] = []

  switch (boundary) {
    case 'fixed-fixed':
      for (let index = 0; index <= ratio; index += 1) {
        positions.push((length * index) / ratio)
      }
      break
    case 'fixed-free':
      for (let index = 0; ; index += 1) {
        const position = (2 * length * index) / ratio
        if (position > length + 1e-6) {
          break
        }
        positions.push(position)
      }
      break
    case 'free-free':
      for (let index = 0; index < ratio; index += 1) {
        positions.push((length * (index + 0.5)) / ratio)
      }
      break
    default:
      break
  }

  return positions
}

/**
 * Lists analytical antinode positions for a mode ratio and boundary condition.
 */
export const getAntinodesForRatio = (
  boundary: BoundaryCondition,
  ratio: number,
  length: number,
) => {
  const positions: number[] = []

  switch (boundary) {
    case 'fixed-fixed':
      for (let index = 0; index < ratio; index += 1) {
        positions.push((length * (index + 0.5)) / ratio)
      }
      break
    case 'fixed-free':
      for (let index = 0; ; index += 1) {
        const position = (length * (2 * index + 1)) / ratio
        if (position > length + 1e-6) {
          break
        }
        positions.push(position)
      }
      break
    case 'free-free':
      for (let index = 0; index <= ratio; index += 1) {
        positions.push((length * index) / ratio)
      }
      break
    default:
      break
  }

  return positions
}

/**
 * Lists analytical node positions for the selected string boundary condition.
 */
export const getStandingNodes = (settings: StandingWaveSettings) =>
  getNodesForRatio(
    settings.boundary,
    getStandingModeRatio(settings.boundary, settings.modeIndex),
    settings.length,
  )

/**
 * Lists analytical antinode positions for the selected string boundary condition.
 */
export const getStandingAntinodes = (settings: StandingWaveSettings) =>
  getAntinodesForRatio(
    settings.boundary,
    getStandingModeRatio(settings.boundary, settings.modeIndex),
    settings.length,
  )

export interface ModeResponse {
  ratio: number
  frequency: number
  real: number
  imaginary: number
  magnitude: number
}

/**
 * Computes the steady-state response of each normal mode to a sinusoidal drive.
 *
 * Every mode is treated as a damped oscillator with transfer function
 * H = 1 / (1 − u² + iγu), u = f / fₙ, scaled by γ so that exact resonance
 * gives a magnitude of 1 and far-off driving gives a small, messy wiggle.
 */
export const getDrivenModeResponses = (
  settings: StandingWaveSettings,
  driveFrequency = settings.driveFrequency,
): ModeResponse[] => {
  const fundamental = getSettingsFundamental(settings)

  return getModeRatios(settings.boundary).map((ratio) => {
    const modeFrequency = fundamental * ratio
    const u = driveFrequency / modeFrequency
    const detuning = 1 - u * u
    const damping = DRIVE_DAMPING * u
    const denominator = detuning * detuning + damping * damping
    const real = (DRIVE_DAMPING * detuning) / denominator
    const imaginary = (-DRIVE_DAMPING * damping) / denominator

    return {
      ratio,
      frequency: modeFrequency,
      real,
      imaginary,
      magnitude: Math.hypot(real, imaginary),
    }
  })
}

/**
 * Returns how strongly the string resonates (0–1) for a drive frequency.
 */
export const getResonanceLevel = (
  settings: StandingWaveSettings,
  driveFrequency = settings.driveFrequency,
) =>
  Math.min(
    1,
    Math.max(
      ...getDrivenModeResponses(settings, driveFrequency).map((response) => response.magnitude),
    ),
  )

/**
 * Finds the normal mode whose frequency is closest to the drive frequency.
 */
export const getNearestResonance = (settings: StandingWaveSettings) => {
  const responses = getDrivenModeResponses(settings)
  return responses.reduce((best, response) =>
    Math.abs(response.frequency - settings.driveFrequency) <
    Math.abs(best.frequency - settings.driveFrequency)
      ? response
      : best,
  )
}

/**
 * Evaluates the displacement of a driven string as a sum of responding modes.
 */
export const getDrivenDisplacement = (
  x: number,
  time: number,
  settings: StandingWaveSettings,
  responses: ModeResponse[],
) => {
  const omegaT = 2 * Math.PI * settings.driveFrequency * time
  const cosine = Math.cos(omegaT)
  const sine = Math.sin(omegaT)

  return (
    2 *
    settings.amplitude *
    responses.reduce(
      (sum, response) =>
        sum +
        getModeShape(x, response.ratio, settings.boundary, settings.length) *
          (response.real * cosine - response.imaginary * sine),
      0,
    )
  )
}

/**
 * Upper end of the drive-frequency slider, half a mode above the highest mode.
 */
export const getMaxDriveFrequency = (settings: StandingWaveSettings) => {
  const ratios = getModeRatios(settings.boundary)
  return getSettingsFundamental(settings) * (ratios[ratios.length - 1] + 0.5)
}

/**
 * Lower end of the drive-frequency slider.
 */
export const getMinDriveFrequency = (settings: StandingWaveSettings) =>
  getSettingsFundamental(settings) * 0.3
