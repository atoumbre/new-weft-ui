import Decimal from 'decimal.js'
import { format } from 'numerable'

export const dec = (input: string | number | Decimal): Decimal => new Decimal(input)

export const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function fValue(n: Decimal, { price, fullPrecision }: { price?: boolean, fullPrecision?: boolean } = { price: true, fullPrecision: false }): string {
  const defaultFormat = `${price ? '$' : ''}0,0.XX`

  const minSignificantDigits = 2

  if (n.isZero()) {
    return format('0', defaultFormat, { currency: 'USD' })
  }

  // Check if value is very small (less than $0.001) and not in full precision mode
  if (!fullPrecision && n.abs().lt(0.001)) {
    return `~${price ? '$' : ''}0.00`
  }

  const abs = n.abs()
  // integerDigits = floor(log10(abs)) + 1, kept as Decimal to avoid number conversion
  const integerDigits = Decimal.log10(abs).floor().plus(1)

  if (integerDigits.greaterThanOrEqualTo(minSignificantDigits)) {
    // Use up to two decimals, but provide value as string
    return format(n.toFixed(minSignificantDigits), defaultFormat, { currency: 'USD' })
  }
  else {
    const digitsToShow = new Decimal(minSignificantDigits).minus(integerDigits).toNumber()
    // digitsToShow is small (0..minSig), safe to use as a JS number for pattern construction
    return format(
      n.toFixed(digitsToShow),
      `${price ? '$' : ''}0,0.${new Array(digitsToShow).fill('X').join('')}`,
      { currency: 'USD' },
    )
  }
}

export const fAmount = (amount: Decimal) => fValue(amount, { price: false })

export function fPercent(amount: Decimal) {
  // numerable accepts string input; avoid Decimal -> number conversion
  let result = format(amount.toFixed(10), '0,0.00%')
  const defaultFormat = format('0', '0,0.00%')

  if (result === defaultFormat && amount.abs().gt(0)) {
    result = `~${result}`
  }

  return result
}
