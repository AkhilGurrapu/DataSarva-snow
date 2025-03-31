import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { 
  Clock,
  Search, 
  DollarSign, 
  Timer, 
  ChevronLeft,
  ChevronRight,
  BarChart,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { snowflakeClient } from "../lib/snowflake";
import { useConnection } from "../hooks/use-connection";
import { useToast } from "../hooks/use-toast";

type QueryAdvisorProps = {
  user: any;
  onLogout: () => void;
};

type QueryHistory = {
  id: string | number;
  query: string;
  lastRun: string;
  warehouse: string;
  frequency: number;
  cost: number;
  executionTime: number;
  lastBilled: string;
};

type QueryOpportunity = {
  title: string;
  description: string;
  location?: {
    line: number;
    column: number;
  };
  reason?: string;
  severity?: "low" | "medium" | "high";
  suggestion: string;
};

export default function QueryAdvisor({ user, onLogout }: QueryAdvisorProps) {
  const { activeConnection } = useConnection();
  const { toast } = useToast();
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistory | null>(null);
  const [queryText, setQueryText] = useState("");
  const [opportunities, setOpportunities] = useState<QueryOpportunity[]>([]);
  const [analyzingQuery, setAnalyzingQuery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch query history from Snowflake
    async function fetchQueryHistory() {
      if (!activeConnection) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to get query history
        const data = await snowflakeClient.getQueryHistory(20); // Get last 20 queries
        
        if (data && Array.isArray(data)) {
          // Format the data to match our QueryHistory type
          const formattedData = data.map((item: any) => {
            // Format date using Intl.DateTimeFormat
            const date = new Date(item.START_TIME || item.startTime || item.start_time);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }).format(date);
            
            return {
              id: item.QUERY_ID || item.queryId || item.id || `query-${Math.random().toString(36).substring(2, 9)}`,
              query: item.QUERY_TEXT || item.queryText || item.query || "",
              lastRun: formattedDate,
              warehouse: item.WAREHOUSE_NAME || item.warehouseName || item.warehouse || "Unknown",
              frequency: parseInt(item.EXECUTION_COUNT || item.executionCount || "1"),
              cost: parseFloat(item.CREDITS_USED || item.creditsUsed || "0") * 3, // Assuming $3 per credit
              executionTime: parseFloat(item.EXECUTION_TIME || item.executionTime || "0") / 1000, // Convert to seconds
              lastBilled: formattedDate
            };
          });
          
          setQueryHistory(formattedData);
          
          // Set total pages based on the number of records
          if (formattedData.length > 0) {
            setTotalPages(Math.ceil(formattedData.length / 10));
          }
        } else {
          setError("No query history data available");
        }
      } catch (err) {
        console.error("Failed to fetch query history:", err);
        setError("Failed to fetch query history. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchQueryHistory();
  }, [activeConnection]);

  const handleSelectQuery = (query: QueryHistory) => {
    setSelectedQuery(query);
    setQueryText(query.query);
    
    // Analyze the selected query
    handleAnalyzeQuery(query.query);
  };

  const handleAnalyzeQuery = async (queryToAnalyze?: string) => {
    const queryToProcess = queryToAnalyze || queryText;
    if (!queryToProcess.trim()) return;
    
    setAnalyzingQuery(true);
    setOpportunities([]);
    
    try {
      // Call the analyze-query endpoint
      const analysis = await snowflakeClient.analyzeQuery(queryToProcess);
      
      if (analysis && analysis.suggestions) {
        // Convert the suggestions to our opportunity format
        const formattedOpportunities = analysis.suggestions.map((sugg: any, index: number) => ({
          title: sugg.title || `Optimization ${index + 1}`,
          description: sugg.description || "No description provided",
          severity: getSeverityFromTitle(sugg.title) as "low" | "medium" | "high",
          suggestion: sugg.description || "No suggestion provided",
          location: {
            line: 1,
            column: 1
          }
        }));
        
        setOpportunities(formattedOpportunities);
      } else {
        toast({
          title: "Analysis failed",
          description: "Could not analyze the query. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to analyze query:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the query. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingQuery(false);
    }
  };
  
  // Helper function to determine severity based on the suggestion title
  const getSeverityFromTitle = (title: string): string => {
    const lowerTitle = (title || "").toLowerCase();
    if (lowerTitle.includes("critical") || lowerTitle.includes("serious") || lowerTitle.includes("select *")) {
      return "high";
    } else if (lowerTitle.includes("medium") || lowerTitle.includes("consider") || lowerTitle.includes("improve")) {
      return "medium";
    } else {
      return "low";
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">Query Advisor</h1>
          <p className="text-gray-600 mt-1">
            This tool analyzes your organization's Snowflake queries and surfaces opportunities to clean up SQL 
            keywords and operators, so the query can process more efficiently. Enter query text into the editor 
            below to analyze it.
          </p>
        </div>
        
        {/* Two-column layout with analysis section on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Query history and pagination */}
          <div className="lg:col-span-2">
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-2">Costliest queries</h2>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Last updated: 12:30 - Mar 25, 2024</span>
                <Button variant="outline" size="sm" className="text-gray-600">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {loading && (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2">Loading query history...</span>
                  </div>
                )}
                
                {error && (
                  <div className="p-6 text-center">
                    <div className="text-red-600 mb-2">{error}</div>
                    <p className="text-gray-600 text-sm">
                      Please check your Snowflake connection and make sure you have the appropriate permissions.
                    </p>
                  </div>
                )}
                
                {!loading && !error && queryHistory.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">No query history found in your Snowflake account.</p>
                  </div>
                )}
                
                {!loading && !error && queryHistory.length > 0 && (
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                          <tr className="border-b text-sm text-gray-500">
                            <th className="text-left py-3 px-4 font-medium">Query ID</th>
                            <th className="text-left py-3 px-4 font-medium">Last run</th>
                            <th className="text-left py-3 px-4 font-medium">Warehouse</th>
                            <th className="text-left py-3 px-4 font-medium">Frequency</th>
                            <th className="text-left py-3 px-4 font-medium">Cost</th>
                            <th className="text-left py-3 px-4 font-medium">
                              Execution time (sec)
                            </th>
                            <th className="text-left py-3 px-4 font-medium">Last billed date</th>
                            <th className="text-left py-3 px-4 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryHistory.slice((currentPage - 1) * 10, currentPage * 10).map((query) => (
                            <tr 
                              key={query.id} 
                              className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleSelectQuery(query)}
                            >
                              <td className="py-3 px-4 font-medium text-blue-600 truncate max-w-xs">
                                {query.id.toString().substring(0, 20)}{query.id.toString().length > 20 ? '...' : ''}
                              </td>
                              <td className="py-3 px-4">{query.lastRun || 'N/A'}</td>
                              <td className="py-3 px-4">{query.warehouse || 'N/A'}</td>
                              <td className="py-3 px-4">{(query.frequency || 0).toLocaleString()}</td>
                              <td className="py-3 px-4">${(query.cost || 0).toFixed(2)}</td>
                              <td className="py-3 px-4">{(query.executionTime || 0).toFixed(2)}</td>
                              <td className="py-3 px-4">{query.lastBilled || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectQuery(query);
                                  }}
                                >
                                  Analyze
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="p-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button 
                          key={i}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          className={pageNum === currentPage ? "bg-blue-600" : ""}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Query analysis and opportunities */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Query analysis</CardTitle>
                <CardDescription>
                  Enter your query code below to analyze it for optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  className="min-h-[200px] font-mono"
                  placeholder="Add your query code here..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={() => handleAnalyzeQuery()}
                    disabled={analyzingQuery || !queryText.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {analyzingQuery ? "Analyzing..." : "Analyze query"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {analyzingQuery && (
              <div className="flex justify-center items-center p-8 mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Analyzing query...</span>
              </div>
            )}
            
            {!analyzingQuery && opportunities.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {opportunities.map((opportunity, index) => (
                    <div key={`opp-${index}`} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{opportunity.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(opportunity.severity || 'medium')}
                        >
                          {opportunity.severity || 'medium'}
                        </Badge>
                      </div>
                      
                      {opportunity.location && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Location:</span> Line {opportunity.location.line}, Column {opportunity.location.column}
                        </div>
                      )}
                      
                      {opportunity.reason && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Reason:</span> {opportunity.reason}
                        </div>
                      )}
                      
                      <div className="text-sm mb-3">
                        <p>{opportunity.description}</p>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-md border border-green-100 text-sm">
                        <div className="font-medium text-green-800 mb-1">Suggested fix:</div>
                        <p className="text-green-700">{opportunity.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}