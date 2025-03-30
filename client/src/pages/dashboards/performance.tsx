import { useState, useEffect } from "react";
import MainLayout from "../../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { Link } from "wouter";

type PerformanceDashboardProps = {
  user: any;
  onLogout: () => void;
};

export default function PerformanceDashboard({ user, onLogout }: PerformanceDashboardProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState("Nexus_6_WH_3");
  const [selectedPeriod, setSelectedPeriod] = useState("90days");
  const [currentMetrics, setCurrentMetrics] = useState({
    queryExecutionTime: {
      current: 13.69,
      recommended: 16.97,
      change: -3.28,
      unit: "sec"
    },
    monthlyCost: {
      current: 5672.70,
      recommended: 4582.40,
      change: 1090.30,
      unit: "$"
    }
  });
  
  // Mock chart data - this would come from the API in a real app
  const chartData = {
    labels: Array.from({ length: 31 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Query Duration (ms)",
        data: Array.from({ length: 31 }, () => Math.floor(Math.random() * 100) + 50)
      }
    ]
  };

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-800">Recommendation for {selectedWarehouse}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              Export as CSV
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Apply recommendation
            </Button>
          </div>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Why we recommend this</h2>
                  <div className="flex items-start space-x-2 mb-4">
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mt-0.5">
                      Reduce cost by keeping down performance
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Based on test data running on this warehouse and assessing around 1000's query time, latency, 
                    and memory_limit, we recommend this down-sizing - you'll save money without impacting performance.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      High cost trends
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      High credit consumption
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      Low query complexity
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      Excess memory allocation
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-base font-medium mb-2 text-gray-700">Avg query execution</h3>
                    <div className="flex items-baseline">
                      <div className="text-3xl font-semibold mr-4">
                        {currentMetrics.queryExecutionTime.current} <span className="text-sm font-normal">sec</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-3xl font-semibold mr-1">
                          {currentMetrics.queryExecutionTime.recommended} <span className="text-sm font-normal">sec</span>
                        </span>
                        <span className="text-red-500 flex items-center text-sm">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {Math.abs(currentMetrics.queryExecutionTime.change).toFixed(2)} {currentMetrics.queryExecutionTime.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-2 text-gray-700">Monthly cost</h3>
                    <div className="flex items-baseline">
                      <div className="text-3xl font-semibold mr-4">
                        ${currentMetrics.monthlyCost.current.toFixed(2)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-3xl font-semibold mr-1">
                          ${currentMetrics.monthlyCost.recommended.toFixed(2)}
                        </span>
                        <span className="text-green-500 flex items-center text-sm">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          ${Math.abs(currentMetrics.monthlyCost.change).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Tabs defaultValue="settings">
                    <TabsList className="mb-6">
                      <TabsTrigger value="settings">Recommended settings</TabsTrigger>
                      <TabsTrigger value="impact">Projected impact on queries</TabsTrigger>
                      <TabsTrigger value="performance">Historical warehouse performance</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="settings">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Organization</div>
                            <div className="font-medium">Global Payments</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Environment</div>
                            <div className="font-medium">Production</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Snowflake tag</div>
                            <div className="font-medium">GMRBSTPL_APP_U</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Planned service level</div>
                            <div className="font-medium">Standard</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Warehouse environment</div>
                            <div className="font-medium">PROD</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Warehouse resizing policy</div>
                            <div className="font-medium">Standard (Auto-suspend: 10 min)</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Query materialization service</div>
                            <div className="font-medium">Enabled</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="impact">
                      <div className="space-y-6">
                        <p className="text-gray-600">
                          We analyzed over 5,000 queries to understand the impact of this recommendation.
                          The data shows that downsizing this warehouse would have minimal impact on performance
                          while providing significant cost savings.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm font-medium text-gray-500 mb-1">Queries affected</div>
                              <div className="text-2xl font-semibold">0.5%</div>
                              <div className="text-xs text-gray-500">25 of 5,000 queries</div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm font-medium text-gray-500 mb-1">Avg performance impact</div>
                              <div className="text-2xl font-semibold">+3.2%</div>
                              <div className="text-xs text-gray-500">Slight increase in execution time</div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm font-medium text-gray-500 mb-1">Monthly cost savings</div>
                              <div className="text-2xl font-semibold text-green-600">$1,090.30</div>
                              <div className="text-xs text-gray-500">19.2% reduction</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="performance">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            This recommendation is based on data gathered over the following dates for {selectedWarehouse}:
                          </div>
                          <div className="flex items-center text-sm font-medium text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            Feb 14, 2024 - Mar 14, 2024
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="text-base font-medium mb-3">Query Size Classification</h4>
                          <div className="h-80 relative">
                            <div className="absolute inset-0 flex items-end justify-start space-x-1">
                              {chartData.labels.map((label, index) => (
                                <div 
                                  key={label} 
                                  className="w-8 flex flex-col items-center"
                                >
                                  <div 
                                    className="w-6 bg-blue-500 rounded-t"
                                    style={{ 
                                      height: `${chartData.datasets[0].data[index] / 2}px`,
                                      opacity: index % 3 === 0 ? 0.9 : index % 3 === 1 ? 0.7 : 0.5
                                    }}
                                  ></div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <div>March 1</div>
                            <div>March 15</div>
                            <div>March 31</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}