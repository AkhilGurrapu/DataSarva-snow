import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Check, DollarSign, TrendingDown } from "lucide-react";

type RecommendationsProps = {
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

export default function Recommendations({ user, onLogout }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendations, setSelectedRecommendations] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get recommendations from the Snowflake API
        const response = await apiRequest("GET", "/api/recommendations", {});
        
        if (response && Array.isArray(response) && response.length > 0) {
          setRecommendations(response);
          
          // Calculate total savings from real recommendations
          const total = response.reduce((acc, rec) => acc + (rec.savings || 0), 0);
          setTotalSavings(total);
        } else {
          // If no recommendations are available, set empty state
          setRecommendations([]);
          setTotalSavings(0);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        // On error, clear data and show empty state
        setRecommendations([]);
        setTotalSavings(0);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const toggleRecommendation = (id: number) => {
    if (selectedRecommendations.includes(id)) {
      setSelectedRecommendations(selectedRecommendations.filter(recId => recId !== id));
    } else {
      setSelectedRecommendations([...selectedRecommendations, id]);
    }
  };

  const selectAllRecommendations = () => {
    if (selectedRecommendations.length === recommendations.length) {
      setSelectedRecommendations([]);
    } else {
      setSelectedRecommendations(recommendations.map(rec => rec.id));
    }
  };

  const getTotalSavingsForSelected = () => {
    return recommendations
      .filter(rec => selectedRecommendations.includes(rec.id))
      .reduce((total, rec) => total + rec.savings, 0);
  };

  const applyRecommendations = async () => {
    // In a real implementation, this would call an API to apply the changes
    // For now, we'll just show an alert
    const selected = recommendations.filter(rec => selectedRecommendations.includes(rec.id));
    alert(`Applied ${selected.length} recommendations with potential savings of $${getTotalSavingsForSelected().toFixed(2)}`);
  };

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 mr-2">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl font-medium text-gray-800">Warehouse Recommendations</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={selectAllRecommendations}
              disabled={recommendations.length === 0 || loading}
            >
              {selectedRecommendations.length === recommendations.length 
                ? "Deselect All" 
                : "Select All"}
            </Button>
            <Button
              onClick={applyRecommendations}
              disabled={selectedRecommendations.length === 0 || loading}
            >
              Apply Selected ({selectedRecommendations.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recommendations.length > 0 ? (
          <>
            <div className="flex gap-6">
              <Card className="w-full">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">All Recommendations</CardTitle>
                  <CardDescription>
                    Total potential savings: ${totalSavings.toFixed(2)} per month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-4 text-left"></th>
                          <th className="py-3 px-4 text-left">Warehouse</th>
                          <th className="py-3 px-4 text-right">Current Monthly Cost</th>
                          <th className="py-3 px-4 text-right">Recommended Cost</th>
                          <th className="py-3 px-4 text-right">Savings</th>
                          <th className="py-3 px-4 text-right">Savings %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendations.map((rec) => (
                          <tr 
                            key={rec.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              selectedRecommendations.includes(rec.id) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => toggleRecommendation(rec.id)}
                          >
                            <td className="py-3 px-4">
                              <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                                selectedRecommendations.includes(rec.id) 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedRecommendations.includes(rec.id) && 
                                  <Check className="h-3 w-3 text-white" />
                                }
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{rec.warehouseName}</td>
                            <td className="py-3 px-4 text-right">${rec.currentCost.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">${rec.recommendedCost.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-green-600 font-medium">
                              ${rec.savings.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end">
                                <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                                <span className="text-green-600 font-medium">
                                  {rec.savingsPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedRecommendations.length > 0 && (
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium">
                        Selected recommendations will save ${getTotalSavingsForSelected().toFixed(2)} per month
                      </span>
                    </div>
                    <Button onClick={applyRecommendations}>
                      Apply Selected ({selectedRecommendations.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-blue-100 rounded-full p-6 mb-4">
                <TrendingDown className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Recommendations Available</h3>
              <p className="text-gray-500 max-w-md mb-6">
                There are currently no recommendations available for your warehouses. 
                This could be because your warehouses are already optimized, or because
                there isn't enough usage data to generate recommendations.
              </p>
              <Link href="/warehouses" className="text-blue-600 hover:text-blue-700 font-medium">
                Go to Warehouses
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}