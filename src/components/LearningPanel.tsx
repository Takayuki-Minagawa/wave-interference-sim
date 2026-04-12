import { useState } from 'react'

import { uiText } from '../data/translations'
import { formatNumber } from '../lib/format'
import type {
  InterferenceSummary,
  Locale,
  QuizItem,
  SimulationMode,
  StandingSummary,
} from '../types'

interface LearningPanelProps {
  locale: Locale
  mode: SimulationMode
  interferenceSummary: InterferenceSummary
  standingSummary: StandingSummary
}

const localizeClass = (
  classification: InterferenceSummary['classification'],
  locale: Locale,
) => {
  switch (classification) {
    case 'constructive':
      return locale === 'ja' ? '強めあい' : 'constructive'
    case 'destructive':
      return locale === 'ja' ? '弱めあい' : 'destructive'
    case 'mixed':
      return locale === 'ja' ? '中間領域' : 'intermediate'
    default:
      return locale === 'ja' ? '評価不可' : 'unavailable'
  }
}

const buildInterferenceInsights = (
  summary: InterferenceSummary,
  locale: Locale,
) => {
  const insights: string[] = []

  if (summary.probePoint && summary.pathDifference !== null && summary.representativeWavelength) {
    const ratio = summary.pathDifference / summary.representativeWavelength
    insights.push(
      locale === 'ja'
        ? `観測点の経路差は約 ${formatNumber(summary.pathDifference, locale, 2)} で、波長比は ${formatNumber(ratio, locale, 2)} λ です。現在は ${localizeClass(summary.classification, locale)} に近い条件です。`
        : `The selected probe has a path difference of about ${formatNumber(summary.pathDifference, locale, 2)}. That corresponds to ${formatNumber(ratio, locale, 2)} λ, so the point is currently near ${localizeClass(summary.classification, locale)} interference.`
    )
  } else {
    insights.push(
      locale === 'ja'
        ? '観測点を置くと、その場所の経路差と干渉条件を定量的に確認できます。'
        : 'Add a probe point to quantify the local path difference and identify the interference condition.'
    )
  }

  insights.push(
    summary.stablePattern
      ? locale === 'ja'
        ? '主要な波源の波長と周波数がほぼ一致しているため、干渉縞は時間平均でも安定に見えます。'
        : 'The main sources are closely matched in wavelength and frequency, so the fringe pattern stays nearly stationary.'
      : locale === 'ja'
        ? '波源条件に差があるため、干渉縞は時間とともに流れたり揺れたりします。'
        : 'The source parameters are mismatched enough that the fringe pattern drifts over time.'
  )

  insights.push(
    locale === 'ja'
      ? `平均的な伝播速度は ${formatNumber(summary.averageSpeed, locale, 2)} です。v = λf の関係を見ながら、波長と周波数を同時に変えてみてください。`
      : `The average wave speed is ${formatNumber(summary.averageSpeed, locale, 2)}. Try changing λ and f while keeping the relation v = λf in mind.`
  )

  return insights
}

const buildStandingInsights = (summary: StandingSummary, locale: Locale) => {
  const insights: string[] = []

  const boundaryText =
    summary.boundary === 'fixed-free'
      ? locale === 'ja'
        ? '片側自由'
        : 'fixed-free'
      : summary.boundary === 'free-free'
        ? locale === 'ja'
          ? '両端自由'
          : 'free-free'
        : locale === 'ja'
          ? '両端固定'
          : 'fixed-fixed'

  insights.push(
    locale === 'ja'
      ? `${boundaryText} 条件で基本振動数比が ${formatNumber(summary.modeRatio, locale, 0)} のモードです。節は ${summary.nodePositions.length} 個、腹は ${summary.antinodePositions.length} 個現れます。`
      : `This is a ${boundaryText} setup with a mode ratio of ${formatNumber(summary.modeRatio, locale, 0)}. It shows ${summary.nodePositions.length} nodes and ${summary.antinodePositions.length} antinodes.`
  )

  insights.push(
    locale === 'ja'
      ? `現在の周波数は ${formatNumber(summary.frequency, locale, 2)} Hz、基本振動数は ${formatNumber(summary.fundamentalFrequency, locale, 2)} Hz です。`
      : `The current frequency is ${formatNumber(summary.frequency, locale, 2)} Hz while the fundamental is ${formatNumber(summary.fundamentalFrequency, locale, 2)} Hz.`
  )

  insights.push(
    locale === 'ja'
      ? `波の速さは ${formatNumber(summary.waveSpeed, locale, 2)} m/s、対応する波長は ${formatNumber(summary.wavelength, locale, 2)} m です。張力や線密度を変えると固有振動数がどう動くか比べられます。`
      : `The wave speed is ${formatNumber(summary.waveSpeed, locale, 2)} m/s and the wavelength is ${formatNumber(summary.wavelength, locale, 2)} m. Compare how tension and linear density shift the resonant frequencies.`
  )

  return insights
}

const buildInterferenceQuiz = (
  summary: InterferenceSummary,
  locale: Locale,
): QuizItem[] => {
  const probeQuestion =
    summary.probePoint && summary.pathDifference !== null && summary.representativeWavelength
      ? {
          id: 'probe-classification',
          prompt: {
            ja: '現在の観測点はどの干渉条件に最も近いですか。',
            en: 'Which interference condition best matches the current probe point?',
          },
          options: [
            { id: 'constructive', label: { ja: '強めあい', en: 'Constructive' } },
            { id: 'destructive', label: { ja: '弱めあい', en: 'Destructive' } },
            { id: 'mixed', label: { ja: '中間領域', en: 'Intermediate' } },
          ],
          correctOptionId: summary.classification,
          explanation: {
            ja: `観測点では経路差と波長の比から ${localizeClass(summary.classification, locale)} と判定できます。`,
            en: `The local path-difference ratio places the point near ${localizeClass(summary.classification, locale)} interference.`,
          },
        }
      : {
          id: 'stable-pattern',
          prompt: {
            ja: '同じ周波数・同じ波長の2波源では、干渉縞はどう見えやすいですか。',
            en: 'How do the fringes behave when two sources share the same frequency and wavelength?',
          },
          options: [
            { id: 'stable', label: { ja: 'ほぼ静止して見える', en: 'They look stationary' } },
            { id: 'wash-out', label: { ja: 'すぐ消える', en: 'They immediately disappear' } },
            { id: 'random', label: { ja: '完全にランダムになる', en: 'They become random' } },
          ],
          correctOptionId: 'stable',
          explanation: {
            ja: '周波数差がほぼなければ位相差が時間的に保たれ、干渉縞は安定します。',
            en: 'When the frequency mismatch is negligible, the relative phase stays fixed and the fringe pattern remains stable.',
          },
        }

  return [
    {
      id: 'constructive-condition',
      prompt: {
        ja: '強めあいの代表的な条件はどれですか。',
        en: 'Which expression describes a standard constructive-interference condition?',
      },
      options: [
        { id: 'm-lambda', label: { ja: '経路差 = mλ', en: 'Path difference = mλ' } },
        {
          id: 'half',
          label: { ja: '経路差 = (m + 1/2)λ', en: 'Path difference = (m + 1/2)λ' },
        },
        { id: 'quarter', label: { ja: '経路差 = λ/4', en: 'Path difference = λ/4' } },
      ],
      correctOptionId: 'm-lambda',
      explanation: {
        ja: '経路差が整数倍の波長になると位相がそろい、強めあいが起こります。',
        en: 'When the path difference is an integer multiple of the wavelength, the phases align and the waves reinforce.',
      },
    },
    probeQuestion,
    {
      id: 'speed-law',
      prompt: {
        ja: '波の速さ v が一定で周波数 f を2倍にすると、波長 λ はどうなりますか。',
        en: 'If wave speed v stays fixed and frequency f doubles, what happens to λ?',
      },
      options: [
        { id: 'half', label: { ja: '半分になる', en: 'It halves' } },
        { id: 'same', label: { ja: '変わらない', en: 'It stays the same' } },
        { id: 'double', label: { ja: '2倍になる', en: 'It doubles' } },
      ],
      correctOptionId: 'half',
      explanation: {
        ja: 'v = λf なので、速度一定なら周波数を上げるほど波長は短くなります。',
        en: 'Since v = λf, holding v fixed means the wavelength shrinks as frequency increases.',
      },
    },
  ]
}

const buildStandingQuiz = (
  summary: StandingSummary,
  locale: Locale,
): QuizItem[] => {
  const fundamentalAnswer =
    summary.boundary === 'fixed-free' ? 'quarter' : 'half'

  return [
    {
      id: 'fundamental-formula',
      prompt: {
        ja: 'この境界条件の基本振動数に最も対応する式はどれですか。',
        en: 'Which formula matches the fundamental frequency for this boundary condition?',
      },
      options: [
        { id: 'half', label: { ja: 'f₁ = v / 2L', en: 'f₁ = v / 2L' } },
        { id: 'quarter', label: { ja: 'f₁ = v / 4L', en: 'f₁ = v / 4L' } },
        { id: 'none', label: { ja: 'f₁ = v / L', en: 'f₁ = v / L' } },
      ],
      correctOptionId: fundamentalAnswer,
      explanation: {
        ja:
          summary.boundary === 'fixed-free'
            ? '片側自由では基本モードが 1/4 波長なので f₁ = v / 4L になります。'
            : '両端固定や両端自由では基本モードが 1/2 波長なので f₁ = v / 2L です。',
        en:
          summary.boundary === 'fixed-free'
            ? 'A fixed-free system fits one quarter wavelength in the fundamental mode, so f₁ = v / 4L.'
            : 'Fixed-fixed and free-free systems fit half a wavelength in the fundamental mode, so f₁ = v / 2L.',
      },
    },
    {
      id: 'node-count',
      prompt: {
        ja: '現在の設定で表示される節の数はいくつですか。',
        en: 'How many nodes are shown in the current configuration?',
      },
      options: [
        {
          id: 'minus',
          label: {
            ja: String(Math.max(summary.nodePositions.length - 1, 0)),
            en: String(Math.max(summary.nodePositions.length - 1, 0)),
          },
        },
        {
          id: 'exact',
          label: {
            ja: String(summary.nodePositions.length),
            en: String(summary.nodePositions.length),
          },
        },
        {
          id: 'plus',
          label: {
            ja: String(summary.nodePositions.length + 1),
            en: String(summary.nodePositions.length + 1),
          },
        },
      ],
      correctOptionId: 'exact',
      explanation: {
        ja: '節は境界条件とモード番号から解析的に決まり、画面上のマーカーでも確認できます。',
        en: 'The node count follows directly from the boundary condition and the selected mode, and the markers show the result.',
      },
    },
    {
      id: 'ratio',
      prompt: {
        ja: '現在のモードは基本振動数の何倍ですか。',
        en: 'How many times the fundamental is the current mode?',
      },
      options: [
        {
          id: 'ratio',
          label: {
            ja: `${formatNumber(summary.modeRatio, locale, 0)} 倍`,
            en: `${formatNumber(summary.modeRatio, locale, 0)}x`,
          },
        },
        {
          id: 'ratio-plus',
          label: {
            ja: `${formatNumber(summary.modeRatio + 1, locale, 0)} 倍`,
            en: `${formatNumber(summary.modeRatio + 1, locale, 0)}x`,
          },
        },
        {
          id: 'ratio-minus',
          label: {
            ja: `${formatNumber(Math.max(summary.modeRatio - 1, 1), locale, 0)} 倍`,
            en: `${formatNumber(Math.max(summary.modeRatio - 1, 1), locale, 0)}x`,
          },
        },
      ],
      correctOptionId: 'ratio',
      explanation: {
        ja: '現在の周波数を基本振動数で割ると、どの固有モードにいるかがわかります。',
        en: 'Dividing the current frequency by the fundamental frequency reveals the mode ratio.',
      },
    },
  ]
}

export function LearningPanel({
  locale,
  mode,
  interferenceSummary,
  standingSummary,
}: LearningPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const copy = uiText[locale]

  const insights =
    mode === 'interference'
      ? buildInterferenceInsights(interferenceSummary, locale)
      : buildStandingInsights(standingSummary, locale)

  const references =
    mode === 'interference'
      ? [
          locale === 'ja'
            ? '中央付近と外側で干渉縞の間隔がどう変わるか比べる。'
            : 'Compare the fringe spacing near the center and near the edges.',
          locale === 'ja'
            ? '位相差を変えると強めあい線がどう移動するか追う。'
            : 'Track how the constructive lines shift when you change the phase offset.',
          locale === 'ja'
            ? '波源数を4つに増やして、パターンの細かさを確認する。'
            : 'Increase the number of sources to four and inspect how dense the pattern becomes.',
        ]
      : [
          locale === 'ja'
            ? '境界条件を変えて、端点が節になるか腹になるかを比べる。'
            : 'Switch boundary conditions and compare whether each end becomes a node or an antinode.',
          locale === 'ja'
            ? '張力を上げたときに固有振動数がどう上がるか確認する。'
            : 'Raise the tension and observe how the resonant frequencies increase.',
          locale === 'ja'
            ? '片側自由では奇数次モードだけが現れることに注目する。'
            : 'Notice that the fixed-free case only supports odd mode ratios.',
        ]

  const quizItems =
    mode === 'interference'
      ? buildInterferenceQuiz(interferenceSummary, locale)
      : buildStandingQuiz(standingSummary, locale)

  return (
    <div className="learning-panel">
      <section className="panel-block">
        <div className="panel-block__title">{copy.insightTitle}</div>
        <div className="insight-list">
          {insights.map((insight) => (
            <p key={insight} className="insight-item">
              {insight}
            </p>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.referencesTitle}</div>
        <div className="reference-list">
          {references.map((reference) => (
            <p key={reference} className="reference-item">
              {reference}
            </p>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.quizTitle}</div>
        <div className="quiz-list">
          {quizItems.map((quiz) => {
            const selectedOption = answers[quiz.id]
            const isCorrect = selectedOption === quiz.correctOptionId

            return (
              <article key={quiz.id} className="quiz-card">
                <h3>{quiz.prompt[locale]}</h3>
                <div className="quiz-options">
                  {quiz.options.map((option) => {
                    const isSelected = selectedOption === option.id
                    const optionClassName = [
                      'quiz-option',
                      isSelected ? 'is-selected' : '',
                      selectedOption && option.id === quiz.correctOptionId
                        ? 'is-correct'
                        : '',
                      selectedOption &&
                      isSelected &&
                      option.id !== quiz.correctOptionId
                        ? 'is-wrong'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={optionClassName}
                        onClick={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [quiz.id]: option.id,
                          }))
                        }
                      >
                        {option.label[locale]}
                      </button>
                    )
                  })}
                </div>
                {selectedOption ? (
                  <p className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    {isCorrect
                      ? locale === 'ja'
                        ? `正解。${quiz.explanation[locale]}`
                        : `Correct. ${quiz.explanation[locale]}`
                      : locale === 'ja'
                        ? `再確認。${quiz.explanation[locale]}`
                        : `Check again. ${quiz.explanation[locale]}`}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
