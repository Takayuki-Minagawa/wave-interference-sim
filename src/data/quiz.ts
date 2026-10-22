import type { QuizItem, SimulationMode } from '../types'

const interferenceQuiz: QuizItem[] = [
  {
    id: 'constructive-condition',
    prompt: {
      ja: '同じ位相の2つの波源から出た波が強めあう条件は？（m = 0, 1, 2, …）',
      en: 'For two in-phase sources, which condition gives constructive interference? (m = 0, 1, 2, …)',
    },
    options: [
      { id: 'm-lambda', label: { ja: '経路差 = mλ', en: 'Path difference = mλ' } },
      { id: 'half', label: { ja: '経路差 = (m + ½)λ', en: 'Path difference = (m + ½)λ' } },
      { id: 'quarter', label: { ja: '経路差 = λ/4', en: 'Path difference = λ/4' } },
    ],
    correctOptionId: 'm-lambda',
    explanation: {
      ja: '経路差が波長の整数倍なら、山と山・谷と谷が同時に届いて強めあいます。',
      en: 'When the path difference is a whole number of wavelengths, crests meet crests and troughs meet troughs.',
    },
  },
  {
    id: 'destructive-condition',
    prompt: {
      ja: '同位相の2波源で、経路差が 2.5λ の点はどうなる？',
      en: 'With two in-phase sources, what happens where the path difference is 2.5λ?',
    },
    options: [
      { id: 'destructive', label: { ja: '弱めあう', en: 'Destructive' } },
      { id: 'constructive', label: { ja: '強めあう', en: 'Constructive' } },
      { id: 'nothing', label: { ja: '波が届かない', en: 'No wave arrives' } },
    ],
    correctOptionId: 'destructive',
    explanation: {
      ja: '2.5λ = (2 + ½)λ なので、山と谷が重なって打ち消しあいます。',
      en: '2.5λ = (2 + ½)λ, so a crest meets a trough and they cancel.',
    },
  },
  {
    id: 'antiphase',
    prompt: {
      ja: '2つの波源を逆位相（π ずらし）にすると、両方から等距離の中央線は？',
      en: 'If the sources are in opposite phase (shifted by π), what happens on the centre line?',
    },
    options: [
      { id: 'weak', label: { ja: '弱めあいの線になる', en: 'It becomes a destructive line' } },
      { id: 'strong', label: { ja: '強めあいのまま', en: 'It stays constructive' } },
      { id: 'moves', label: { ja: '波源ごと動く', en: 'The sources move' } },
    ],
    correctOptionId: 'weak',
    explanation: {
      ja: '経路差0でも、出発時点で半周期ずれているので山と谷が重なります。強めあいと弱めあいの条件が入れかわります。',
      en: 'Even with zero path difference, the waves start half a cycle apart, so the conditions swap.',
    },
  },
  {
    id: 'separation',
    prompt: {
      ja: '波源の間隔を広げると、干渉縞（弱めあいの線）の本数は？',
      en: 'If you move the sources farther apart, the number of destructive lines…',
    },
    options: [
      { id: 'more', label: { ja: '増える', en: 'Increases' } },
      { id: 'fewer', label: { ja: '減る', en: 'Decreases' } },
      { id: 'same', label: { ja: '変わらない', en: 'Stays the same' } },
    ],
    correctOptionId: 'more',
    explanation: {
      ja: '経路差の最大値は波源の間隔 d。d が大きいほど、とりうる mλ の数が増えて線が増えます。',
      en: 'The largest possible path difference is the separation d, so a larger d fits more multiples of λ.',
    },
  },
  {
    id: 'wavelength-fringes',
    prompt: {
      ja: '波源の位置はそのままで波長を短くすると、縞の間隔は？',
      en: 'Keeping the sources fixed, what happens to the fringe spacing if λ gets shorter?',
    },
    options: [
      { id: 'narrow', label: { ja: 'せまくなる', en: 'It gets narrower' } },
      { id: 'wide', label: { ja: '広くなる', en: 'It gets wider' } },
      { id: 'same', label: { ja: '変わらない', en: 'No change' } },
    ],
    correctOptionId: 'narrow',
    explanation: {
      ja: '条件 経路差 = mλ の λ が小さくなると、同じ範囲に入る線が増えて間隔がせまくなります。',
      en: 'With a smaller λ, more lines fit into the same space, so they crowd together.',
    },
  },
  {
    id: 'speed-law',
    prompt: {
      ja: '波の速さが一定のまま周波数を2倍にすると、波長は？',
      en: 'If the wave speed stays fixed and the frequency doubles, the wavelength…',
    },
    options: [
      { id: 'half', label: { ja: '半分になる', en: 'Halves' } },
      { id: 'same', label: { ja: '変わらない', en: 'Stays the same' } },
      { id: 'double', label: { ja: '2倍になる', en: 'Doubles' } },
    ],
    correctOptionId: 'half',
    explanation: {
      ja: 'v = fλ なので、v が一定なら f と λ は反比例します。',
      en: 'v = fλ, so with v fixed, f and λ are inversely proportional.',
    },
  },
  {
    id: 'drift',
    prompt: {
      ja: '2つの波源の周波数が少しだけ違うと、干渉縞はどう見える？',
      en: 'If the two frequencies differ slightly, how do the fringes look?',
    },
    options: [
      { id: 'drift', label: { ja: 'ゆっくり流れて動く', en: 'They slowly sweep across' } },
      { id: 'still', label: { ja: '止まったまま', en: 'They stay still' } },
      { id: 'gone', label: { ja: '波が消える', en: 'The waves vanish' } },
    ],
    correctOptionId: 'drift',
    explanation: {
      ja: '位相差が時間とともに変わるため、強めあう場所が移動し続けます（うなりと同じしくみ）。',
      en: 'The phase difference changes over time, so the bright spots keep moving — the same idea as beats.',
    },
  },
]

const standingQuiz: QuizItem[] = [
  {
    id: 'what-is-standing',
    prompt: {
      ja: '定常波はどのようにしてできる？',
      en: 'How is a standing wave formed?',
    },
    options: [
      {
        id: 'two-waves',
        label: {
          ja: '逆向きに進む同じ波が重なる',
          en: 'Two identical waves travelling in opposite directions overlap',
        },
      },
      { id: 'one-wave', label: { ja: '1つの波が止まる', en: 'A single wave stops moving' } },
      { id: 'damping', label: { ja: '波が減衰する', en: 'A wave dies out' } },
    ],
    correctOptionId: 'two-waves',
    explanation: {
      ja: '右向きと左向きの進行波が重なると、動かない節とよく揺れる腹ができます。「進行波」表示で確かめよう。',
      en: 'Right- and left-moving waves add up to fixed nodes and big antinodes. Turn on “Traveling waves” to see it.',
    },
  },
  {
    id: 'node-spacing',
    prompt: {
      ja: '隣りあう節と節の間隔は、波長 λ の何倍？',
      en: 'What is the distance between neighbouring nodes, in wavelengths?',
    },
    options: [
      { id: 'half', label: { ja: 'λ/2', en: 'λ/2' } },
      { id: 'one', label: { ja: 'λ', en: 'λ' } },
      { id: 'quarter', label: { ja: 'λ/4', en: 'λ/4' } },
    ],
    correctOptionId: 'half',
    explanation: {
      ja: '節と節は半波長ごと。節と隣の腹の間は λ/4 です。',
      en: 'Nodes are half a wavelength apart; a node and the next antinode are λ/4 apart.',
    },
  },
  {
    id: 'fixed-fundamental',
    prompt: {
      ja: '両端固定で長さ L の弦。基本振動の波長は？',
      en: 'A string of length L is fixed at both ends. What is the fundamental wavelength?',
    },
    options: [
      { id: '2L', label: { ja: '2L', en: '2L' } },
      { id: 'L', label: { ja: 'L', en: 'L' } },
      { id: '4L', label: { ja: '4L', en: '4L' } },
    ],
    correctOptionId: '2L',
    explanation: {
      ja: '基本振動では弦に半波長が1つだけ入るので L = λ/2、つまり λ = 2L。f₁ = v/2L です。',
      en: 'The fundamental fits half a wavelength: L = λ/2, so λ = 2L and f₁ = v/2L.',
    },
  },
  {
    id: 'fixed-free-fundamental',
    prompt: {
      ja: '片側自由（閉管と同じ）で長さ L。基本振動の波長は？',
      en: 'Fixed–free (like a closed pipe), length L. What is the fundamental wavelength?',
    },
    options: [
      { id: '4L', label: { ja: '4L', en: '4L' } },
      { id: '2L', label: { ja: '2L', en: '2L' } },
      { id: 'L', label: { ja: 'L', en: 'L' } },
    ],
    correctOptionId: '4L',
    explanation: {
      ja: '固定端が節、自由端が腹なので、弦には 1/4 波長が入ります。λ = 4L、f₁ = v/4L。',
      en: 'Node at the fixed end, antinode at the free end: a quarter wavelength fits, so λ = 4L and f₁ = v/4L.',
    },
  },
  {
    id: 'odd-only',
    prompt: {
      ja: '片側自由の弦で現れない振動はどれ？',
      en: 'Which mode can a fixed–free string NOT have?',
    },
    options: [
      { id: 'two', label: { ja: '2倍振動', en: '2nd harmonic' } },
      { id: 'three', label: { ja: '3倍振動', en: '3rd harmonic' } },
      { id: 'five', label: { ja: '5倍振動', en: '5th harmonic' } },
    ],
    correctOptionId: 'two',
    explanation: {
      ja: '片側自由では 1/4 波長の奇数倍しか入らないので、奇数倍の振動だけが現れます。',
      en: 'Only odd multiples of a quarter wavelength fit, so only odd harmonics exist.',
    },
  },
  {
    id: 'tension',
    prompt: {
      ja: '張力 T を4倍にすると、弦を伝わる波の速さは？',
      en: 'If the tension T is multiplied by 4, the wave speed on the string…',
    },
    options: [
      { id: 'double', label: { ja: '2倍', en: 'Doubles' } },
      { id: 'four', label: { ja: '4倍', en: 'Quadruples' } },
      { id: 'same', label: { ja: '変わらない', en: 'Stays the same' } },
    ],
    correctOptionId: 'double',
    explanation: {
      ja: 'v = √(T/μ) なので、T が4倍なら v は √4 = 2倍。振動数も2倍になり、音が1オクターブ高くなります。',
      en: 'v = √(T/μ), so 4× tension gives √4 = 2× speed — and an octave higher pitch.',
    },
  },
  {
    id: 'resonance',
    prompt: {
      ja: '弦を外からゆらしたとき、大きく揺れる（共鳴する）のはどんなとき？',
      en: 'When you shake a string, when does it respond strongly (resonate)?',
    },
    options: [
      {
        id: 'natural',
        label: {
          ja: 'ゆらす振動数が固有振動数に一致したとき',
          en: 'When the driving frequency matches a natural frequency',
        },
      },
      {
        id: 'fast',
        label: { ja: 'できるだけ速くゆらしたとき', en: 'When you shake as fast as possible' },
      },
      {
        id: 'slow',
        label: { ja: 'できるだけゆっくりゆらしたとき', en: 'When you shake as slowly as possible' },
      },
    ],
    correctOptionId: 'natural',
    explanation: {
      ja: '固有振動数 fₙ にぴったり合うと、毎回のひと押しがそろって振幅がどんどん大きくなります。「共鳴さがし」で体験しよう。',
      en: 'At a natural frequency each push arrives in step, so the motion builds up. Try it in Resonance hunt.',
    },
  },
]

export const quizBank: Record<SimulationMode, QuizItem[]> = {
  interference: interferenceQuiz,
  standing: standingQuiz,
}

/** Number of questions drawn per round. */
export const QUIZ_ROUND_SIZE = 5
