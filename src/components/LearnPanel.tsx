import type { UiCopy } from '../data/translations'
import { formatNumber } from '../lib/format'
import { getBoundaryLabel, getClassLabel } from '../lib/labels'
import type {
  InterferenceSummary,
  Locale,
  LocalizedText,
  SimulationMode,
  StandingSummary,
} from '../types'
import { Icon } from './Icon'

interface LearnPanelProps {
  copy: UiCopy
  locale: Locale
  mode: SimulationMode
  interferenceSummary: InterferenceSummary
  standingSummary: StandingSummary
}

interface Concept {
  title: LocalizedText
  formula: string
  body: LocalizedText
}

const interferenceConcepts: Concept[] = [
  {
    title: { ja: '重ね合わせの原理', en: 'Superposition' },
    formula: 'y = y₁ + y₂',
    body: {
      ja: '2つの波が出会うと、その点の変位は単純に足し算になります。山＋山は大きな山、山＋谷は打ち消しあいます。',
      en: 'Where waves meet, their displacements simply add. Crest + crest makes a bigger crest; crest + trough cancels.',
    },
  },
  {
    title: { ja: '強めあう条件', en: 'Constructive condition' },
    formula: '|r₁ − r₂| = mλ',
    body: {
      ja: '2つの波源からの距離の差（経路差）が波長の整数倍なら、山と山がそろって届きます。',
      en: 'If the path difference is a whole number of wavelengths, crests arrive together.',
    },
  },
  {
    title: { ja: '弱めあう条件', en: 'Destructive condition' },
    formula: '|r₁ − r₂| = (m + ½)λ',
    body: {
      ja: '経路差が半波長ずれると、山と谷が重なって水面がほとんど動かなくなります。この点をつないだ線が節線です。',
      en: 'Half a wavelength off, a crest meets a trough and the water barely moves. Joining these points gives nodal lines.',
    },
  },
  {
    title: { ja: '波の基本式', en: 'The wave equation' },
    formula: 'v = fλ',
    body: {
      ja: '波は1周期 T = 1/f の間に1波長 λ だけ進みます。速さ v は周波数と波長の積です。',
      en: 'In one period T = 1/f a wave travels one wavelength λ, so its speed is v = fλ.',
    },
  },
]

const standingConcepts: Concept[] = [
  {
    title: { ja: '定常波のでき方', en: 'How standing waves form' },
    formula: 'y = 2A sin kx · cos ωt',
    body: {
      ja: '右向きと左向きの同じ進行波が重なると、その場で上下するだけの波になります。',
      en: 'Two identical waves moving in opposite directions add up to a wave that only moves up and down in place.',
    },
  },
  {
    title: { ja: '節と腹', en: 'Nodes and antinodes' },
    formula: 'd = λ/2',
    body: {
      ja: 'まったく動かない点が節、いちばん大きく揺れる点が腹。固定端は節、自由端は腹になります。',
      en: 'Nodes never move; antinodes swing the most. A fixed end is a node, a free end is an antinode.',
    },
  },
  {
    title: { ja: '弦を伝わる波の速さ', en: 'Wave speed on a string' },
    formula: 'v = √(T/μ)',
    body: {
      ja: '張力 T が大きいほど、線密度 μ（1 m あたりの質量）が小さいほど速く伝わります。',
      en: 'Higher tension T and lighter strings (smaller mass per metre μ) carry waves faster.',
    },
  },
  {
    title: { ja: '固有振動数', en: 'Natural frequencies' },
    formula: 'fₙ = n·v / 2L',
    body: {
      ja: '両端固定（両端自由）では基本振動の整数倍、片側自由では fₙ = (2n−1)v/4L の奇数倍だけが現れます。',
      en: 'Fixed–fixed (or free–free) strings ring at whole multiples of f₁; fixed–free only at odd multiples, (2n−1)v/4L.',
    },
  },
]

const interferenceTips: LocalizedText[] = [
  {
    ja: '「揺れの強さ」表示で、放射状にのびる縞の本数を数えてみよう。',
    en: 'In Intensity view, count the bright fringes fanning out from the sources.',
  },
  {
    ja: '波源を近づけたり離したりして、縞の本数の変化を比べよう。',
    en: 'Move the sources closer and farther apart and compare the number of fringes.',
  },
  {
    ja: '初期位相を π にすると、強めあう線と弱めあう線が入れかわるか確かめよう。',
    en: 'Set one phase to π and check whether bright and dark lines swap places.',
  },
  {
    ja: '観測点のグラフで、強めあいの点と弱めあいの点の振幅を比べよう。',
    en: 'Use the probe chart to compare the motion at bright and dark spots.',
  },
]

const standingTips: LocalizedText[] = [
  {
    ja: '「進行波」を表示して、2つの波の和が定常波になる様子を一時停止で確かめよう。',
    en: 'Show the traveling waves and pause to check that they add up to the standing wave.',
  },
  {
    ja: '張力を4倍にすると、振動数は何倍になるかな？',
    en: 'Quadruple the tension. By what factor does the frequency change?',
  },
  {
    ja: '片側自由で2倍振動が選べない理由を考えよう。',
    en: 'Why is there no 2nd harmonic for a fixed–free string?',
  },
  {
    ja: '「共鳴さがし」で、共鳴カーブの山が等間隔に並ぶことを確かめよう。',
    en: 'In Resonance hunt, check that the peaks in the resonance curve are evenly spaced.',
  },
]

const buildInterferenceInsights = (
  summary: InterferenceSummary,
  locale: Locale,
  copy: UiCopy,
): string[] => {
  const fmt = (value: number, digits = 2) => formatNumber(value, locale, digits)
  const insights: string[] = []

  if (summary.sourceCount === 0) {
    return [
      locale === 'ja'
        ? 'すべての波源がOFFです。波源をONにすると波が広がります。'
        : 'All sources are off. Turn one on to start the ripples.',
    ]
  }

  if (summary.sourceCount === 1) {
    insights.push(
      locale === 'ja'
        ? '波源が1つなので干渉は起きず、同心円の波が広がるだけです。波源を追加してみよう。'
        : 'With a single source there is no interference — just circular ripples. Try adding another source.',
    )
  }

  if (summary.sourceSeparation !== null && summary.representativeWavelength) {
    const fringeCount = Math.floor(summary.sourceSeparation / summary.representativeWavelength)
    insights.push(
      locale === 'ja'
        ? `波源の間隔は ${fmt(summary.sourceSeparation, 1)} cm で、波長の約 ${fmt(summary.sourceSeparation / summary.representativeWavelength, 1)} 倍。経路差は最大でこの間隔なので、片側に強めあう線が約 ${fringeCount} 本（中央を除く）現れます。`
        : `The sources are ${fmt(summary.sourceSeparation, 1)} cm apart, about ${fmt(summary.sourceSeparation / summary.representativeWavelength, 1)} wavelengths. The path difference can't exceed this, so you get about ${fringeCount} bright line(s) on each side of the centre.`,
    )
  }

  if (summary.phaseDifference !== null && Math.abs(summary.phaseDifference) > 0.01) {
    insights.push(
      locale === 'ja'
        ? `2つの波源の初期位相が ${fmt(Math.abs(summary.phaseDifference) / Math.PI)}π ずれています。そのぶん強めあう線が横にずれます。`
        : `The sources are ${fmt(Math.abs(summary.phaseDifference) / Math.PI)}π out of phase, which shifts the bright lines sideways.`,
    )
  }

  if (summary.sourceCount >= 2) {
    insights.push(
      summary.stablePattern
        ? locale === 'ja'
          ? '波長と周波数がそろっているので、縞模様はその場にとどまります。'
          : 'Wavelengths and frequencies match, so the fringe pattern stays put.'
        : locale === 'ja'
          ? '波源の条件が違うため、位相差が時間とともに変わり、縞が流れていきます。'
          : 'The sources differ, so their phase difference changes over time and the fringes drift.',
    )
  }

  if (summary.probePoint && summary.pathDifference !== null && summary.representativeWavelength) {
    insights.push(
      locale === 'ja'
        ? `観測点の経路差は ${fmt(summary.pathDifference, 1)} cm（${fmt(summary.pathDifference / summary.representativeWavelength)}λ）。判定は「${getClassLabel(summary.classification, copy)}」です。`
        : `At the probe the path difference is ${fmt(summary.pathDifference, 1)} cm (${fmt(summary.pathDifference / summary.representativeWavelength)}λ): ${getClassLabel(summary.classification, copy).toLowerCase()}.`,
    )
  }

  return insights
}

const buildStandingInsights = (
  summary: StandingSummary,
  locale: Locale,
  copy: UiCopy,
): string[] => {
  const fmt = (value: number, digits = 1) => formatNumber(value, locale, digits)
  const boundary = getBoundaryLabel(summary.boundary, copy)

  if (summary.driveMode === 'driven') {
    const ratio = summary.driveFrequency / summary.fundamentalFrequency
    return [
      locale === 'ja'
        ? `${fmt(summary.driveFrequency)} Hz で弦をゆらしています。基本振動数 ${fmt(summary.fundamentalFrequency)} Hz の ${fmt(ratio, 2)} 倍です。`
        : `Driving at ${fmt(summary.driveFrequency)} Hz — ${fmt(ratio, 2)} × the fundamental (${fmt(summary.fundamentalFrequency)} Hz).`,
      summary.resonanceLevel >= 0.85
        ? locale === 'ja'
          ? `固有振動数（${copy.harmonic(summary.nearestResonanceRatio)}）にぴったり合って共鳴しています！`
          : `It matches a natural frequency (${copy.harmonic(summary.nearestResonanceRatio)}) — resonance!`
        : locale === 'ja'
          ? `固有振動数からずれているので、弦はあまり揺れません。いちばん近いのは ${copy.harmonic(summary.nearestResonanceRatio)}（${fmt(summary.nearestResonanceFrequency)} Hz）。`
          : `Off a natural frequency the string barely moves. The nearest is the ${copy.harmonic(summary.nearestResonanceRatio).toLowerCase()} at ${fmt(summary.nearestResonanceFrequency)} Hz.`,
    ]
  }

  return [
    locale === 'ja'
      ? `${boundary}の弦の ${copy.harmonic(summary.modeRatio)}。節が ${summary.nodePositions.length} 個、腹が ${summary.antinodePositions.length} 個あります。`
      : `${boundary} string, ${copy.harmonic(summary.modeRatio).toLowerCase()}: ${summary.nodePositions.length} node(s) and ${summary.antinodePositions.length} antinode(s).`,
    locale === 'ja'
      ? `波の速さ ${fmt(summary.waveSpeed)} m/s、波長 ${fmt(summary.wavelength, 2)} m なので、振動数は f = v/λ = ${fmt(summary.frequency)} Hz。`
      : `Wave speed ${fmt(summary.waveSpeed)} m/s and wavelength ${fmt(summary.wavelength, 2)} m give f = v/λ = ${fmt(summary.frequency)} Hz.`,
    locale === 'ja'
      ? `実際の振動は速すぎて見えないので、画面では約 1/${fmt(summary.slowMotionFactor, 0)} のスロー再生にしています。`
      : `The real motion is too fast to see, so it is shown at about 1/${fmt(summary.slowMotionFactor, 0)} speed.`,
  ]
}

export function LearnPanel({
  copy,
  locale,
  mode,
  interferenceSummary,
  standingSummary,
}: LearnPanelProps) {
  const insights =
    mode === 'interference'
      ? buildInterferenceInsights(interferenceSummary, locale, copy)
      : buildStandingInsights(standingSummary, locale, copy)
  const concepts = mode === 'interference' ? interferenceConcepts : standingConcepts
  const tips = mode === 'interference' ? interferenceTips : standingTips

  return (
    <div className="learn">
      <section className="learn__now" aria-live="polite">
        <h3>
          <Icon name="eye" size={18} /> {copy.nowTitle}
        </h3>
        <ul>
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="learn__heading">
          <Icon name="book" size={18} /> {copy.basicsTitle}
        </h3>
        <div className="concept-list">
          {concepts.map((concept) => (
            <article key={concept.title.en} className="concept">
              <header>
                <strong>{concept.title[locale]}</strong>
                <code>{concept.formula}</code>
              </header>
              <p>{concept.body[locale]}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="learn__heading">
          <Icon name="lightbulb" size={18} /> {copy.observeTitle}
        </h3>
        <ul className="tip-list">
          {tips.map((tip) => (
            <li key={tip.en}>{tip[locale]}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
