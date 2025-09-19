import Decimal from 'decimal.js'
import { format } from 'numerable'

export const dec = (input: string | number | Decimal): Decimal => new Decimal(input)

// const defaultOptions = { fullPrecision: true, currency: 'USD' }

const MIN_SIG_DIGITS = 2
const SMALL_THRESHOLD = dec(0.001)

export interface ValueFormatOptions {
  fullPrecision?: boolean
  currency?: string
}

function fValueInternal(n: Decimal, input: ValueFormatOptions = {}): string {
  const fullPrecision = input.fullPrecision ?? false
  const currency = input.currency ?? 'USD'

  if (n.isZero())
    return format('0', '$0,0.XX', { currency })

  if (!fullPrecision && n.abs().lt(SMALL_THRESHOLD)) {
    const prefix = n.isNegative() ? '-' : ''
    return `${prefix}~${format('0', '$0,0.00', { currency })}`
  }

  const abs = n.abs()
  const integerDigits = Decimal.log10(abs).floor().plus(1)

  if (integerDigits.greaterThanOrEqualTo(MIN_SIG_DIGITS))
    return format(n.toFixed(MIN_SIG_DIGITS), '$0,0.##', { currency })

  const digitsToShow = Math.max(0, MIN_SIG_DIGITS - integerDigits.toNumber())
  const pattern = digitsToShow > 0 ? `$0,0.${'X'.repeat(digitsToShow)}` : '$0,0'
  return format(n.toFixed(digitsToShow), pattern, { currency })
}

export function fValue(amount: Decimal, options: ValueFormatOptions = {}) {
  return fValueInternal(amount, options)
}

export function fAmount(amount: Decimal, options: ValueFormatOptions = {}) {
  return fValue(amount, { ...options, currency: '' })
}

export function fPercent(input: Decimal | undefined) {
  const amount = input ?? dec(0)

  // numerable accepts string input; avoid Decimal -> number conversion
  let result = format(amount.toFixed(10), '0,0.00%')
  const defaultFormat = format('0', '0,0.00%')

  if (result === defaultFormat && amount.abs().gt(0)) {
    result = `~${result}`
  }

  return result
}
