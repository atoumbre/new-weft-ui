import { dec } from '$lib/utils'
import Decimal from 'decimal.js'

type Decimalish = Decimal | number | null | undefined

export type CdpHealthLevelId = 'healthy' | 'monitor' | 'critical' | 'liquidation'

export interface CdpHealthDefinition {
  id: CdpHealthLevelId
  label: string
  shortLabel: string
  textClass: string
  badgeClass: string
  minInclusive?: Decimal
  maxExclusive?: Decimal
}

export const CDP_HEALTH_DEFINITIONS: CdpHealthDefinition[] = [
  {
    id: 'liquidation',
    label: 'Liquidation (>100% LTV)',
    shortLabel: 'Liq. Risk',
    textClass: 'text-[#dc2626]',
    badgeClass: 'bg-[#fecaca] text-[#7f1d1d] border-transparent',
    minInclusive: dec(1),
  },
  {
    id: 'critical',
    label: 'Critical (90% - 100% LTV)',
    shortLabel: 'Critical',
    textClass: 'text-[#f97316]',
    badgeClass: 'bg-[#fed7aa] text-[#9a3412] border-transparent',
    minInclusive: dec(0.9),
    maxExclusive: dec(1),
  },
  {
    id: 'monitor',
    label: 'Monitor (70% - 90% LTV)',
    shortLabel: 'Moderate',
    textClass: 'text-[#f59e0b]',
    badgeClass: 'bg-[#fde68a] text-[#92400e] border-transparent',
    minInclusive: dec(0.7),
    maxExclusive: dec(0.9),
  },
  {
    id: 'healthy',
    label: 'Healthy (<70% LTV)',
    shortLabel: 'Safe',
    textClass: 'text-[#16a34a]',
    badgeClass: 'bg-[#bbf7d0] text-[#166534] border-transparent',
    maxExclusive: dec(0.7),
  },

]

function toDecimal(value: Decimalish): Decimal {
  if (value === null || value === undefined)
    return dec(0)
  return value instanceof Decimal ? value : dec(value)
}

export function resolveCdpHealthDefinition(ltv: Decimalish): CdpHealthDefinition {
  const value = toDecimal(ltv)

  const match = CDP_HEALTH_DEFINITIONS.find(({ minInclusive, maxExclusive }) => {
    const meetsMin = minInclusive ? value.greaterThanOrEqualTo(minInclusive) : true
    const belowMax = maxExclusive ? value.lessThan(maxExclusive) : true
    return meetsMin && belowMax
  })

  return match ?? CDP_HEALTH_DEFINITIONS[CDP_HEALTH_DEFINITIONS.length - 1]
}

export const getCdpHealthTextClass = (ltv: Decimalish): string => resolveCdpHealthDefinition(ltv).textClass

export const getCdpHealthBadgeClass = (ltv: Decimalish): string => resolveCdpHealthDefinition(ltv).badgeClass

export const getCdpHealthShortLabel = (ltv: Decimalish): string => resolveCdpHealthDefinition(ltv).shortLabel

export const getCdpHealthLabel = (ltv: Decimalish): string => resolveCdpHealthDefinition(ltv).label
