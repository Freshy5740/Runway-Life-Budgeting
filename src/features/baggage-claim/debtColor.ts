import { DEBT_TYPE_ORDER, type DebtType } from '../../engines/loans'

/** Chart color for a loan type (fixed order, so a type always keeps its color). */
export const debtColor = (type: DebtType) => `var(--cat-${DEBT_TYPE_ORDER.indexOf(type) + 1})`
