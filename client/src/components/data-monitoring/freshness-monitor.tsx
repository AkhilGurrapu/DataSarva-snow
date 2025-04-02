import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { openaiClient } from "@/lib/openai";

interface FreshnessMonitorProps {
  connectionId: number;
  tables: any[];
}

export function FreshnessMonitor({ connectionId, tables }: FreshnessMonitorProps) {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("daily");
  const [loading, setLoading] = useState<boolean>(false);
  const [freshnessResult, setFreshnessResult] = useState<any>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTableExpansion = (tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const frequencyOptions = [
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" }
  ];

  const checkFreshness = async () => {
    if (!selectedTable) {
      toast({
        title: "Table Required",
        description: "Please select a table to check data freshness.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await openaiClient.checkDataFreshness(
        connectionId,
        selectedTable,
        selectedFrequency
      );
      
      setFreshnessResult(result);
      
      toast({
        title: "Freshness Check Complete",
        description: `Data freshness check completed for ${selectedTable}`,
      });
    } catch (error) {
      console.error("Error checking data freshness:", error);
      toast({
        title: "Error",
        description: "Failed to check data freshness.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFreshnessStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "current":
        return {
          color: "text-green-600",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          badge: <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
        };
      case "stale":
        return {
          color: "text-yellow-600",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          badge: <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Stale</Badge>
        };
      case "outdated":
        return {
          color: "text-red-600",
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          badge: <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Outdated</Badge>
        };
      default:
        return {
          color: "text-gray-600",
          icon: <Clock className="w-5 h-5 text-gray-600" />,
          badge: <Badge variant="outline">Unknown</Badge>
        };
    }
  };

  const getExpectedUpdateText = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case "hourly": return "Expected to update every hour";
      case "daily": return "Expected to update every day";
      case "weekly": return "Expected to update every week";
      case "monthly": return "Expected to update every month";
      case "quarterly": return "Expected to update every quarter";
      default: return "Update frequency unknown";
    }
  };
  
  const getProgressValue = (freshnessPercentage: number) => {
    // If we have a specific percentage, use it
    if (typeof freshnessPercentage === 'number') {
      return freshnessPercentage;
    }
    
    // Otherwise estimate based on status
    switch (freshnessResult?.status?.toLowerCase()) {
      case "current": return 90;
      case "stale": return 50;
      case "outdated": return 20;
      default: return 0;
    }
  };

  const getMockTableData = () => {
    if (!tables || tables.length === 0) {
      return [
        { 
          id: "customers",
          name: "CUSTOMERS", 
          schema: "PUBLIC", 
          lastUpdated: "2 hours ago", 
          status: "current",
          expectedFrequency: "daily" 
        },
        { 
          id: "orders",
          name: "ORDERS", 
          schema: "PUBLIC", 
          lastUpdated: "5 days ago", 
          status: "stale",
          expectedFrequency: "daily" 
        },
        { 
          id: "products",
          name: "PRODUCTS", 
          schema: "PUBLIC", 
          lastUpdated: "45 days ago", 
          status: "outdated",
          expectedFrequency: "weekly" 
        }
      ];
    }
    
    // Use actual tables but add dummy freshness data
    return tables.slice(0, 5).map((table: any, index: number) => {
      const statuses = ["current", "stale", "outdated"];
      const frequencies = ["hourly", "daily", "weekly", "monthly"];
      const lastUpdatedOptions = ["2 hours ago", "1 day ago", "3 days ago", "1 week ago", "1 month ago"];
      
      return {
        id: `table-${index}`,
        name: table.name || table.TABLE_NAME,
        schema: table.schema_name || table.TABLE_SCHEMA || "PUBLIC",
        lastUpdated: lastUpdatedOptions[Math.floor(Math.random() * lastUpdatedOptions.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        expectedFrequency: frequencies[Math.floor(Math.random() * frequencies.length)]
      };
    });
  };

  const mockTableData = getMockTableData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Freshness Monitor</CardTitle>
          <CardDescription>
            Check if your data is up-to-date based on expected update frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Update Frequency</label>
              <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={checkFreshness} 
                disabled={loading || !selectedTable}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>Check Freshness</>
                )}
              </Button>
            </div>
          </div>
          
          {freshnessResult && (
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex items-center space-x-2">
                    {getFreshnessStatus(freshnessResult.status).icon}
                    <span className={`font-semibold ${getFreshnessStatus(freshnessResult.status).color}`}>
                      {freshnessResult.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Updated</p>
                  <span>{freshnessResult.lastUpdated || "Unknown"}</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Expected Update</p>
                  <span>{getExpectedUpdateText(selectedFrequency)}</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Freshness</span>
                  <span>{freshnessResult.freshnessPercentage || "N/A"}%</span>
                </div>
                <Progress 
                  value={getProgressValue(freshnessResult.freshnessPercentage)} 
                  className={`
                    ${freshnessResult.status?.toLowerCase() === 'current' ? 'bg-green-600' : ''}
                    ${freshnessResult.status?.toLowerCase() === 'stale' ? 'bg-yellow-600' : ''}
                    ${freshnessResult.status?.toLowerCase() === 'outdated' ? 'bg-red-600' : ''}
                  `}
                />
              </div>
              
              {freshnessResult.recommendations && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {typeof freshnessResult.recommendations === 'string' ? (
                      <li className="text-sm">{freshnessResult.recommendations}</li>
                    ) : (
                      freshnessResult.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm">• {rec}</li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Freshness Overview</CardTitle>
          <CardDescription>
            Monitoring of your most important tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Update</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTableData.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.schema}</TableCell>
                  <TableCell>{table.lastUpdated}</TableCell>
                  <TableCell>
                    {getFreshnessStatus(table.status).badge}
                  </TableCell>
                  <TableCell>{getExpectedUpdateText(table.expectedFrequency)}</TableCell>
                  <TableCell>
                    <CollapsibleTrigger
                      asChild
                      onClick={() => toggleTableExpansion(table.id)}
                    >
                      <Button variant="ghost" size="sm">
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${expandedTables[table.id] ? 'rotate-180' : ''}`} 
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}