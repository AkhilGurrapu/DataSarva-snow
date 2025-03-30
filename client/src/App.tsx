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

// New Slingshot UI Components
import Home from "@/pages/home";
import Warehouses from "@/pages/warehouses";
import CreateWarehouse from "@/pages/create-warehouse";
import QueryAdvisor from "@/pages/query-advisor";
import Recommendations from "@/pages/recommendations";
import CostDashboard from "@/pages/dashboards/cost";
import PerformanceDashboard from "@/pages/dashboards/performance";

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
    <Switch>
      {/* Slingshot UI Routes */}
      <Route path="/" component={() => <Home user={user} onLogout={handleLogout} />} />
      <Route path="/warehouses" component={() => <Warehouses user={user} onLogout={handleLogout} />} />
      <Route path="/create-warehouse" component={() => <CreateWarehouse user={user} onLogout={handleLogout} />} />
      <Route path="/recommendations" component={() => <Recommendations user={user} onLogout={handleLogout} />} />
      <Route path="/query-advisor" component={() => <QueryAdvisor user={user} onLogout={handleLogout} />} />
      <Route path="/dashboards/cost" component={() => <CostDashboard user={user} onLogout={handleLogout} />} />
      <Route path="/dashboards/performance" component={() => <PerformanceDashboard user={user} onLogout={handleLogout} />} />
      
      {/* Legacy UI Routes */}
      <Route path="/old-dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/connections" component={() => <Connections user={user} onLogout={handleLogout} />} />
      <Route path="/query-optimizer" component={() => <QueryOptimizer user={user} onLogout={handleLogout} />} />
      <Route path="/performance" component={() => <Performance user={user} onLogout={handleLogout} />} />
      <Route path="/debugging" component={() => <Debugging user={user} onLogout={handleLogout} />} />
      <Route path="/snowflake-test" component={() => <SnowflakeTest user={user} onLogout={handleLogout} />} />
      <Route path="/login" component={() => <Login onLogin={setUser} />} />
      <Route component={NotFound} />
    </Switch>
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
