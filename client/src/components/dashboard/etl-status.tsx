import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type EtlPipeline = {
  id: number;
  userId: number;
  connectionId: number;
  name: string;
  description: string;
  schedule: string;
  status: string;
  lastRunTime: number | null;
  lastRunStatus: string | null;
};

type EtlStatusProps = {
  className?: string;
};

export default function EtlStatus({ className = "" }: EtlStatusProps) {
  const [pipelines, setPipelines] = useState<EtlPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPipelines() {
      try {
        setLoading(true);
        const data = await snowflakeClient.getPipelines();
        setPipelines(data);
      } catch (error) {
        console.error("Failed to fetch pipelines:", error);
        toast({
          title: "Failed to load ETL pipelines",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPipelines();
  }, [toast]);

  const handleStatusChange = async (id: number, newStatus: string) => {
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
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
            Healthy
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning bg-opacity-10 text-warning">
            Warning
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error bg-opacity-10 text-error">
            Failed
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-300 text-neutral-800">
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-300 text-neutral-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <Card className={`shadow ${className}`}>
      <div className="px-6 py-5 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">ETL Pipeline Status</h2>
          <Link href="/etl-workflows/new">
            <Button size="sm">
              <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Pipeline
            </Button>
          </Link>
        </div>
      </div>
      
      <CardContent className="px-6 py-5 space-y-4">
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            No ETL pipelines found. Create your first pipeline to get started.
          </div>
        ) : (
          pipelines.slice(0, 4).map((pipeline) => (
            <div key={pipeline.id} className="bg-neutral-50 rounded-lg p-4">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-neutral-900">{pipeline.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">{pipeline.schedule}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(pipeline.status)}
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                {pipeline.status === "active" && (
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-primary">
                          {pipeline.lastRunTime ? `Last run: Completed in ${Math.floor(pipeline.lastRunTime / 60)}m ${pipeline.lastRunTime % 60}s` : "Ready to run"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary">
                          100%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-primary-light bg-opacity-30">
                      <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                    </div>
                  </div>
                )}
                
                {pipeline.status === "warning" && (
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-warning">
                          {pipeline.lastRunTime ? `Last run: Completed in ${Math.floor(pipeline.lastRunTime / 60)}m ${pipeline.lastRunTime % 60}s (slowing down)` : "Warning: Performance degrading"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-warning">
                          100%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-warning bg-opacity-30">
                      <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-warning"></div>
                    </div>
                  </div>
                )}
                
                {pipeline.status === "failed" && (
                  <div className="mt-3 text-xs text-error">
                    Error: {pipeline.lastRunStatus || "Pipeline execution failed"}
                    <div className="mt-2">
                      <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleStatusChange(pipeline.id, "active")}>
                        Fix Issue
                      </Button>
                    </div>
                  </div>
                )}
                
                {pipeline.status === "paused" && (
                  <div className="mt-3 text-xs text-neutral-500">
                    Pipeline paused by user
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange(pipeline.id, "active")}>
                        Resume
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-3 bg-neutral-50 rounded-b-lg border-t border-neutral-200 text-center">
        <Link href="/etl-workflows" className="text-sm font-medium text-primary hover:text-primary-dark w-full">
          View all pipelines
        </Link>
      </CardFooter>
    </Card>
  );
}
