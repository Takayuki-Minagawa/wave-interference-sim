import { useState } from 'react'

import { QUIZ_ROUND_SIZE, quizBank } from '../data/quiz'
import type { UiCopy } from '../data/translations'
import type { Locale, QuizItem, SimulationMode } from '../types'
import { Icon } from './Icon'

interface QuizPanelProps {
  copy: UiCopy
  locale: Locale
  mode: SimulationMode
  bestScore: number | null
  onFinish: (score: number, total: number) => void
}

type QuizState =
  | { phase: 'intro' }
  | {
      phase: 'question'
      items: QuizItem[]
      index: number
      score: number
      answer: string | null
    }
  | { phase: 'result'; score: number; total: number; items: QuizItem[] }

const shuffle = <T,>(items: readonly T[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

const buildRound = (mode: SimulationMode) =>
  shuffle(quizBank[mode])
    .slice(0, QUIZ_ROUND_SIZE)
    .map((item) => ({ ...item, options: shuffle(item.options) }))

export function QuizPanel({ copy, locale, mode, bestScore, onFinish }: QuizPanelProps) {
  const [state, setState] = useState<QuizState>({ phase: 'intro' })
  const total = Math.min(QUIZ_ROUND_SIZE, quizBank[mode].length)

  const start = () =>
    setState({ phase: 'question', items: buildRound(mode), index: 0, score: 0, answer: null })

  if (state.phase === 'intro') {
    return (
      <div className="quiz quiz--intro">
        <div className="quiz__hero" aria-hidden="true">
          <Icon name="quiz" size={40} />
        </div>
        <h3>{copy.quizTitle}</h3>
        <p>{copy.quizIntro(total)}</p>
        {bestScore !== null ? <p className="badge">{copy.quizBest(bestScore, total)}</p> : null}
        <button type="button" className="primary-button" onClick={start}>
          {copy.quizStart}
        </button>
      </div>
    )
  }

  if (state.phase === 'result') {
    const ratio = state.score / state.total
    const stars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0

    return (
      <div className="quiz quiz--result">
        <div className="quiz__stars" aria-label={`${stars} / 3`}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={index < stars ? 'is-on' : undefined}>
              <Icon name="star" size={40} />
            </span>
          ))}
        </div>
        <h3>{copy.quizScore(state.score, state.total)}</h3>
        <p>{ratio === 1 ? copy.quizPerfect : ratio >= 0.6 ? copy.quizGood : copy.quizKeepGoing}</p>
        {bestScore !== null ? (
          <p className="badge">{copy.quizBest(bestScore, state.total)}</p>
        ) : null}
        <button type="button" className="primary-button" onClick={start}>
          <Icon name="restart" size={18} /> {copy.quizRetry}
        </button>
      </div>
    )
  }

  const item = state.items[state.index]
  const answered = state.answer !== null
  const isCorrect = state.answer === item.correctOptionId
  const isLast = state.index === state.items.length - 1

  const choose = (optionId: string) => {
    if (answered) {
      return
    }
    setState({
      ...state,
      answer: optionId,
      score: state.score + (optionId === item.correctOptionId ? 1 : 0),
    })
  }

  const next = () => {
    if (isLast) {
      onFinish(state.score, state.items.length)
      setState({
        phase: 'result',
        score: state.score,
        total: state.items.length,
        items: state.items,
      })
      return
    }
    setState({ ...state, index: state.index + 1, answer: null })
  }

  return (
    <div className="quiz">
      <div className="quiz__progress" aria-hidden="true">
        {state.items.map((quizItem, index) => (
          <span
            key={quizItem.id}
            className={
              index < state.index ? 'is-done' : index === state.index ? 'is-current' : undefined
            }
          />
        ))}
      </div>
      <p className="quiz__count">{copy.quizQuestion(state.index + 1, state.items.length)}</p>
      <h3 className="quiz__prompt">{item.prompt[locale]}</h3>

      <div className="quiz__options">
        {item.options.map((option, index) => {
          const isAnswer = option.id === item.correctOptionId
          const isChosen = option.id === state.answer
          const className = [
            'quiz-option',
            answered && isAnswer ? 'is-correct' : '',
            answered && isChosen && !isAnswer ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={option.id}
              type="button"
              className={className}
              onClick={() => choose(option.id)}
              disabled={answered && !isAnswer && !isChosen}
              aria-pressed={isChosen}
            >
              <span className="quiz-option__key">{String.fromCharCode(65 + index)}</span>
              <span>{option.label[locale]}</span>
              {answered && isAnswer ? <Icon name="check" size={18} /> : null}
              {answered && isChosen && !isAnswer ? <Icon name="close" size={18} /> : null}
            </button>
          )
        })}
      </div>

      {answered ? (
        <div
          className={isCorrect ? 'quiz__feedback is-correct' : 'quiz__feedback is-wrong'}
          role="status"
        >
          <strong>{isCorrect ? copy.quizCorrect : copy.quizIncorrect}</strong>
          <p>{item.explanation[locale]}</p>
          <button type="button" className="primary-button" onClick={next}>
            {isLast ? copy.quizFinish : copy.quizNext}
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
