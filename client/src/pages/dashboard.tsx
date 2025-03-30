import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import StatCard from "@/components/dashboard/stat-card";
import PerformanceChart from "@/components/dashboard/performance-chart";
import RecentActivity from "@/components/dashboard/recent-activity";
import EtlStatus from "@/components/dashboard/etl-status";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

type DashboardProps = {
  user: any;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    queriesOptimized: 0,
    costSavings: 0,
    etlPipelines: { total: 0, active: 0, paused: 0 },
    errorsDetected: 0
  });
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Get dashboard stats
        const dashboardStats = await snowflakeClient.getDashboardStats();
        setStats(dashboardStats);
        
        // Get connections to show active one
        const connections = await snowflakeClient.getConnections();
        const active = connections.find((c: any) => c.isActive);
        if (active) {
          setActiveConnection(active.name);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error loading dashboard",
          description: "Failed to load some dashboard components",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - only directly visible on desktop */}
      <div className={`${isMobile ? 'block lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300' : 'hidden'} ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}>
        <div onClick={e => e.stopPropagation()}>
          <Sidebar 
            activeConnection={activeConnection} 
            onMobileSidebarClose={() => setSidebarOpen(false)} 
            isMobile={true} 
          />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeConnection={activeConnection} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar 
          title="Dashboard" 
          user={user} 
          onLogout={onLogout} 
          onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              {/* Overview Stats */}
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Queries Optimized"
                      value={stats.queriesOptimized}
                      change="+12% vs last week"
                      icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      }
                      iconBgColor="bg-primary-light"
                    />
                    
                    <StatCard
                      title="Cost Savings"
                      value={`$${stats.costSavings.toFixed(2)}`}
                      change="+23% vs last month"
                      icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8a2.996 2.996 0 0 0-2.599 1M12 16c1.657 0 3-.895 3-2s-1.343-2-3-2-3-.895-3-2 1.343-2 3-2" />
                        </svg>
                      }
                      iconBgColor="bg-secondary-light"
                    />
                    
                    <StatCard
                      title="ETL Pipelines"
                      value={stats.etlPipelines.total}
                      change={`${stats.etlPipelines.active} active, ${stats.etlPipelines.paused} paused`}
                      icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      }
                      iconBgColor="bg-accent-light"
                    />
                    
                    <StatCard
                      title="Errors Detected"
                      value={stats.errorsDetected}
                      change="+2 vs yesterday"
                      icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      }
                      iconBgColor="bg-warning"
                    />
                  </div>

                  {/* Performance Chart */}
                  <div className="mt-8">
                    <PerformanceChart />
                  </div>
                  
                  {/* Recent Activity and ETL Status */}
                  <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <RecentActivity />
                    <EtlStatus />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
