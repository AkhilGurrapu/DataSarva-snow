import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { BarChart, Database, DollarSign, LineChart, PieChart, TrendingDown } from "lucide-react";
import { Link } from "wouter";

type HomeProps = {
  user: any;
  onLogout: () => void;
};

type Recommendation = {
  id: number;
  warehouseName: string;
  currentCost: number;
  recommendedCost: number;
  savings: number;
  savingsPercentage: number;
  recommendation?: string;
};

type DashboardStats = {
  queriesOptimized: number;
  costSavings: number;
  etlPipelines: {
    total: number;
    active: number;
    paused: number;
  };
  errorsDetected: number;
};

export default function Home({ user, onLogout }: HomeProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get dashboard stats from the Snowflake API
        const statsResponse = await apiRequest<DashboardStats>("GET", "/api/dashboard/stats");
        if (statsResponse) {
          setStats(statsResponse);
        }
        
        // Get recommendations from the Snowflake API
        const recResponse = await apiRequest<Recommendation[]>("GET", "/api/recommendations");
        if (recResponse && Array.isArray(recResponse)) {
          setRecommendations(recResponse);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="flex flex-row items-center p-6">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost Savings</p>
                    <h3 className="text-2xl font-bold">
                      ${stats?.costSavings ? stats.costSavings.toFixed(2) : '0.00'}
                    </h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex flex-row items-center p-6">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <LineChart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Queries Optimized</p>
                    <h3 className="text-2xl font-bold">{stats?.queriesOptimized || 0}</h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex flex-row items-center p-6">
                  <div className="rounded-full bg-amber-100 p-3 mr-4">
                    <PieChart className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active ETL Pipelines</p>
                    <h3 className="text-2xl font-bold">{stats?.etlPipelines?.active || 0}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Warehouse Recommendations</CardTitle>
                    <CardDescription>
                      Top recommendations for cost optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recommendations.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 text-xs text-gray-500 font-medium">
                          <div className="col-span-3">Warehouse</div>
                          <div className="col-span-2 text-right">Current Cost</div>
                          <div className="col-span-2 text-right">Recommended</div>
                          <div className="col-span-2 text-right">Savings</div>
                          <div className="col-span-3">Action</div>
                        </div>
                        {recommendations.slice(0, 5).map((rec) => (
                          <div key={rec.id} className="grid grid-cols-12 py-2 border-t border-gray-100">
                            <div className="col-span-3 font-medium text-blue-600">{rec.warehouseName}</div>
                            <div className="col-span-2 text-right">${rec.currentCost.toFixed(2)}</div>
                            <div className="col-span-2 text-right">${rec.recommendedCost.toFixed(2)}</div>
                            <div className="col-span-2 text-right text-green-600 font-medium">
                              ${rec.savings.toFixed(2)} ({rec.savingsPercentage.toFixed(1)}%)
                            </div>
                            <div className="col-span-3 text-sm text-gray-600">
                              {rec.recommendation || "Optimize resource allocation"}
                            </div>
                          </div>
                        ))}
                        {recommendations.length > 5 && (
                          <div className="border-t border-gray-100 pt-3 text-right">
                            <Link href="/recommendations" className="text-blue-600 hover:underline text-sm">
                              View all {recommendations.length} recommendations
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <TrendingDown className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">No recommendations available</p>
                        <p className="text-sm text-gray-400">
                          This may be due to insufficient query history or already optimized warehouses.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                    <CardDescription>
                      Tools and resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/query-advisor">
                        <Button variant="outline" className="w-full justify-start">
                          <Database className="mr-2 h-4 w-4" />
                          Query Advisor
                        </Button>
                      </Link>
                      <Link href="/dashboards/cost">
                        <Button variant="outline" className="w-full justify-start">
                          <BarChart className="mr-2 h-4 w-4" />
                          Cost Analysis
                        </Button>
                      </Link>
                      <Link href="/warehouses">
                        <Button variant="outline" className="w-full justify-start">
                          <PieChart className="mr-2 h-4 w-4" />
                          Warehouse Manager
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}