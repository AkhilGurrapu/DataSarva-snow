import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Zap, Clock } from "lucide-react";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

type PerformanceProps = {
  user: any;
  onLogout: () => void;
};

export default function Performance({ user, onLogout }: PerformanceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days">("30days");
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get performance data
        const data = await snowflakeClient.getPerformanceData(timeRange);
        setPerformanceData(data);
        
        // Get query history
        const history = await snowflakeClient.getQueryHistory(50);
        setQueryHistory(history);
        
        // Get active connection
        const connections = await snowflakeClient.getConnections();
        const active = connections.find((c: any) => c.isActive);
        if (active) {
          setActiveConnection(active.name);
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
        toast({
          title: "Error",
          description: "Failed to load performance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange, toast]);

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (queryHistory.length === 0) return { totalQueries: 0, optimizationRate: 0, avgImprovement: 0 };
    
    const optimizedQueries = queryHistory.filter(q => q.optimizedQuery && q.executionTimeOptimized !== null);
    
    const totalImprovement = optimizedQueries.reduce((total, query) => {
      if (query.executionTimeOriginal && query.executionTimeOptimized) {
        return total + (query.executionTimeOriginal - query.executionTimeOptimized);
      }
      return total;
    }, 0);
    
    const avgImprovementPercent = optimizedQueries.length > 0
      ? optimizedQueries.reduce((total, query) => {
          if (query.executionTimeOriginal && query.executionTimeOptimized) {
            return total + ((query.executionTimeOriginal - query.executionTimeOptimized) / query.executionTimeOriginal * 100);
          }
          return total;
        }, 0) / optimizedQueries.length
      : 0;
    
    return {
      totalQueries: queryHistory.length,
      optimizedQueries: optimizedQueries.length,
      optimizationRate: Math.round((optimizedQueries.length / queryHistory.length) * 100),
      totalTimeSaved: totalImprovement,
      avgImprovement: Math.round(avgImprovementPercent)
    };
  };
  
  const metrics = calculateMetrics();

  // Data for optimization distribution chart
  const getOptimizationDistribution = () => {
    const optimizedQueries = queryHistory.filter(q => q.optimizedQuery && q.executionTimeOptimized !== null);
    
    const categories = [
      { name: "0-25%", count: 0 },
      { name: "26-50%", count: 0 },
      { name: "51-75%", count: 0 },
      { name: "76-100%", count: 0 }
    ];
    
    optimizedQueries.forEach(query => {
      if (query.executionTimeOriginal && query.executionTimeOptimized) {
        const improvement = (query.executionTimeOriginal - query.executionTimeOptimized) / query.executionTimeOriginal * 100;
        
        if (improvement <= 25) {
          categories[0].count++;
        } else if (improvement <= 50) {
          categories[1].count++;
        } else if (improvement <= 75) {
          categories[2].count++;
        } else {
          categories[3].count++;
        }
      }
    });
    
    return categories;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - only directly visible on desktop */}
      <div className={`${isMobile ? 'block lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300' : 'hidden'} ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}>
        <div onClick={e => e.stopPropagation()}>
          <Sidebar 
            activeConnection={activeConnection} 
            onMobileSidebarClose={() => setSidebarOpen(false)} 
            isMobile={true} 
          />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeConnection={activeConnection} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar 
          title="Performance Analytics" 
          user={user} 
          onLogout={onLogout} 
          onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Query Performance Analysis</h2>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-neutral-700 mr-2">
                    Time Range:
                  </label>
                  <Select
                    value={timeRange}
                    onValueChange={(value: any) => setTimeRange(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Performance metrics cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-primary bg-opacity-10">
                            <Zap className="h-6 w-6 text-primary" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-neutral-500">Total Queries</p>
                            <h3 className="text-xl font-semibold text-neutral-900">{metrics.totalQueries}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-success bg-opacity-10">
                            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-neutral-500">Optimization Rate</p>
                            <h3 className="text-xl font-semibold text-neutral-900">{metrics.optimizationRate}%</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-secondary bg-opacity-10">
                            <Clock className="h-6 w-6 text-secondary" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-neutral-500">Total Time Saved</p>
                            <h3 className="text-xl font-semibold text-neutral-900">
                              {Math.floor(metrics.totalTimeSaved / 1000)} seconds
                            </h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-warning bg-opacity-10">
                            <AlertTriangle className="h-6 w-6 text-warning" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-neutral-500">Avg. Improvement</p>
                            <h3 className="text-xl font-semibold text-neutral-900">{metrics.avgImprovement}%</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Tabs defaultValue="performance" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="performance">Performance Trends</TabsTrigger>
                      <TabsTrigger value="optimization">Optimization Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="performance">
                      <Card>
                        <CardHeader>
                          <CardTitle>Query Execution Time Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {performanceData.length === 0 ? (
                            <div className="text-center py-16 text-neutral-500">
                              No performance data available for the selected time period.
                            </div>
                          ) : (
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={performanceData}
                                  margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 25,
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="date" 
                                    label={{ value: 'Date', position: 'insideBottomRight', offset: -5 }}
                                  />
                                  <YAxis 
                                    label={{ value: 'Execution Time (ms)', angle: -90, position: 'insideLeft' }} 
                                  />
                                  <Tooltip />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="originalTime"
                                    name="Original Execution Time"
                                    stroke="#F56565"
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="optimizedTime"
                                    name="Optimized Execution Time"
                                    stroke="#38B2AC"
                                    strokeWidth={2}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="optimization">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Optimization Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {queryHistory.length === 0 ? (
                              <div className="text-center py-16 text-neutral-500">
                                No query history available for analysis.
                              </div>
                            ) : (
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={getOptimizationDistribution()}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="count"
                                    >
                                      {getOptimizationDistribution().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} queries`, 'Count']} />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Top Optimized Queries</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {queryHistory.length === 0 ? (
                              <div className="text-center py-16 text-neutral-500">
                                No query history available for analysis.
                              </div>
                            ) : (
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={queryHistory
                                      .filter(q => q.executionTimeOriginal && q.executionTimeOptimized)
                                      .sort((a, b) => {
                                        const aImprovement = (a.executionTimeOriginal - a.executionTimeOptimized) / a.executionTimeOriginal;
                                        const bImprovement = (b.executionTimeOriginal - b.executionTimeOptimized) / b.executionTimeOriginal;
                                        return bImprovement - aImprovement;
                                      })
                                      .slice(0, 5)
                                      .map((q, i) => ({
                                        id: q.id,
                                        name: `Query ${i + 1}`,
                                        improvement: Math.round((q.executionTimeOriginal - q.executionTimeOptimized) / q.executionTimeOriginal * 100)
                                      }))}
                                    layout="vertical"
                                    margin={{
                                      top: 5,
                                      right: 30,
                                      left: 20,
                                      bottom: 5,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" label={{ value: 'Improvement (%)', position: 'insideBottom', offset: -5 }} />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip />
                                    <Bar dataKey="improvement" fill="#38B2AC" label={{ position: 'right', formatter: (val) => `${val}%` }} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
