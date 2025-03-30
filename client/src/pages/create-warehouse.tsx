import { useState } from "react";
import MainLayout from "../components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

type CreateWarehouseProps = {
  user: any;
  onLogout: () => void;
};

export default function CreateWarehouse({ user, onLogout }: CreateWarehouseProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    snowflakeAccount: "",
    warehouseSize: "",
    cluster: "",
    maxCost: "",
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would normally send the data to the server
    setLocation("/warehouses");
  };

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          className="text-gray-600 hover:text-gray-900 p-0"
          onClick={() => setLocation("/warehouses")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to warehouses
        </Button>
      </div>
      
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-medium text-gray-800">Create warehouse details</h1>
        <p className="text-gray-600 text-sm">
          To get started, select an Organization, Snowflake account, and general warehouse details
        </p>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("organization", value)}
                    required
                  >
                    <SelectTrigger id="organization" className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global-payments">Global Payments</SelectItem>
                      <SelectItem value="nexus-6">Nexus 6</SelectItem>
                      <SelectItem value="tyrell-corp">Tyrell Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warehouseName">Warehouse name</Label>
                  <Input
                    id="warehouseName"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter warehouse name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="snowflakeAccount">Snowflake Account</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("snowflakeAccount", value)}
                    required
                  >
                    <SelectTrigger id="snowflakeAccount" className="w-full">
                      <SelectValue placeholder="Select Snowflake account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmrbstpl_sc_1">GMRBSTPL_SC_1</SelectItem>
                      <SelectItem value="gmrbstpl_sc_2">GMRBSTPL_SC_2</SelectItem>
                      <SelectItem value="gmrbstpl_prod">GMRBSTPL_PROD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warehouseSize">Warehouse size</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("warehouseSize", value)}
                    required
                  >
                    <SelectTrigger id="warehouseSize" className="w-full">
                      <SelectValue placeholder="Select warehouse size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x-small">X-Small</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="x-large">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cluster">Cluster</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("cluster", value)}
                    required
                  >
                    <SelectTrigger id="cluster" className="w-full">
                      <SelectValue placeholder="Select cluster sizing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min1-max1">Min 1, Max 1</SelectItem>
                      <SelectItem value="min1-max2">Min 1, Max 2</SelectItem>
                      <SelectItem value="min1-max3">Min 1, Max 3</SelectItem>
                      <SelectItem value="min2-max4">Min 2, Max 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxCost">Maximum monthly cost (USD)</Label>
                  <Input
                    id="maxCost"
                    name="maxCost"
                    value={formData.maxCost}
                    onChange={handleChange}
                    placeholder="Enter maximum monthly cost"
                    type="number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter warehouse description"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation("/warehouses")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Warehouse
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}