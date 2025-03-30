import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import QueryAnalyzer from "@/components/query-optimizer/query-analyzer";

type QueryOptimizerProps = {
  user: any;
  onLogout: () => void;
};

type Connection = {
  id: number;
  name: string;
  isActive: boolean;
};

export default function QueryOptimizer({ user, onLogout }: QueryOptimizerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get connections
        const connectionsData = await snowflakeClient.getConnections();
        setConnections(connectionsData);
        
        const active = connectionsData.find((c: Connection) => c.isActive);
        if (active) {
          setActiveConnection(active.name);
          setSelectedConnectionId(active.id);
        } else if (connectionsData.length > 0) {
          setSelectedConnectionId(connectionsData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load connections",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (selectedConnectionId) {
      fetchQueryHistory();
    }
  }, [selectedConnectionId]);

  async function fetchQueryHistory() {
    try {
      setLoadingHistory(true);
      const history = await snowflakeClient.getQueryHistory(10);
      setQueryHistory(history);
    } catch (error) {
      console.error("Failed to fetch query history:", error);
      toast({
        title: "Error",
        description: "Failed to load query history",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleQueryOptimized = () => {
    // Refresh the query history after a query is optimized
    fetchQueryHistory();
  };

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
          title="Query Optimizer" 
          user={user} 
          onLogout={onLogout} 
          onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : connections.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No Snowflake connections found. Please create a connection first to use the Query Optimizer.
                  </AlertDescription>
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={() => window.location.href = '/connections'}
                  >
                    Create Connection
                  </Button>
                </Alert>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">AI-Powered SQL Query Optimizer</h2>
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-neutral-700 mr-2">
                        Connection:
                      </label>
                      <Select
                        value={selectedConnectionId?.toString() || ""}
                        onValueChange={(value) => setSelectedConnectionId(parseInt(value))}
                      >
                        <SelectTrigger className="w-[240px]">
                          <SelectValue placeholder="Select connection" />
                        </SelectTrigger>
                        <SelectContent>
                          {connections.map((connection) => (
                            <SelectItem 
                              key={connection.id} 
                              value={connection.id.toString()}
                            >
                              {connection.name} {connection.isActive ? "(Active)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="optimizer" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="optimizer">Query Optimizer</TabsTrigger>
                      <TabsTrigger value="history">Optimization History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="optimizer" className="space-y-4">
                      {selectedConnectionId && (
                        <QueryAnalyzer 
                          connectionId={selectedConnectionId} 
                          onQueryOptimized={handleQueryOptimized}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="history">
                      <Card>
                        <CardHeader>
                          <CardTitle>Query Optimization History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingHistory ? (
                            <div className="flex justify-center py-8">
                              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : queryHistory.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                              No optimization history found. Optimize your first query to see results here.
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {queryHistory.map((item) => (
                                <div key={item.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="text-sm font-medium text-neutral-900">
                                      {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      Improved by {
                                        item.executionTimeOriginal && item.executionTimeOptimized
                                          ? Math.round((item.executionTimeOriginal - item.executionTimeOptimized) / item.executionTimeOriginal * 100)
                                          : 0
                                      }%
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center text-xs font-medium text-neutral-700">
                                        <svg className="h-4 w-4 mr-1 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Original Query ({item.executionTimeOriginal}ms)
                                      </div>
                                      <div className="bg-neutral-50 p-3 rounded text-xs font-mono overflow-x-auto max-h-32">
                                        {item.originalQuery}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center text-xs font-medium text-neutral-700">
                                        <svg className="h-4 w-4 mr-1 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Optimized Query ({item.executionTimeOptimized}ms)
                                      </div>
                                      <div className="bg-neutral-50 p-3 rounded text-xs font-mono overflow-x-auto max-h-32">
                                        {item.optimizedQuery}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {item.suggestions && (
                                    <div className="pt-2">
                                      <div className="text-xs font-medium text-neutral-700 mb-2">Optimization Details:</div>
                                      <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">
                                        {Array.isArray(item.suggestions) 
                                          ? item.suggestions.map((suggestion: any, idx: number) => (
                                              <li key={idx}>{suggestion.title}: {suggestion.description}</li>
                                            ))
                                          : null
                                        }
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
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
