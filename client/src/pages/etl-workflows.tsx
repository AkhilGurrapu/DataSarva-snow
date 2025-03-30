import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import PipelineForm from "@/components/etl-workflows/pipeline-form";

type EtlWorkflowsProps = {
  user: any;
  onLogout: () => void;
};

type Connection = {
  id: number;
  name: string;
  isActive: boolean;
};

type Pipeline = {
  id: number;
  name: string;
  description: string;
  sourceDescription: string;
  targetDescription: string;
  businessRequirements: string;
  schedule: string;
  status: string;
  lastRunTime: number | null;
  lastRunStatus: string | null;
  createdAt: string;
};

export default function EtlWorkflows({ user, onLogout }: EtlWorkflowsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const { toast } = useToast();
  const isMobile = useMobile();
  const [location] = useLocation();

  useEffect(() => {
    // Check if we're on the "new" route
    if (location === "/etl-workflows/new") {
      setShowNewPipelineDialog(true);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Get connections
      const connectionsData = await snowflakeClient.getConnections();
      setConnections(connectionsData);
      
      const active = connectionsData.find((c: Connection) => c.isActive);
      if (active) {
        setActiveConnection(active.name);
      }
      
      // Get pipelines
      const pipelinesData = await snowflakeClient.getPipelines();
      setPipelines(pipelinesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      await snowflakeClient.updatePipeline(id, { status: newStatus });
      
      // Update local state
      setPipelines(pipelines.map(pipeline => 
        pipeline.id === id ? { ...pipeline, status: newStatus } : pipeline
      ));
      
      toast({
        title: "Pipeline updated",
        description: `Pipeline status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update pipeline:", error);
      toast({
        title: "Failed to update pipeline",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }

  async function handleDeletePipeline(id: number) {
    try {
      await snowflakeClient.deletePipeline(id);
      
      // Update local state
      setPipelines(pipelines.filter(pipeline => pipeline.id !== id));
      
      toast({
        title: "Pipeline deleted",
        description: "Successfully deleted pipeline",
      });
    } catch (error) {
      console.error("Failed to delete pipeline:", error);
      toast({
        title: "Failed to delete pipeline",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPipelineToDelete(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success">Active</Badge>;
      case "paused":
        return <Badge className="bg-neutral-500">Paused</Badge>;
      case "failed":
        return <Badge className="bg-destructive">Failed</Badge>;
      default:
        return <Badge className="bg-warning">Unknown</Badge>;
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
          title="ETL Workflows" 
          user={user} 
          onLogout={onLogout} 
          onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">ETL Pipelines</h2>
                <Button onClick={() => setShowNewPipelineDialog(true)}>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Pipeline
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : connections.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No Snowflake connections found. Please create a connection first to create ETL pipelines.
                  </AlertDescription>
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={() => window.location.href = '/connections'}
                  >
                    Create Connection
                  </Button>
                </Alert>
              ) : pipelines.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <svg className="h-12 w-12 text-neutral-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-700">No ETL pipelines found</h3>
                    <p className="text-neutral-500 mb-6 text-center max-w-md mt-2">
                      Create your first ETL pipeline to automate data workflows in Snowflake.
                    </p>
                    <Button onClick={() => setShowNewPipelineDialog(true)}>Create Pipeline</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pipelines.map((pipeline) => (
                    <Card key={pipeline.id} className="shadow hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                          {getStatusBadge(pipeline.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-neutral-600 mb-4">{pipeline.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-neutral-700">Schedule:</span>
                            <span>{pipeline.schedule}</span>
                          </div>
                          
                          {pipeline.lastRunTime !== null && (
                            <div className="flex justify-between">
                              <span className="font-medium text-neutral-700">Last Run Time:</span>
                              <span>{Math.floor(pipeline.lastRunTime / 60)}m {pipeline.lastRunTime % 60}s</span>
                            </div>
                          )}
                          
                          {pipeline.lastRunStatus && (
                            <div className="flex justify-between">
                              <span className="font-medium text-neutral-700">Last Run Status:</span>
                              <span>{pipeline.lastRunStatus}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between mt-6">
                          {pipeline.status === "paused" ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(pipeline.id, "active")}
                              className="flex-1 mr-2"
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleStatusChange(pipeline.id, "paused")}
                              className="flex-1 mr-2"
                            >
                              Pause
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedPipeline(pipeline)}
                            className="flex-1 mr-2"
                          >
                            View Code
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setPipelineToDelete(pipeline)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* New Pipeline Dialog */}
      <Dialog open={showNewPipelineDialog} onOpenChange={setShowNewPipelineDialog}>
        <DialogContent className="max-w-4xl">
          <PipelineForm connections={connections} onSuccess={() => {
            setShowNewPipelineDialog(false);
            fetchData();
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pipelineToDelete} onOpenChange={() => setPipelineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ETL pipeline &quot;{pipelineToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pipelineToDelete && handleDeletePipeline(pipelineToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View Pipeline Code Dialog */}
      <Dialog open={!!selectedPipeline} onOpenChange={() => setSelectedPipeline(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <CardHeader>
            <CardTitle>{selectedPipeline?.name} - Pipeline Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-900 p-4 rounded-md text-white text-sm font-mono whitespace-pre overflow-x-auto">
              {selectedPipeline?.pipelineCode}
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Source Description:</h3>
                <p className="text-sm text-neutral-600">{selectedPipeline?.sourceDescription}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Target Description:</h3>
                <p className="text-sm text-neutral-600">{selectedPipeline?.targetDescription}</p>
              </div>
              
              {selectedPipeline?.businessRequirements && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Business Requirements:</h3>
                  <p className="text-sm text-neutral-600">{selectedPipeline?.businessRequirements}</p>
                </div>
              )}
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}
