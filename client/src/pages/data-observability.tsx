import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useConnection } from "@/hooks/use-connection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, AlertTriangle, CheckCircle, FileText, Database, Clock, RefreshCw } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { FreshnessMonitor } from "@/components/data-monitoring/freshness-monitor";
import { AnomalyDetector } from "@/components/data-monitoring/anomaly-detector";

// API Clients
import { snowflakeClient } from "@/lib/snowflake";
import { openaiClient } from "@/lib/openai";

type DataObservabilityProps = {
  user: any;
  onLogout: () => void;
};

export default function DataObservability({ user, onLogout }: DataObservabilityProps) {
  const { toast } = useToast();
  const { activeConnection } = useConnection();
  const [activeTab, setActiveTab] = useState("data-quality");
  const [loadingReport, setLoadingReport] = useState(false);
  const [qualityReport, setQualityReport] = useState<any>(null);
  
  // Fetch tables from connection
  const { data: tablesData = [], isLoading: tablesLoading, error: tablesError } = useQuery({
    queryKey: ['/api/snowflake/account-usage/tables', activeConnection?.id],
    enabled: !!activeConnection,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Ensure tables is always an array
  const tables = Array.isArray(tablesData) ? tablesData : [];
  
  async function generateHealthReport() {
    if (!activeConnection) return;
    
    try {
      setLoadingReport(true);
      
      // Get the first available database from the list of tables
      let databaseName;
      if (Array.isArray(tables) && tables.length > 0) {
        const table = tables[0];
        // Try to extract database name from the table info
        if (table && typeof table === 'object') {
          if ('database' in table) {
            databaseName = table.database;
          } else if ('DATABASE_NAME' in table) {
            databaseName = table.DATABASE_NAME;
          }
        }
      }
      
      const result = await openaiClient.getDataQualityScore(activeConnection.id, databaseName);
      setQualityReport(result);
      
      toast({
        title: "Report Generated",
        description: "Data quality report has been generated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({
        title: "Error",
        description: "Failed to generate data quality report.",
        variant: "destructive",
      });
    } finally {
      setLoadingReport(false);
    }
  }
  
  function getHealthScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }
  
  function getScoreProgressColor(score: number) {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  }
  
  return (
    <AppShell user={user} onLogout={onLogout}>
      <div className="container py-6 space-y-6">
        
        {!activeConnection ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No active connection</AlertTitle>
            <AlertDescription>
              Please connect to a Snowflake account to use data observability features.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
              <TabsTrigger value="freshness">Data Freshness</TabsTrigger>
              <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data-quality" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Data Quality Score</CardTitle>
                    <CardDescription>
                      Overall health of your data environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {qualityReport ? (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className={`text-4xl font-bold ${getHealthScoreColor(qualityReport.overallScore)}`}>
                            {qualityReport.overallScore.toFixed(0)}%
                          </span>
                          <Progress 
                            value={qualityReport.overallScore} 
                            className={`w-full ${getScoreProgressColor(qualityReport.overallScore)}`}
                          />
                          <span className="text-sm text-muted-foreground">
                            Based on {qualityReport.tableScores?.length || 0} tables
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <Database className="h-10 w-10 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground text-center">
                          Generate a report to see your data quality score
                        </p>
                        <Button 
                          onClick={generateHealthReport} 
                          disabled={loadingReport}
                          size="sm"
                        >
                          {loadingReport ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate Report"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {qualityReport && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Table Count</CardTitle>
                        <CardDescription>
                          Tables analyzed in your environment
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-bold">
                            {qualityReport.tableScores?.length || 0}
                          </span>
                          <FileText className="h-8 w-8 text-muted-foreground opacity-70" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Health Status</CardTitle>
                        <CardDescription>
                          Overall data health assessment
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          {qualityReport.overallScore >= 80 ? (
                            <>
                              <CheckCircle className="h-8 w-8 text-green-500" />
                              <div>
                                <p className="font-medium">Healthy</p>
                                <p className="text-sm text-muted-foreground">
                                  Your data is in good condition
                                </p>
                              </div>
                            </>
                          ) : qualityReport.overallScore >= 60 ? (
                            <>
                              <AlertTriangle className="h-8 w-8 text-yellow-500" />
                              <div>
                                <p className="font-medium">Needs Attention</p>
                                <p className="text-sm text-muted-foreground">
                                  Some issues detected
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-8 w-8 text-red-500" />
                              <div>
                                <p className="font-medium">Critical</p>
                                <p className="text-sm text-muted-foreground">
                                  Significant data quality issues detected
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
              
              {qualityReport && qualityReport.tableScores && qualityReport.tableScores.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Table Quality Scores</CardTitle>
                    <CardDescription>
                      Quality score breakdown by table
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {qualityReport.tableScores.map((table: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{table.tableName}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {table.schema}
                              </span>
                            </div>
                            <Badge
                              variant="outline" 
                              className={
                                table.qualityScore >= 80 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                table.qualityScore >= 60 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                                'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {table.qualityScore.toFixed(0)}%
                            </Badge>
                          </div>
                          <Progress 
                            value={table.qualityScore} 
                            className={`h-2 ${getScoreProgressColor(table.qualityScore)}`}
                          />
                          <Separator className="my-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="freshness" className="space-y-4">
              {tablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading tables...</span>
                </div>
              ) : tablesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error loading tables</AlertTitle>
                  <AlertDescription>
                    Failed to load tables from your Snowflake account.
                  </AlertDescription>
                </Alert>
              ) : (
                <FreshnessMonitor 
                  connectionId={activeConnection.id} 
                  tables={tables as any[]} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="anomalies" className="space-y-4">
              {tablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading tables...</span>
                </div>
              ) : tablesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error loading tables</AlertTitle>
                  <AlertDescription>
                    Failed to load tables from your Snowflake account.
                  </AlertDescription>
                </Alert>
              ) : (
                <AnomalyDetector 
                  connectionId={activeConnection.id} 
                  tables={tables as any[]} 
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}