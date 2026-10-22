import type { CSSProperties } from 'react'

import { missions } from '../data/missions'
import type { UiCopy } from '../data/translations'
import type { Locale, SimulationMode } from '../types'
import { Icon } from './Icon'

interface MissionPanelProps {
  copy: UiCopy
  locale: Locale
  mode: SimulationMode
  completed: string[]
  onReset: () => void
}

const getRankIndex = (done: number, total: number, rankCount: number) =>
  done >= total
    ? rankCount - 1
    : Math.min(Math.floor((done / total) * (rankCount - 1)), rankCount - 2)

export function MissionPanel({ copy, locale, mode, completed, onReset }: MissionPanelProps) {
  const modeMissions = missions.filter((mission) => mission.mode === mode)
  const doneSet = new Set(completed)
  const totalDone = missions.filter((mission) => doneSet.has(mission.id)).length
  const modeDone = modeMissions.filter((mission) => doneSet.has(mission.id)).length
  const nextMission = modeMissions.find((mission) => !doneSet.has(mission.id))
  const rank = copy.ranks[getRankIndex(totalDone, missions.length, copy.ranks.length)]
  const progress = totalDone / missions.length

  return (
    <div className="missions">
      <div className="rank-card">
        <div
          className="progress-ring"
          style={{ '--progress': `${progress * 360}deg` } as CSSProperties}
          aria-hidden="true"
        >
          <Icon name="star" size={26} />
        </div>
        <div className="rank-card__text">
          <span>{copy.missionProgress(totalDone, missions.length)}</span>
          <strong>{rank}</strong>
          <div className="rank-card__bar">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      <p className="hint-text">
        {totalDone === missions.length ? copy.allMissionsComplete : copy.missionsIntro}
      </p>

      <div className="mission-head">
        <h3>{mode === 'interference' ? copy.modeInterferenceLong : copy.modeStandingLong}</h3>
        <span className="badge">
          {modeDone} / {modeMissions.length}
        </span>
      </div>

      <ol className="mission-list">
        {modeMissions.map((mission, index) => {
          const isDone = doneSet.has(mission.id)
          const isNext = mission === nextMission

          return (
            <li
              key={mission.id}
              className={['mission', isDone ? 'is-done' : '', isNext ? 'is-next' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className="mission__status" aria-hidden="true">
                {isDone ? <Icon name="check" size={16} /> : index + 1}
              </span>
              <div className="mission__body">
                {isNext ? <span className="mission__tag">{copy.missionNext}</span> : null}
                <strong>{mission.title[locale]}</strong>
                {isDone ? (
                  <span className="mission__done">{copy.missionDone}</span>
                ) : (
                  <details open={isNext}>
                    <summary>
                      <Icon name="lightbulb" size={14} /> {copy.missionHint}
                    </summary>
                    <p>{mission.hint[locale]}</p>
                  </details>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {totalDone > 0 ? (
        <button type="button" className="text-button text-button--muted" onClick={onReset}>
          {copy.resetProgress}
        </button>
      ) : null}
    </div>
  )
}
