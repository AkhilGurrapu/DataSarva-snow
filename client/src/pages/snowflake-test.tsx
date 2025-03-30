import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/queryClient";
import SiteLayout from "@/components/layout/site-layout";

type SnowflakeTestProps = {
  user: any;
  onLogout: () => void;
};

export default function SnowflakeTest({ user, onLogout }: SnowflakeTestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any[]>([]);

  async function fetchAccountUsageTables() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/snowflake/account-usage/tables');
      
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching Snowflake data');
      console.error('Error fetching Snowflake data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout user={user} onLogout={onLogout} currentPath="/snowflake-test">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Snowflake Connection Test</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Account Usage Tables</CardTitle>
            <CardDescription>
              Query the SNOWFLAKE.ACCOUNT_USAGE.TABLES view to see a list of tables in your Snowflake account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchAccountUsageTables} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? <Spinner className="mr-2" /> : null}
              Fetch Account Usage Tables
            </Button>
            
            {error && (
              <div className="p-4 mb-4 text-sm bg-red-100 border border-red-200 text-red-800 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {result.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schema
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Database
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Row Count
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size (bytes)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.map((table, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">{table.TABLE_NAME}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{table.TABLE_SCHEMA}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{table.TABLE_CATALOG}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{table.ROW_COUNT?.toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{table.BYTES?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}