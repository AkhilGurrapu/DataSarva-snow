import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { ArrowRight, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
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
};

export default function Home({ user, onLogout }: HomeProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // This would be a real API call in production
        // For now we'll create mock data that matches the mockups
        const mockRecommendations = [
          { 
            id: 1, 
            warehouseName: "Nexus_6_WH_1", 
            currentCost: 5672.70, 
            recommendedCost: 4582.40, 
            savings: 1090.30,
            savingsPercentage: 19.22
          },
          { 
            id: 2, 
            warehouseName: "Nexus_6_WH_3", 
            currentCost: 1440.00, 
            recommendedCost: 900.73, 
            savings: 539.27,
            savingsPercentage: 37.45
          },
          { 
            id: 3, 
            warehouseName: "Alpha_WH_5", 
            currentCost: 8290.38, 
            recommendedCost: 5684.73, 
            savings: 2605.65,
            savingsPercentage: 31.43
          },
          { 
            id: 4, 
            warehouseName: "Nexus_6_WH_7", 
            currentCost: 1440.00, 
            recommendedCost: 864.00, 
            savings: 576.00,
            savingsPercentage: 40
          },
          { 
            id: 5, 
            warehouseName: "Nexus_6_WH_5", 
            currentCost: 432.17, 
            recommendedCost: 259.23, 
            savings: 172.94,
            savingsPercentage: 40.02
          }
        ];
        
        setRecommendations(mockRecommendations);
        
        const total = mockRecommendations.reduce((acc, rec) => acc + rec.savings, 0);
        setTotalSavings(total);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">Welcome!</h1>
        </div>
        
        <div className="flex gap-6">
          <div className="w-1/2">
            <Card className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-medium uppercase opacity-80">ALL TIME</h2>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    <span className="text-2xl font-semibold">100,000.50</span>
                  </div>
                  <span className="text-sm">Slingshot savings</span>
                </div>
                <div>
                  <h2 className="text-sm font-medium uppercase opacity-80">LAST 30 DAYS</h2>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    <span className="text-2xl font-semibold">4,350.06</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/5">
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center">
                <div className="bg-blue-100 rounded-full p-8 mb-4">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/4285/4285587.png" 
                    alt="Savings" 
                    className="h-20 w-20"
                  />
                </div>
                <h2 className="text-2xl font-semibold mb-1">
                  ${totalSavings.toFixed(2)}
                </h2>
                <p className="text-lg font-medium mb-4">
                  Potential savings on unoptimized recommendations
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  These are savings that your entire org is leaving on 
                  the table by ignoring your top recommendations.
                </p>
                <Link href="/recommendations">
                  <a className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Go to all savings recommendations
                  </a>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-3/5">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Your top recommendations</CardTitle>
                <CardDescription>Showing recommendations based on your role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-xs text-gray-500 font-medium px-2 py-1">
                  <div className="w-1/4">Warehouse</div>
                  <div className="w-1/4 text-right">Historical Monthly Cost</div>
                  <div className="w-1/4 text-right">Recommended Monthly Cost</div>
                  <div className="w-1/4 text-right">Savings</div>
                </div>
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex justify-between items-center p-2 border-t border-gray-100">
                    <div className="w-1/4 font-medium text-blue-600">{rec.warehouseName}</div>
                    <div className="w-1/4 text-right">${rec.currentCost.toFixed(2)}</div>
                    <div className="w-1/4 text-right">${rec.recommendedCost.toFixed(2)}</div>
                    <div className="w-1/4 text-right flex items-center justify-end">
                      <span className="text-green-600 font-medium">+{rec.savingsPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4">
                  <Link href="/recommendations">
                    <a className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                      Go to all recommendations <ArrowRight className="ml-1 w-4 h-4" />
                    </a>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Note:</span> There are queries that run on warehouses across your organization - can be optimized using 
            <Link href="/query-advisor">
              <a className="text-blue-600 hover:underline mx-1">query advisor</a>
            </Link>.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}