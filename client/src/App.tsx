import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections";
import QueryOptimizer from "@/pages/query-optimizer";
import EtlWorkflows from "@/pages/etl-workflows";
import Performance from "@/pages/performance";
import Debugging from "@/pages/debugging";
import SnowflakeTest from "@/pages/snowflake-test";
import Login from "@/pages/login";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

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
      <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/connections" component={() => <Connections user={user} onLogout={handleLogout} />} />
      <Route path="/query-optimizer" component={() => <QueryOptimizer user={user} onLogout={handleLogout} />} />
      <Route path="/etl-workflows" component={() => <EtlWorkflows user={user} onLogout={handleLogout} />} />
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
