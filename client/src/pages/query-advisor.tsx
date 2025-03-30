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
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { openaiClient } from "../lib/openai";

type QueryAdvisorProps = {
  user: any;
  onLogout: () => void;
};

type QueryHistory = {
  id: string;
  query: string;
  lastRun: string;
  accountName: string;
  frequency: number;
  cost: number;
  executionTime: number;
  lastBilled: string;
};

type QueryOpportunity = {
  id: string;
  title: string;
  description: string;
  location: {
    line: number;
    column: number;
  };
  reason: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
};

export default function QueryAdvisor({ user, onLogout }: QueryAdvisorProps) {
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistory | null>(null);
  const [queryText, setQueryText] = useState("");
  const [opportunities, setOpportunities] = useState<QueryOpportunity[]>([]);
  const [analyzingQuery, setAnalyzingQuery] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(7);

  useEffect(() => {
    async function fetchData() {
      try {
        // This would be real API calls in production
        // For now we'll create mock data that matches the mockups
        const mockQueries: QueryHistory[] = [
          {
            id: "01e4f21-50d4-c9f8-92f9-16f0e0000e86",
            query: "SELECT * FROM table1 t1 JOIN table2 t2 ON t1.id = t2.id WHERE t1.status = 'ACTIVE'",
            lastRun: "Apr 15, 2024",
            accountName: "snowflake1 (APP_API)",
            frequency: 10742,
            cost: 13.45,
            executionTime: 0.53,
            lastBilled: "Apr 15, 2024"
          },
          {
            id: "03b6572f-000d-cf38-d7d1-84fd07103e3a",
            query: "SELECT t1.*, t2.name FROM orders t1 JOIN customers t2 ON t1.customer_id = t2.id",
            lastRun: "Apr 15, 2024",
            accountName: "snowflake1 (APP_API)",
            frequency: 11,
            cost: 5.98,
            executionTime: 0.03,
            lastBilled: "Apr 15, 2024"
          },
          {
            id: "01abfe-0505-dc89-0f01-364007101c",
            query: "SELECT department_id, COUNT(*) FROM employees GROUP BY department_id",
            lastRun: "May 8, 2024",
            accountName: "snowflake1 (APP_API)",
            frequency: 25,
            cost: 10.75,
            executionTime: 0.08,
            lastBilled: "May 8, 2024"
          },
          {
            id: "01fbef9-fa02-cd9b-0f01-f002006c",
            query: "SELECT * FROM inventory WHERE quantity < 100",
            lastRun: "May 20, 2024",
            accountName: "snowflake1 (APP_API)",
            frequency: 42,
            cost: 12.67,
            executionTime: 0.14,
            lastBilled: "May 20, 2024"
          }
        ];
        
        setQueryHistory(mockQueries);
      } catch (error) {
        console.error("Failed to fetch query history:", error);
      }
    }
    
    fetchData();
  }, []);

  const handleSelectQuery = (query: QueryHistory) => {
    setSelectedQuery(query);
    setQueryText(query.query);
    
    // Mock opportunities
    const mockOpportunities: QueryOpportunity[] = [
      {
        id: "opp1",
        title: "Use LIMIT on specific tables",
        description: "Consider adding a LIMIT clause to your query to reduce the amount of data processed.",
        location: {
          line: 1,
          column: 8
        },
        reason: "Optimization: Performance",
        severity: "medium",
        suggestion: "Add `LIMIT 1000` to your query to reduce data processing."
      },
      {
        id: "opp2",
        title: "Replace SELECT * with specific columns",
        description: "SELECT * is expensive and impacts query performance, especially with large tables.",
        location: {
          line: 1,
          column: 8
        },
        reason: "Optimization: Cost and Performance",
        severity: "high",
        suggestion: "Replace SELECT * with specific columns needed for your analysis."
      }
    ];
    
    setOpportunities(mockOpportunities);
  };

  const handleAnalyzeQuery = async () => {
    if (!queryText.trim()) return;
    
    setAnalyzingQuery(true);
    
    try {
      // In production, this would call the OpenAI service
      // Simulating a delay for analysis
      await new Promise(r => setTimeout(r, 1500));
      
      const mockOpportunities: QueryOpportunity[] = [
        {
          id: "opp1",
          title: "Optimize JOIN operation",
          description: "The JOIN operation could be optimized by adding appropriate indexes.",
          location: {
            line: 1,
            column: 30
          },
          reason: "Performance optimization",
          severity: "medium",
          suggestion: "Add an index on the JOIN columns to improve query performance."
        },
        {
          id: "opp2",
          title: "Avoid SELECT *",
          description: "Using SELECT * retrieves all columns which is inefficient for large tables.",
          location: {
            line: 1,
            column: 8
          },
          reason: "Cost optimization",
          severity: "high",
          suggestion: "Specify only the columns you need instead of using SELECT *."
        }
      ];
      
      setOpportunities(mockOpportunities);
    } catch (error) {
      console.error("Failed to analyze query:", error);
    } finally {
      setAnalyzingQuery(false);
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
        
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-2">Costliest queries</h2>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Last updated: 12:30 - Mar 25, 2024</span>
            <Button variant="outline" size="sm" className="text-gray-600">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="text-left py-3 px-4 font-medium">Query ID</th>
                    <th className="text-left py-3 px-4 font-medium">Last run</th>
                    <th className="text-left py-3 px-4 font-medium">Account name</th>
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
                  {queryHistory.map((query) => (
                    <tr 
                      key={query.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectQuery(query)}
                    >
                      <td className="py-3 px-4 font-medium text-blue-600 truncate max-w-xs">
                        {query.id}
                      </td>
                      <td className="py-3 px-4">{query.lastRun}</td>
                      <td className="py-3 px-4">{query.accountName}</td>
                      <td className="py-3 px-4">{query.frequency.toLocaleString()}</td>
                      <td className="py-3 px-4">${query.cost.toFixed(2)}</td>
                      <td className="py-3 px-4">{query.executionTime.toFixed(2)}</td>
                      <td className="py-3 px-4">{query.lastBilled}</td>
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
                {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
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
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Query analysis</CardTitle>
                <CardDescription>
                  Enter your query code below to analyze it for optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  className="min-h-[300px] font-mono"
                  placeholder="Add your query code here..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={handleAnalyzeQuery}
                    disabled={analyzingQuery || !queryText.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {analyzingQuery ? "Analyzing..." : "Analyze query"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1">
            {opportunities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{opportunity.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(opportunity.severity)}
                        >
                          {opportunity.severity}
                        </Badge>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="font-medium">Location:</span> Line {opportunity.location.line}, Column {opportunity.location.column}
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="font-medium">Reason:</span> {opportunity.reason}
                      </div>
                      
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