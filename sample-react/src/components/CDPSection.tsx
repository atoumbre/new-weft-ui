import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertTriangle, Plus, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const cdpPositions = [
  {
    id: 'CDP-001',
    collaterals: [
      { asset: 'ETH', amount: '5.0', value: '$12,500', price: '$2,485.67', change24h: '+3.24', isPositive: true, logo: '⟠' },
      { asset: 'WBTC', amount: '0.15', value: '$6,750', price: '$67,234.12', change24h: '-1.85', isPositive: false, logo: '₿' }
    ],
    loans: [
      { asset: 'USDC', borrowed: '8,500', interestRate: '5.25', price: '$1.00', change24h: '+0.02', isPositive: true, logo: '💰' },
      { asset: 'DAI', borrowed: '2,000', interestRate: '4.85', price: '$0.998', change24h: '-0.12', isPositive: false, logo: '🪙' }
    ],
    healthRatio: 2.1,
    totalCollateral: '$19,250',
    totalDebt: '$10,500',
    liquidationPrice: '$1,890',
    status: 'healthy'
  },
  {
    id: 'CDP-002',
    collaterals: [
      { asset: 'LINK', amount: '1,200', value: '$18,000', price: '$15.00', change24h: '+2.15', isPositive: true, logo: '🔗' }
    ],
    loans: [
      { asset: 'USDT', borrowed: '12,000', interestRate: '6.15', price: '$1.001', change24h: '+0.08', isPositive: true, logo: '💵' }
    ],
    healthRatio: 1.45,
    totalCollateral: '$18,000',
    totalDebt: '$12,000',
    liquidationPrice: '$12.50',
    status: 'warning'
  },
  {
    id: 'CDP-003',
    collaterals: [
      { asset: 'MATIC', amount: '15,000', value: '$13,500', price: '$0.90', change24h: '-4.25', isPositive: false, logo: '🔷' }
    ],
    loans: [
      { asset: 'DAI', borrowed: '7,200', interestRate: '4.95', price: '$0.998', change24h: '-0.12', isPositive: false, logo: '🪙' }
    ],
    healthRatio: 1.85,
    totalCollateral: '$13,500',
    totalDebt: '$7,200',
    liquidationPrice: '$0.65',
    status: 'healthy'
  }
];

// Available assets for collateral
const availableCollaterals = [
  {
    id: 'col1',
    asset: 'ETH',
    price: '$2,485.67',
    change24h: '+3.24',
    isPositive: true,
    ltv: '75%',
    totalSupplied: '$45.2M',
    logo: '⟠'
  },
  {
    id: 'col2',
    asset: 'WBTC',
    price: '$67,234.12',
    change24h: '-1.85',
    isPositive: false,
    ltv: '70%',
    totalSupplied: '$28.7M',
    logo: '₿'
  },
  {
    id: 'col3',
    asset: 'LINK',
    price: '$15.00',
    change24h: '+2.15',
    isPositive: true,
    ltv: '65%',
    totalSupplied: '$12.3M',
    logo: '🔗'
  },
  {
    id: 'col4',
    asset: 'MATIC',
    price: '$0.90',
    change24h: '-4.25',
    isPositive: false,
    ltv: '60%',
    totalSupplied: '$8.9M',
    logo: '🔷'
  }
];

// Available assets for borrowing
const availableLoanResources = [
  {
    id: 'loan1',
    asset: 'USDC',
    price: '$1.00',
    change24h: '+0.02',
    isPositive: true,
    borrowApr: '5.25%',
    availableLiquidity: '$2.5M',
    logo: '💰'
  },
  {
    id: 'loan2',
    asset: 'USDT', 
    price: '$1.001',
    change24h: '+0.08',
    isPositive: true,
    borrowApr: '6.15%',
    availableLiquidity: '$1.8M',
    logo: '💵'
  },
  {
    id: 'loan3',
    asset: 'DAI',
    price: '$0.998',
    change24h: '-0.12',
    isPositive: false,
    borrowApr: '4.85%',
    availableLiquidity: '$3.2M',
    logo: '🪙'
  },
  {
    id: 'loan4',
    asset: 'FRAX',
    price: '$1.002',
    change24h: '+0.15',
    isPositive: true,
    borrowApr: '4.95%',
    availableLiquidity: '$1.1M',
    logo: '🏛️'
  }
];

export function CDPSection() {
  const [selectedCDP, setSelectedCDP] = useState('CDP-001');

  const currentCDP = cdpPositions.find(cdp => cdp.id === selectedCDP);

  const getHealthColor = (ratio: number) => {
    if (ratio >= 2.0) return 'text-green-600';
    if (ratio >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!currentCDP) {
    return <div>CDP not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">CDP Management</h2>
          <p className="text-muted-foreground">Manage your collateralized debt positions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New CDP
        </Button>
      </div>

      {/* CDP Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Your CDPs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cdpPositions.map((cdp) => (
              <div
                key={cdp.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                  selectedCDP === cdp.id ? 'border-primary bg-accent/30' : ''
                }`}
                onClick={() => setSelectedCDP(cdp.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{cdp.id}</span>
                  {getStatusBadge(cdp.status)}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collateral:</span>
                    <span>{cdp.totalCollateral}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debt:</span>
                    <span>{cdp.totalDebt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health:</span>
                    <span className={getHealthColor(cdp.healthRatio)}>
                      {cdp.healthRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentCDP.id} Overview</span>
                {getStatusBadge(currentCDP.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Collateral</div>
                  <div className="text-xl font-semibold">{currentCDP.totalCollateral}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Debt</div>
                  <div className="text-xl font-semibold">{currentCDP.totalDebt}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Health Ratio</div>
                  <div className={`text-xl font-semibold ${getHealthColor(currentCDP.healthRatio)}`}>
                    {currentCDP.healthRatio.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Liquidation Price</div>
                  <div className="text-xl font-semibold">{currentCDP.liquidationPrice}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Health Ratio</span>
                  <span className="text-sm">
                    {currentCDP.healthRatio < 1.5 ? 'Risk of Liquidation' : 'Safe'}
                  </span>
                </div>
                <Progress 
                  value={Math.min(currentCDP.healthRatio * 25, 100)} 
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1.0 (Liquidation)</span>
                  <span>2.0+ (Safe)</span>
                </div>
              </div>

              {currentCDP.healthRatio < 1.5 && (
                <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Your CDP is at risk of liquidation. Consider adding more collateral or repaying debt.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Collaterals</span>
                  <Button size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentCDP.collaterals.map((collateral, index) => (
                  <div key={`${currentCDP.id}-collateral-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{collateral.logo}</span>
                      <div>
                        <div className="font-medium">{collateral.asset}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span>{collateral.price}</span>
                          <div className={`flex items-center ${collateral.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {collateral.isPositive ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span>{collateral.change24h}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="font-medium">{collateral.amount} {collateral.asset}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Value</div>
                        <div className="font-medium">{collateral.value}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline">
                          <Minus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Borrowed Assets</span>
                  <Button size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Borrow
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentCDP.loans.map((loan, index) => (
                  <div key={`${currentCDP.id}-loan-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{loan.logo}</span>
                      <div>
                        <div className="font-medium">{loan.asset}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span>{loan.price}</span>
                          <div className={`flex items-center ${loan.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {loan.isPositive ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span>{loan.change24h}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Borrowed</div>
                        <div className="font-medium">{loan.borrowed} {loan.asset}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">APR</div>
                        <div className="font-medium text-orange-600">{loan.interestRate}%</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Borrow
                        </Button>
                        <Button size="sm" variant="outline">
                          <Minus className="h-3 w-3 mr-1" />
                          Repay
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Available Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Collaterals */}
            <Card>
              <CardHeader>
                <CardTitle>Available Collaterals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableCollaterals.map((collateral) => (
                  <div key={collateral.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{collateral.logo}</span>
                      <div>
                        <div className="font-medium">{collateral.asset}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span>{collateral.price}</span>
                          <div className={`flex items-center ${collateral.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {collateral.isPositive ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span>{collateral.change24h}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">LTV</div>
                        <div className="font-medium">{collateral.ltv}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Supplied</div>
                        <div className="font-medium">{collateral.totalSupplied}</div>
                      </div>
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Supply
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Available Loan Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Available Loan Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableLoanResources.map((loanResource) => (
                  <div key={loanResource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{loanResource.logo}</span>
                      <div>
                        <div className="font-medium">{loanResource.asset}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span>{loanResource.price}</span>
                          <div className={`flex items-center ${loanResource.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {loanResource.isPositive ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span>{loanResource.change24h}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Borrow APR</div>
                        <div className="font-medium text-orange-600">{loanResource.borrowApr}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Available Liquidity</div>
                        <div className="font-medium">{loanResource.availableLiquidity}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Borrow
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}