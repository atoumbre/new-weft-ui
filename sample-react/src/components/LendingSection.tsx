import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';

import { TrendingUp, TrendingDown, Plus, Minus, Eye } from 'lucide-react';

const lendingPositions = [
  {
    id: 'pos1',
    asset: 'USDC',
    supplied: '12,500.00',
    apr: '4.25',
    earned: '125.50',
    price: '$1.00',
    change24h: '+0.02',
    isPositive: true,
    logo: '💰'
  },
  {
    id: 'pos2',
    asset: 'ETH',
    supplied: '2.5',
    apr: '3.85',
    earned: '0.045',
    price: '$2,485.67',
    change24h: '+3.24',
    isPositive: true,
    logo: '⟠'
  },
  {
    id: 'pos3',
    asset: 'WBTC',
    supplied: '0.25',
    apr: '2.95',
    earned: '0.012',
    price: '$67,234.12',
    change24h: '-1.85',
    isPositive: false,
    logo: '₿'
  }
];

const availablePools = [
  {
    id: 'pool1',
    asset: 'USDT',
    utilization: 75,
    supplyApr: '4.12',
    borrowApr: '6.85',
    totalSupply: '2.5M',
    totalBorrow: '1.8M',
    logo: '💵'
  },
  {
    id: 'pool2',
    asset: 'DAI',
    utilization: 68,
    supplyApr: '3.95',
    borrowApr: '6.22',
    totalSupply: '1.8M',
    totalBorrow: '1.2M',
    logo: '🪙'
  },
  {
    id: 'pool3',
    asset: 'LINK',
    utilization: 82,
    supplyApr: '5.25',
    borrowApr: '8.15',
    totalSupply: '850K',
    totalBorrow: '697K',
    logo: '🔗'
  },
  {
    id: 'pool4',
    asset: 'MATIC',
    utilization: 45,
    supplyApr: '6.75',
    borrowApr: '9.25',
    totalSupply: '3.2M',
    totalBorrow: '1.4M',
    logo: '🔷'
  }
];

export function LendingSection() {
  return (
    <div className="space-y-6">
      {/* Your Lending Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Lending Positions</span>
            <Badge variant="outline">{lendingPositions.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lendingPositions.map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{position.logo}</div>
                  <div>
                    <div className="font-medium">{position.asset}</div>
                    <div className="text-sm text-muted-foreground flex items-center space-x-2">
                      <span>{position.price}</span>
                      <div className={`flex items-center ${position.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {position.isPositive ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        <span>{position.change24h}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Supplied</div>
                    <div className="font-medium">{position.supplied} {position.asset}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">APR</div>
                    <div className="font-medium text-green-600">{position.apr}%</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Earned</div>
                    <div className="font-medium">{position.earned} {position.asset}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Supply
                    </Button>
                    <Button size="sm" variant="outline">
                      <Minus className="h-3 w-3 mr-1" />
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Lending Pools */}
      <Card>
        <CardHeader>
          <CardTitle>Available Lending Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Supply APR</TableHead>
                <TableHead>Borrow APR</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Total Supply</TableHead>
                <TableHead>Total Borrow</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availablePools.map((pool) => (
                <TableRow key={pool.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{pool.logo}</span>
                      <span className="font-medium">{pool.asset}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">{pool.supplyApr}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-orange-600">{pool.borrowApr}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{pool.utilization}%</span>
                      </div>
                      <Progress 
                        value={pool.utilization} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{pool.totalSupply}</TableCell>
                  <TableCell className="text-sm">{pool.totalBorrow}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" className="text-xs">
                        Supply
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Pools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availablePools
                .sort((a, b) => parseFloat(b.supplyApr) - parseFloat(a.supplyApr))
                .slice(0, 3)
                .map((pool) => (
                  <div key={`top-${pool.id}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{pool.logo}</span>
                      <span className="font-medium">{pool.asset}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-green-600">{pool.supplyApr}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Value Locked</span>
                <span className="font-medium">$8.35M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Supply APR</span>
                <span className="font-medium text-green-600">4.77%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Utilization</span>
                <span className="font-medium">67.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Pools</span>
                <span className="font-medium">{availablePools.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}