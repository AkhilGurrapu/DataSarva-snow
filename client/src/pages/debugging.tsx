import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import ErrorAnalyzer from "@/components/debugging/error-analyzer";
import { formatDistanceToNow } from 'date-fns';

type DebuggingProps = {
  user: any;
  onLogout: () => void;
};

type Connection = {
  id: number;
  name: string;
  isActive: boolean;
};

type ErrorLog = {
  id: number;
  userId: number;
  connectionId: number;
  errorMessage: string;
  errorCode: string | null;
  errorContext: string | null;
  analysis: any;
  status: string;
  timestamp: string;
};

export default function Debugging({ user, onLogout }: DebuggingProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const [loadingLogs, setLoadingLogs] = useState(false);
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
      fetchErrorLogs();
    }
  }, [selectedConnectionId]);

  async function fetchErrorLogs() {
    try {
      setLoadingLogs(true);
      const logs = await snowflakeClient.getErrorLogs(20);
      setErrorLogs(logs);
    } catch (error) {
      console.error("Failed to fetch error logs:", error);
      toast({
        title: "Error",
        description: "Failed to load error logs",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  }

  const handleErrorAnalyzed = () => {
    // Refresh the error logs after a new error is analyzed
    fetchErrorLogs();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "analyzed":
        return <Badge className="bg-success">Analyzed</Badge>;
      case "pending":
        return <Badge className="bg-warning">Pending</Badge>;
      case "failed":
        return <Badge className="bg-destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
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
          title="Debugging Assistant" 
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
                    No Snowflake connections found. Please create a connection first to use the Debugging Assistant.
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
                    <h2 className="text-xl font-semibold text-gray-800">AI-Powered Error Analysis</h2>
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
                  
                  <Tabs defaultValue="analyzer" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="analyzer">Error Analyzer</TabsTrigger>
                      <TabsTrigger value="history">Error History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="analyzer" className="space-y-4">
                      {selectedConnectionId && (
                        <ErrorAnalyzer 
                          connectionId={selectedConnectionId} 
                          onErrorAnalyzed={handleErrorAnalyzed}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="history">
                      <Card>
                        <CardHeader>
                          <CardTitle>Error Analysis History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingLogs ? (
                            <div className="flex justify-center py-8">
                              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : errorLogs.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                              No error logs found. Analyze your first error to see results here.
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {errorLogs.map((log) => (
                                <div key={log.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="text-sm font-medium text-neutral-900">
                                      {log.errorCode ? `Error ${log.errorCode}` : 'Error'}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {getStatusBadge(log.status)}
                                      <div className="text-xs text-neutral-500">
                                        {formatTimestamp(log.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-neutral-50 p-3 rounded text-sm text-neutral-800">
                                    {log.errorMessage}
                                  </div>
                                  
                                  {log.errorContext && (
                                    <div className="text-xs text-neutral-500">
                                      <div className="font-medium mb-1">Context:</div>
                                      <div className="bg-neutral-50 p-2 rounded">{log.errorContext}</div>
                                    </div>
                                  )}
                                  
                                  {log.analysis && (
                                    <div className="border-t border-neutral-200 pt-3 mt-3">
                                      <div className="text-sm font-medium text-neutral-800 mb-2">Analysis:</div>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <div className="text-xs font-medium text-neutral-700">Root Cause:</div>
                                          <div className="text-sm text-neutral-600">{log.analysis.rootCause}</div>
                                        </div>
                                        
                                        <div>
                                          <div className="text-xs font-medium text-neutral-700">Solution:</div>
                                          <div className="text-sm text-neutral-600">{log.analysis.solution}</div>
                                        </div>
                                        
                                        <div>
                                          <div className="text-xs font-medium text-neutral-700">Prevention Measures:</div>
                                          <div className="text-sm text-neutral-600">{log.analysis.preventionMeasures}</div>
                                        </div>
                                      </div>
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
