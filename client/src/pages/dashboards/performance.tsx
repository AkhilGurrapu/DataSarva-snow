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
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { Link } from "wouter";
import { snowflakeClient } from "../../lib/snowflake";
import { useConnection } from "../../hooks/use-connection";

type PerformanceDashboardProps = {
  user: any;
  onLogout: () => void;
};

interface WarehousePerformanceData {
  warehouseName: string;
  warehouseSize: string;
  metrics: {
    totalQueries: number;
    avgExecutionTime: number;
    totalCredits: number;
    currentCost: number;
    recommendedCost: number;
    savings: number;
    savingsPercentage: number;
    recommendation: string;
  };
  chartData: {
    date: string;
    queryCount: number;
    avgExecutionTime: string;
    totalExecutionTime: string;
    avgGbScanned: string;
    creditsUsed: string;
    cost: string;
  }[];
}

export default function PerformanceDashboard({ user, onLogout }: PerformanceDashboardProps) {
  const { activeConnection } = useConnection();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<WarehousePerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState({
    queryExecutionTime: {
      current: 0,
      recommended: 0, 
      change: 0,
      unit: "sec"
    },
    monthlyCost: {
      current: 0,
      recommended: 0,
      change: 0,
      unit: "$"
    }
  });
  
  // Fetch warehouses when component mounts
  useEffect(() => {
    async function fetchWarehouses() {
      if (!activeConnection) return;
      
      try {
        setLoading(true);
        const data = await snowflakeClient.getWarehouses();
        if (data && data.length > 0) {
          setWarehouses(data);
          setSelectedWarehouse(data[0].name || data[0]["name"]);
        }
      } catch (err) {
        console.error("Failed to fetch warehouses:", err);
        setError("Failed to load warehouses. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchWarehouses();
  }, [activeConnection]);
  
  // Fetch performance data when selectedWarehouse or period changes
  useEffect(() => {
    async function fetchPerformanceData() {
      if (!selectedWarehouse) return;
      
      try {
        setLoading(true);
        const data = await snowflakeClient.getWarehousePerformance(selectedWarehouse, selectedPeriod);
        setPerformanceData(data);
        
        // Set metrics based on real data
        if (data && data.metrics) {
          const { avgExecutionTime, currentCost, recommendedCost, recommendation } = data.metrics;
          const costChange = currentCost - recommendedCost;
          const perfImpact = recommendation?.includes("Downsize") ? avgExecutionTime * 0.15 : 0; // Estimate 15% increase if downsizing
          
          setCurrentMetrics({
            queryExecutionTime: {
              current: parseFloat(avgExecutionTime.toFixed(2)),
              recommended: parseFloat((avgExecutionTime + perfImpact).toFixed(2)),
              change: -perfImpact,
              unit: "sec"
            },
            monthlyCost: {
              current: currentCost,
              recommended: recommendedCost,
              change: costChange,
              unit: "$"
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch warehouse performance data:", err);
        setError("Failed to load performance data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    
    if (selectedWarehouse) {
      fetchPerformanceData();
    }
  }, [selectedWarehouse, selectedPeriod]);
  
  // Chart data from API
  const chartData = {
    labels: performanceData?.chartData?.map(item => item.date.split('-')[2]) || [],
    datasets: [
      {
        label: "Average Query Execution Time (s)",
        data: performanceData?.chartData?.map(item => parseFloat(item.avgExecutionTime)) || []
      }
    ]
  };

  // Render the dashboard
  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading warehouse data...</span>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600">{error}</div>
              <div className="text-sm mt-2">
                Please check your Snowflake connection and make sure you have the appropriate permissions.
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Header with filters */}
        {!loading && !error && (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-medium text-gray-800">
                {selectedWarehouse 
                  ? `Recommendation for ${selectedWarehouse}` 
                  : "Select a warehouse to see recommendations"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedWarehouse || ""}
                  onValueChange={(value) => setSelectedWarehouse(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem 
                        key={warehouse.name || warehouse["name"]} 
                        value={warehouse.name || warehouse["name"]}
                      >
                        {warehouse.name || warehouse["name"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedPeriod}
                  onValueChange={(value) => setSelectedPeriod(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">30 days</SelectItem>
                    <SelectItem value="60days">60 days</SelectItem>
                    <SelectItem value="90days">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">
                  Export as CSV
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!performanceData || !performanceData.metrics?.recommendation}
                >
                  Apply recommendation
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        {selectedWarehouse && !loading && !error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-8">
                {/* Recommendation section */}
                {performanceData && performanceData.metrics?.recommendation ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Why we recommend this</h2>
                    <div className="flex items-start space-x-2 mb-4">
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mt-0.5">
                        {performanceData.metrics.recommendation}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Based on data analysis from {performanceData.metrics.totalQueries || 0} queries 
                      on warehouse {performanceData.warehouseName}, we can save approximately 
                      ${performanceData.metrics.savings?.toFixed(2) || 0} ({performanceData.metrics.savingsPercentage?.toFixed(1) || 0}%)
                      by making the recommended changes.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        {performanceData.metrics.currentCost > performanceData.metrics.recommendedCost 
                          ? "High cost trends" 
                          : "Low cost efficiency"}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        {performanceData.metrics.totalCredits > 100 
                          ? "High credit consumption" 
                          : "Low credit utilization"}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        {performanceData.metrics.avgExecutionTime < 10 
                          ? "Low query complexity" 
                          : "Complex queries"}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        {performanceData.metrics.recommendation.includes("Downsize") 
                          ? "Excess memory allocation" 
                          : "Resource constraints"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No recommendation data available for this warehouse.
                  </div>
                )}
                
                {/* Metrics comparison */}
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
                
                {/* Tabs for more details */}
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
                                  key={label || index} 
                                  className="w-8 flex flex-col items-center"
                                >
                                  <div 
                                    className="w-6 bg-blue-500 rounded-t"
                                    style={{ 
                                      height: `${(chartData.datasets[0].data[index] || 0) / 2}px`,
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
        )}
      </div>
    </MainLayout>
  );
}