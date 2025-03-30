import { useState, useEffect } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiRequest } from "../lib/queryClient";
import { Badge } from "../components/ui/badge";
import { PlusCircle, Search } from "lucide-react";
import { Link } from "wouter";

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // This would be a real API call in production
        // For now we'll create mock data that matches the mockups
        const mockWarehouses: Warehouse[] = [
          {
            id: 1,
            name: "FINANCE_PROD_PAYMENTS",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 22235.54,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 2,
            name: "BUSINESS_X_DEPT_XL",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 5020.43,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 3,
            name: "BUSINESS_X_WH",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 12345.14,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 4,
            name: "BUSINESS_X_CUSTOMERNAME",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 12262.16,
            isManaged: false,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 5,
            name: "RARE_Q_DELTA",
            org: "Nexus 6",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 16115.34,
            isManaged: false,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 6,
            name: "CMPT1_USRPC_WH",
            org: "Nexus 6",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 9349.77,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 7,
            name: "BUSINESS_D_CANADA",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 10020.95,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 8,
            name: "DIST_T_WH",
            org: "Nexus 6",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 5292.43,
            isManaged: false,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 9,
            name: "COMP_Q_DIA",
            org: "Nexus 6",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 10343.94,
            isManaged: true,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          },
          {
            id: 10,
            name: "SQL_WH",
            org: "Global Payments",
            account: "GMRBSTPL_SC_1",
            size: "X-SMALL",
            cluster: "Min 1 Max 1",
            maxMonthlyCost: 2235.54,
            isManaged: false,
            yourRole: "Owner",
            state: "On",
            lastUpdated: "2024-02-27"
          }
        ];
        
        setWarehouses(mockWarehouses);
      } catch (error) {
        console.error("Failed to fetch warehouses:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

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
          <h1 className="text-2xl font-medium text-gray-800">My warehouses</h1>
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
                      {filteredWarehouses.map((warehouse) => (
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
                      ))}
                      {filteredWarehouses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-500">
                            No warehouses found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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