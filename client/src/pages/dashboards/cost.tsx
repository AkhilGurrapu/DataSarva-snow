import { useState, useEffect } from "react";
import MainLayout from "../../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { apiRequest } from "../../lib/queryClient";
import { Link } from "wouter";

type CostDashboardProps = {
  user: any;
  onLogout: () => void;
};

type CostBreakdown = {
  category: string;
  amount: number;
  percentage: number;
  color: string;
};

export default function CostDashboard({ user, onLogout }: CostDashboardProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [dateRange, setDateRange] = useState({ start: "Feb 14, 2024", end: "Mar 14, 2024" });
  const [costData, setCostData] = useState<CostBreakdown[]>([]);
  const [totalCost, setTotalCost] = useState(28500);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // This would be a real API call in production
        // For now we'll create mock data that matches the mockups
        const mockCostData: CostBreakdown[] = [
          { category: "Finance", amount: 7410, percentage: 26, color: "#2563eb" },
          { category: "Engineering", amount: 6840, percentage: 24, color: "#0f766e" },
          { category: "Business Development", amount: 4560, percentage: 16, color: "#4f46e5" },
          { category: "Customer Support", amount: 3990, percentage: 14, color: "#f59e0b" },
          { category: "Marketing", amount: 2280, percentage: 8, color: "#d97706" },
          { category: "Human Resources", amount: 1995, percentage: 7, color: "#65a30d" },
          { category: "Retail Products", amount: 1425, percentage: 5, color: "#7c3aed" }
        ];
        
        setCostData(mockCostData);
      } catch (error) {
        console.error("Failed to fetch cost data:", error);
      }
    }
    
    fetchData();
  }, [selectedWarehouse, selectedPeriod]);

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-800">Dashboards</h1>
            <div className="mt-1">
              <Tabs defaultValue="cost" className="w-80">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Cost Analysis</CardTitle>
                  <CardDescription>
                    Visualize your organization's costs and consumption in Snowflake
                  </CardDescription>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
                  <div className="w-48">
                    <Select defaultValue="all" onValueChange={setSelectedWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All warehouses</SelectItem>
                        <SelectItem value="BUSINESS_X_DEPT_XL">BUSINESS_X_DEPT_XL</SelectItem>
                        <SelectItem value="FINANCE_PROD_PAYMENTS">FINANCE_PROD_PAYMENTS</SelectItem>
                        <SelectItem value="BUSINESS_X_WH">BUSINESS_X_WH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-48">
                    <Select defaultValue="30days" onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="year">Last 12 months</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Download report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <h3 className="text-lg font-medium mb-4">Total costs by tag value</h3>
                  <div className="relative">
                    <div className="w-full aspect-square flex items-center justify-center relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                        
                        {costData.map((item, index) => {
                          // Calculate the percentage of the circle's circumference that this segment should occupy
                          const totalPercentage = costData.slice(0, index).reduce((sum, curr) => sum + curr.percentage, 0);
                          const strokeDasharray = `${item.percentage * 2.51} 251`;
                          const strokeDashoffset = `${-(totalPercentage * 2.51)}`;
                          
                          return (
                            <circle 
                              key={item.category}
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none"
                              stroke={item.color}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform="rotate(-90 50 50)"
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}
                        
                        <text x="50" y="45" textAnchor="middle" className="text-3xl font-bold fill-gray-900">
                          ${(totalCost).toLocaleString()}
                        </text>
                        <text x="50" y="55" textAnchor="middle" className="text-sm fill-gray-500">
                          Total
                        </text>
                      </svg>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                      {costData.map((item) => (
                        <div key={item.category} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-sm mr-2"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <div className="text-sm">
                            <span className="font-medium">{item.category}</span>
                            <span className="text-gray-500 ml-1">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-1/2">
                  <h3 className="text-lg font-medium mb-4">Cost breakdown</h3>
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-sm text-gray-500 border-b">
                          <th className="text-left py-2 font-medium">Category</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                          <th className="text-right py-2 font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costData.map((item) => (
                          <tr key={item.category} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-sm mr-2"
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="font-medium">{item.category}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">${item.amount.toLocaleString()}</td>
                            <td className="py-3 text-right">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="py-3">Total</td>
                          <td className="py-3 text-right">${totalCost.toLocaleString()}</td>
                          <td className="py-3 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}