import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections";
import QueryOptimizer from "@/pages/query-optimizer";
import Performance from "@/pages/performance";
import Debugging from "@/pages/debugging";
import SnowflakeTest from "@/pages/snowflake-test";
import Login from "@/pages/login";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

// Connection Context
import { ConnectionProvider } from "@/hooks/use-connection";
import { ConnectionRequiredWrapper } from "@/components/connection-required-wrapper";

// New Slingshot UI Components
import Home from "@/pages/home";
import Warehouses from "@/pages/warehouses";
import CreateWarehouse from "@/pages/create-warehouse";
import QueryAdvisor from "@/pages/query-advisor";
import Recommendations from "@/pages/recommendations";
import Databases from "@/pages/databases";
import CostDashboard from "@/pages/dashboards/cost";
import PerformanceDashboard from "@/pages/dashboards/performance";
import DataObservability from "@/pages/data-observability";

function AuthRouter() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <ConnectionProvider>
      <Switch>
        {/* Connection management (always accessible) */}
        <Route path="/connections" component={() => <Connections user={user} onLogout={handleLogout} />} />
        
        {/* Routes that require an active Snowflake connection */}
        <Route path="/" component={() => (
          <ConnectionRequiredWrapper>
            <Dashboard user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/home" component={() => (
          <ConnectionRequiredWrapper>
            <Home user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/warehouses" component={() => (
          <ConnectionRequiredWrapper>
            <Warehouses user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/create-warehouse" component={() => (
          <ConnectionRequiredWrapper>
            <CreateWarehouse user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/data-observability" component={() => (
          <ConnectionRequiredWrapper>
            <DataObservability user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/recommendations" component={() => (
          <ConnectionRequiredWrapper>
            <Recommendations user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/query-advisor" component={() => (
          <ConnectionRequiredWrapper>
            <QueryAdvisor user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/databases" component={() => (
          <ConnectionRequiredWrapper>
            <Databases user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/dashboards/cost" component={() => (
          <ConnectionRequiredWrapper>
            <CostDashboard user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        <Route path="/dashboards/performance" component={() => (
          <ConnectionRequiredWrapper>
            <PerformanceDashboard user={user} onLogout={handleLogout} />
          </ConnectionRequiredWrapper>
        )} />
        
        {/* Redirect /dashboards to the cost dashboard */}
        <Route path="/dashboards" component={() => {
          setLocation("/dashboards/cost");
          return null;
        }} />
                
        <Route path="/login" component={() => <Login onLogin={setUser} />} />
        <Route component={NotFound} />
      </Switch>
    </ConnectionProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRouter />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
