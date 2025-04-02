import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  RefreshCw, 
  AlertTriangle, 
  BarChart4,
  Eye,
  Filter,
  Search,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { openaiClient } from "@/lib/openai";

interface AnomalyDetectorProps {
  connectionId: number;
  tables: any[];
}

export function AnomalyDetector({ connectionId, tables }: AnomalyDetectorProps) {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const detectAnomalies = async () => {
    if (!selectedTable) {
      toast({
        title: "Table Required",
        description: "Please select a table to detect anomalies.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await openaiClient.detectAnomalies(
        connectionId,
        selectedTable
      );
      
      setAnomalyResult(result);
      
      toast({
        title: "Anomaly Detection Complete",
        description: `Completed anomaly detection for ${selectedTable}`,
      });
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      toast({
        title: "Error",
        description: "Failed to detect anomalies.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  function getSeverityBadge(severity: string) {
    switch (severity?.toLowerCase()) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  function getAnomalyIcon(type: string) {
    switch (type?.toLowerCase()) {
      case "outlier":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "sudden change":
      case "spike":
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      case "drop":
        return <TrendingDown className="w-5 h-5 text-blue-600" />;
      case "pattern break":
        return <BarChart4 className="w-5 h-5 text-purple-600" />;
      case "threshold breach":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "missing values":
        return <Search className="w-5 h-5 text-gray-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  }

  function getHealthProgress(healthScore: number) {
    if (healthScore >= 80) return "bg-green-500";
    if (healthScore >= 60) return "bg-yellow-500";
    return "bg-red-500";
  }

  // Generate mock anomaly data for initial display
  const mockAnomalies = [
    {
      id: 1,
      column: "order_total",
      type: "outlier",
      description: "Unusually high order values detected",
      severity: "high",
      detectedAt: "2023-05-15T14:32:00Z",
      affectedRows: 24,
      recommendation: "Investigate transactions above $10,000"
    },
    {
      id: 2,
      column: "user_signups",
      type: "drop",
      description: "Significant drop in daily user signups",
      severity: "medium",
      detectedAt: "2023-05-14T09:15:00Z",
      affectedRows: 0,
      recommendation: "Check registration process and marketing campaigns"
    },
    {
      id: 3,
      column: "delivery_time",
      type: "pattern break",
      description: "Delivery times no longer follow typical weekly patterns",
      severity: "low",
      detectedAt: "2023-05-13T11:45:00Z",
      affectedRows: 156,
      recommendation: "Review logistic processes for recent changes"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Anomaly Detection</CardTitle>
          <CardDescription>
            Identify unusual patterns and outliers in your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Select Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table: any, index: number) => (
                    <SelectItem 
                      key={index} 
                      value={table.name || table.TABLE_NAME || `table-${index}`}
                    >
                      {table.name || table.TABLE_NAME || `Table ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={detectAnomalies} 
                disabled={loading || !selectedTable}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>Detect Anomalies</>
                )}
              </Button>
            </div>
          </div>
          
          {anomalyResult && (
            <Alert className={anomalyResult.anomaliesFound ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}>
              {anomalyResult.anomaliesFound ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertTitle>
                {anomalyResult.anomaliesFound 
                  ? `${anomalyResult.anomalies?.length || 0} anomalies detected` 
                  : "No anomalies detected"}
              </AlertTitle>
              <AlertDescription>
                {anomalyResult.anomaliesFound 
                  ? "The system has found some unusual patterns in your data." 
                  : "Your data appears normal with no significant anomalies."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>
              Unusual patterns and outliers in your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(anomalyResult?.anomalies || mockAnomalies).length > 0 ? (
              <div className="space-y-4">
                {(anomalyResult?.anomalies || mockAnomalies).map((anomaly: any, index: number) => (
                  <div key={anomaly.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getAnomalyIcon(anomaly.type)}
                        <div>
                          <h4 className="font-medium">{anomaly.column}</h4>
                          <p className="text-sm text-muted-foreground">{anomaly.type}</p>
                        </div>
                      </div>
                      {getSeverityBadge(anomaly.severity)}
                    </div>
                    
                    <p className="text-sm">{anomaly.description}</p>
                    
                    {anomaly.affectedRows > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{anomaly.affectedRows}</span> rows affected
                      </div>
                    )}
                    
                    {anomaly.recommendation && (
                      <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No anomalies have been detected yet. Run the detector to scan for unusual patterns.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Health Score</CardTitle>
            <CardDescription>
              Overall data quality assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {anomalyResult?.healthScore || 85}%
                    </span>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#e5e7eb" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke={anomalyResult?.healthScore >= 80 ? "#10b981" : anomalyResult?.healthScore >= 60 ? "#f59e0b" : "#ef4444"} 
                      strokeWidth="8"
                      strokeDasharray={`${2.5 * Math.PI * 40 * (anomalyResult?.healthScore || 85) / 100} ${2.5 * Math.PI * 40 * (100 - (anomalyResult?.healthScore || 85)) / 100}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Data health assessment
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recent anomalies</span>
                  <span className="font-medium">
                    {anomalyResult?.anomaliesCount || mockAnomalies.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last scan</span>
                  <span className="text-sm text-muted-foreground">
                    {anomalyResult?.lastScanTime || "Today, 10:45 AM"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Critical alerts</span>
                  <span className="font-medium text-red-600">
                    {anomalyResult?.criticalAnomalies || 1}
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Configure Monitoring
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}