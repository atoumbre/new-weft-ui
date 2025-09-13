import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { LendingSection } from './components/LendingSection';
import { CDPSection } from './components/CDPSection';
import { Wallet, TrendingUp, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('lending');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-semibold">CryptoLend</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                Beta
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 border rounded-lg bg-card">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">0x1234...5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Supplied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">$24,567.89</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Borrowed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">$8,234.56</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.2%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">$16,333.33</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.7%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">$50,750.00</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Health Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">2.34</div>
              <div className="text-sm text-muted-foreground mt-1">Safe</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="lending" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Lending</span>
            </TabsTrigger>
            <TabsTrigger value="cdp" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>CDP Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lending" className="space-y-6">
            <LendingSection />
          </TabsContent>

          <TabsContent value="cdp" className="space-y-6">
            <CDPSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}