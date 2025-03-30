import { useLocation } from "wouter";
import { useConnection } from "@/hooks/use-connection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ConnectionRequiredWrapperProps {
  children: ReactNode;
}

export function ConnectionRequiredWrapper({ children }: ConnectionRequiredWrapperProps) {
  const { activeConnection, loading, hasConnections } = useConnection();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeConnection) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Snowflake Connection Required
            </CardTitle>
            <CardDescription>
              {hasConnections 
                ? "You need to activate a Snowflake connection to use this feature."
                : "You need to set up a Snowflake connection to use this application."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center p-4 mb-4 bg-blue-50 rounded-md">
              <Database className="h-12 w-12 text-blue-500 mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                {hasConnections 
                  ? "You have connections configured, but none are currently active. Please go to the connections page to activate one."
                  : "SnowflakeDataSuite requires a connection to a Snowflake account to fetch data and provide analytics."}
              </p>
              <Button 
                onClick={() => navigate("/connections")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {hasConnections ? "Manage Connections" : "Set Up Connection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}