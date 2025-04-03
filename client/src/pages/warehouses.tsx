import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { PlusCircle, Search, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { snowflakeClient } from "../lib/snowflake";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

type WarehousesProps = {
  user: any;
  onLogout: () => void;
};

type Warehouse = {
  id: number;
  name: string;
  org: string;
  account: string;
  size: string;
  cluster: string;
  maxMonthlyCost: number;
  isManaged: boolean;
  yourRole: string;
  state: string;
  lastUpdated: string;
};

export default function Warehouses({ user, onLogout }: WarehousesProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get warehouses from the Snowflake API using our client
        const response = await snowflakeClient.getWarehouses();
        
        if (response && Array.isArray(response)) {
          setWarehouses(response);
        } else {
          // If no data is available, use empty array
          setWarehouses([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch warehouses:", error);
        setError(error.message || "Failed to fetch warehouses from Snowflake");
        setWarehouses([]);
        
        toast({
          title: "Error fetching warehouses",
          description: error.message || "Could not retrieve warehouse data from Snowflake",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);

  const filteredWarehouses = warehouses.filter(warehouse => {
    if (searchTerm && !warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (activeTab === "managed" && !warehouse.isManaged) {
      return false;
    }
    
    if (activeTab === "unmanaged" && warehouse.isManaged) {
      return false;
    }
    
    return true;
  });

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">My Warehouses</h1>
            <p className="text-muted-foreground">
              Manage your Snowflake compute warehouses and monitor performance
            </p>
          </div>
          <div className="flex space-x-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create new warehouse
            </Button>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="w-3/4">
            <Card>
              <CardHeader className="pb-0">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-96 grid-cols-3">
                    <TabsTrigger value="all">All warehouses</TabsTrigger>
                    <TabsTrigger value="managed">Managed</TabsTrigger>
                    <TabsTrigger value="unmanaged">Unmanaged</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mt-4 text-gray-500 text-sm">
                  These are warehouses that you own, have approved or are an admin of throughout Slingshot
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 mt-2">
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by keyword..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {loading ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-2">Loading warehouse data from Snowflake...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-sm text-gray-500">
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Org</th>
                          <th className="text-left py-2 px-3 font-medium">Account</th>
                          <th className="text-left py-2 px-3 font-medium">Max Monthly Cost</th>
                          <th className="text-left py-2 px-3 font-medium">Managed</th>
                          <th className="text-left py-2 px-3 font-medium">Last Updated</th>
                          <th className="text-left py-2 px-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWarehouses.length > 0 ? (
                          filteredWarehouses.map((warehouse) => (
                            <tr key={warehouse.id} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium text-blue-600">
                                {warehouse.name}
                              </td>
                              <td className="py-2 px-3">{warehouse.org}</td>
                              <td className="py-2 px-3">{warehouse.account}</td>
                              <td className="py-2 px-3">${warehouse.maxMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3">
                                {warehouse.isManaged ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Y</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">N</Badge>
                                )}
                              </td>
                              <td className="py-2 px-3">{warehouse.lastUpdated}</td>
                              <td className="py-2 px-3">
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                  Redesign
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-gray-500">
                              {searchTerm || activeTab !== "all" 
                                ? "No warehouses found matching your criteria" 
                                : "No warehouses found in your Snowflake account"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customize tags in Slingshot</CardTitle>
                <CardDescription>
                  We tag data from your Snowflake account based on custom categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                  Go to Slingshot Tags
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}