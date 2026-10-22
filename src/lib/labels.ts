import type { UiCopy } from '../data/translations'
import type { BoundaryCondition, InterferenceClass } from '../types'

export const getClassLabel = (classification: InterferenceClass, copy: UiCopy) => {
  switch (classification) {
    case 'constructive':
      return copy.constructive
    case 'destructive':
      return copy.destructive
    case 'mixed':
      return copy.mixed
    default:
      return copy.unavailable
  }
}

export const getBoundaryLabel = (boundary: BoundaryCondition, copy: UiCopy) => {
  switch (boundary) {
    case 'fixed-free':
      return copy.fixedFree
    case 'free-free':
      return copy.freeFree
    case 'fixed-fixed':
    default:
      return copy.fixedFixed
  }
}
