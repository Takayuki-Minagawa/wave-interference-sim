import type { InterferenceSummary, LocalizedText, SimulationMode, StandingSummary } from '../types'

export interface MissionContext {
  interference: InterferenceSummary
  standing: StandingSummary
}

export interface Mission {
  id: string
  mode: SimulationMode
  title: LocalizedText
  hint: LocalizedText
  check: (context: MissionContext) => boolean
}

/** Resonance level (0–1) counted as "hitting" a resonance. */
export const RESONANCE_SUCCESS = 0.85

export const missions: Mission[] = [
  {
    id: 'i-probe',
    mode: 'interference',
    title: { ja: '観測点を置いてみよう', en: 'Drop a probe' },
    hint: {
      ja: '水面のどこかをタップ（クリック）してみよう。',
      en: 'Tap (or click) anywhere on the water.',
    },
    check: ({ interference }) => interference.probePoint !== null,
  },
  {
    id: 'i-destructive',
    mode: 'interference',
    title: { ja: '弱めあう点を見つけよう', en: 'Find a destructive spot' },
    hint: {
      ja: '「揺れの強さ」表示にすると、静かな暗い線が見えます。その上をタップ。',
      en: 'Switch to the Intensity view and tap on one of the dark, still lines.',
    },
    check: ({ interference }) => interference.classification === 'destructive',
  },
  {
    id: 'i-constructive',
    mode: 'interference',
    title: { ja: '中央以外で強めあう点を見つけよう', en: 'Find a bright spot off-centre' },
    hint: {
      ja: '経路差がちょうど 1λ、2λ… になる点です。「強めあう線」ガイドを使うと簡単。',
      en: 'Look for a path difference of exactly 1λ, 2λ… The constructive-line guide helps.',
    },
    check: ({ interference }) =>
      interference.classification === 'constructive' &&
      interference.phaseRatio !== null &&
      Math.abs(interference.phaseRatio) >= 0.75,
  },
  {
    id: 'i-intensity',
    mode: 'interference',
    title: { ja: '揺れの強さを見てみよう', en: 'Reveal the intensity map' },
    hint: {
      ja: '「表示」の切り替えで「揺れの強さ」を選ぶと、縞模様がくっきり見えます。',
      en: 'Choose “Intensity” in the view switch to see the fringes clearly.',
    },
    check: ({ interference }) => interference.viewMode === 'intensity',
  },
  {
    id: 'i-separation',
    mode: 'interference',
    title: { ja: '波源を 40 cm 以上はなそう', en: 'Spread the sources 40 cm apart' },
    hint: {
      ja: '波源の丸をドラッグして離すと、縞の本数はどう変わるかな？',
      en: 'Drag the source dots apart. How does the number of fringes change?',
    },
    check: ({ interference }) =>
      interference.sourceSeparation !== null && interference.sourceSeparation >= 40,
  },
  {
    id: 'i-antiphase',
    mode: 'interference',
    title: { ja: '真ん中を静かにしよう', en: 'Silence the centre line' },
    hint: {
      ja: '片方の波源の初期位相を π（半周期）ずらして、2つの波源から等距離の点をタップ。',
      en: 'Shift one source’s phase by π, then tap a point equally far from both sources.',
    },
    check: ({ interference }) =>
      interference.classification === 'destructive' &&
      interference.pathDifference !== null &&
      interference.representativeWavelength !== null &&
      interference.pathDifference < interference.representativeWavelength * 0.25,
  },
  {
    id: 'i-drift',
    mode: 'interference',
    title: { ja: '縞を流してみよう', en: 'Make the fringes drift' },
    hint: {
      ja: '「全波源でそろえる」をOFFにして、片方の周波数だけを少し変えてみよう。',
      en: 'Turn off “same λ and f”, then nudge one source’s frequency.',
    },
    check: ({ interference }) => interference.sourceCount >= 2 && !interference.stablePattern,
  },
  {
    id: 'i-four',
    mode: 'interference',
    title: { ja: '4つの波源で干渉させよう', en: 'Interfere with four sources' },
    hint: {
      ja: '「波源を追加」で4つまで増やせます。',
      en: 'Use “Add source” to go up to four.',
    },
    check: ({ interference }) => interference.sourceCount >= 4,
  },
  {
    id: 's-third',
    mode: 'standing',
    title: { ja: '腹が3つの定常波をつくろう', en: 'Make three loops' },
    hint: {
      ja: '両端固定で「3倍振動」を選んでみよう。',
      en: 'With both ends fixed, choose the 3rd harmonic.',
    },
    check: ({ standing }) =>
      standing.driveMode === 'natural' && standing.antinodePositions.length === 3,
  },
  {
    id: 's-free-end',
    mode: 'standing',
    title: { ja: '自由端を腹にしよう', en: 'Put an antinode at a free end' },
    hint: {
      ja: '「端のようす」で片側自由か両端自由を選ぶと、自由端は必ず腹になります。',
      en: 'Pick fixed–free or free–free. A free end is always an antinode.',
    },
    check: ({ standing }) => standing.boundary !== 'fixed-fixed',
  },
  {
    id: 's-nodes5',
    mode: 'standing',
    title: { ja: '節が5つのモードをつくろう', en: 'Make a mode with five nodes' },
    hint: {
      ja: '両端固定なら端の2つも節。4倍振動だと節はいくつ？',
      en: 'With fixed ends, both ends count as nodes. How many does the 4th harmonic have?',
    },
    check: ({ standing }) =>
      standing.driveMode === 'natural' && standing.nodePositions.length === 5,
  },
  {
    id: 's-high',
    mode: 'standing',
    title: { ja: '基本振動数を 50 Hz 以上に', en: 'Push the fundamental above 50 Hz' },
    hint: {
      ja: 'f₁ = v/2L、v = √(T/μ)。張力を上げる？弦を短くする？',
      en: 'f₁ = v/2L and v = √(T/μ). Raise the tension? Shorten the string?',
    },
    check: ({ standing }) => standing.fundamentalFrequency >= 50,
  },
  {
    id: 's-low',
    mode: 'standing',
    title: { ja: '基本振動数を 10 Hz 以下に', en: 'Drop the fundamental below 10 Hz' },
    hint: {
      ja: '重い（線密度の大きい）弦を、ゆるく、長く張ってみよう。',
      en: 'Use a heavy (high μ) string, slack and long.',
    },
    check: ({ standing }) => standing.fundamentalFrequency <= 10,
  },
  {
    id: 's-resonance',
    mode: 'standing',
    title: { ja: '共鳴させよう', en: 'Hit a resonance' },
    hint: {
      ja: '「共鳴さがし」で振動数を少しずつ変え、共鳴度メーターが満タンになる点を探そう。',
      en: 'In Resonance hunt, sweep the frequency until the meter fills up.',
    },
    check: ({ standing }) =>
      standing.driveMode === 'driven' && standing.resonanceLevel >= RESONANCE_SUCCESS,
  },
  {
    id: 's-resonance-2',
    mode: 'standing',
    title: { ja: '2倍振動で共鳴させよう', en: 'Resonate at the 2nd harmonic' },
    hint: {
      ja: '両端固定なら、基本振動数のちょうど2倍の振動数でゆらそう。',
      en: 'With fixed ends, drive at exactly twice the fundamental.',
    },
    check: ({ standing }) =>
      standing.driveMode === 'driven' &&
      standing.boundary === 'fixed-fixed' &&
      standing.nearestResonanceRatio === 2 &&
      standing.resonanceLevel >= RESONANCE_SUCCESS,
  },
  {
    id: 's-odd',
    mode: 'standing',
    title: { ja: '片側自由で3倍振動に共鳴', en: 'Fixed–free: resonate at 3f₁' },
    hint: {
      ja: '片側自由では偶数倍は現れません。3倍振動の振動数を探そう。',
      en: 'A fixed–free string has no even harmonics. Look for 3f₁.',
    },
    check: ({ standing }) =>
      standing.driveMode === 'driven' &&
      standing.boundary === 'fixed-free' &&
      standing.nearestResonanceRatio === 3 &&
      standing.resonanceLevel >= RESONANCE_SUCCESS,
  },
]
