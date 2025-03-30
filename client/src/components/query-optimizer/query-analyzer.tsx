import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { openaiClient } from "@/lib/openai";

type QueryAnalyzerProps = {
  connectionId: number;
  onQueryOptimized?: () => void;
};

export default function QueryAnalyzer({ connectionId, onQueryOptimized }: QueryAnalyzerProps) {
  const [query, setQuery] = useState("");
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleOptimize = async () => {
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a SQL query to optimize",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await openaiClient.analyzeQuery(connectionId, query);
      setOptimizationResult(result);
      
      if (onQueryOptimized) {
        onQueryOptimized();
      }
      
      toast({
        title: "Query optimized",
        description: `Optimization completed with ${result.improvement.toFixed(1)}% improvement`,
      });
    } catch (error) {
      console.error("Query optimization failed:", error);
      toast({
        title: "Optimization failed",
        description: error instanceof Error ? error.message : "Failed to optimize the query",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The SQL query has been copied to your clipboard",
    });
  };

  const exampleQueries = [
    `SELECT * FROM sales WHERE created_at > '2023-01-01'`,
    `SELECT c.customer_id, c.name, COUNT(o.order_id) as total_orders 
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name`,
    `SELECT p.product_id, p.name, SUM(o.quantity) as total_sold
FROM products p
JOIN order_items o ON p.product_id = o.product_id
WHERE p.category = 'Electronics'
GROUP BY p.product_id, p.name
ORDER BY total_sold DESC`,
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Query Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-neutral-700 mb-1">
                Enter your SQL query:
              </label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-40 font-mono"
                placeholder="SELECT * FROM table_name WHERE condition"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-neutral-500">Need inspiration?</span>{" "}
                <button 
                  className="text-primary hover:text-primary-dark" 
                  onClick={() => setQuery(exampleQueries[Math.floor(Math.random() * exampleQueries.length)])}
                >
                  Use example query
                </button>
              </div>
              
              <Button onClick={handleOptimize} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Optimize Query
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isAnalyzing ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : optimizationResult ? (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="results" className="space-y-4">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-neutral-900">Optimized Query</h3>
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(optimizationResult.optimizedQuery)}>
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </Button>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    {optimizationResult.optimizedQuery.split('\n').map((line: string, i: number) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-success bg-opacity-10 rounded-md p-4">
                  <div className="flex items-center text-success font-medium">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Performance Improvement
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-neutral-500 text-sm">Original Time</div>
                      <div className="text-lg font-semibold">{optimizationResult.originalExecutionTime} ms</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-neutral-500 text-sm">Optimized Time</div>
                      <div className="text-lg font-semibold">{optimizationResult.optimizedExecutionTime} ms</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-neutral-500 text-sm">Improvement</div>
                      <div className="text-lg font-semibold text-success">{optimizationResult.improvement.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="comparison" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 mr-2 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-medium text-neutral-900">Original Query</h3>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-md font-mono text-sm overflow-x-auto h-80">
                      {optimizationResult.originalQuery.split('\n').map((line: string, i: number) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 mr-2 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <h3 className="font-medium text-neutral-900">Optimized Query</h3>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-md font-mono text-sm overflow-x-auto h-80">
                      {optimizationResult.optimizedQuery.split('\n').map((line: string, i: number) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="suggestions">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Optimization Suggestions</h3>
                  
                  {Array.isArray(optimizationResult.suggestions) ? (
                    optimizationResult.suggestions.map((suggestion: any, idx: number) => (
                      <div key={idx} className="bg-neutral-50 p-4 rounded-md">
                        <h4 className="font-medium text-neutral-800">{suggestion.title}</h4>
                        <p className="text-neutral-600 mt-1">{suggestion.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500">No specific suggestions available.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
