import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import { Bell, LogOut, Settings, Database, ChevronDown, User } from "lucide-react";
import { Button } from "../ui/button";
import { useConnection } from "@/hooks/use-connection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MainLayoutProps = {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
};

export default function MainLayout({ children, user, onLogout }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const { activeConnection, connections, setActiveConnection } = useConnection();
  
  const handleConnectionSelect = async (connectionId: number) => {
    try {
      await setActiveConnection(connectionId);
      // No need to navigate - the current page will update with the new connection data
    } catch (error) {
      console.error("Failed to set active connection:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPath={location} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-100 h-14 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {/* Page title based on current path */}
              {location === "/" && "Dashboard"}
              {location === "/warehouses" && "Warehouse Management"}
              {location === "/databases" && "Database Explorer"}
              {location === "/recommendations" && "Recommendations"}
              {location.startsWith("/dashboards") && "Analytics Dashboard"}
              {location === "/data-observability" && "Data Observability"}
              {location === "/query-advisor" && "Query Advisor"}
              {location === "/connections" && "Connection Management"}
              {location.startsWith("/dashboards/performance") && "Performance Dashboard"}
            </h1>
          </div>
          
          {/* Connection Selector */}
          <div className="flex-1 mx-8">
            {activeConnection ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-2 h-9 max-w-[100%]"
                  >
                    <Database className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[200px]">{activeConnection.name}</span>
                    <ChevronDown className="h-4 w-4 text-blue-600 ml-auto shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  {connections.map((conn) => (
                    <DropdownMenuItem 
                      key={conn.id}
                      className={`flex items-center gap-2 ${conn.id === activeConnection.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleConnectionSelect(conn.id)}
                    >
                      <Database className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 truncate">{conn.name}</div>
                      {conn.id === activeConnection.id && <span className="text-xs text-blue-600">Active</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/connections")}>
                    <span className="text-blue-600">Manage connections</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-200"
                onClick={() => setLocation("/connections")}
              >
                <Database className="h-4 w-4 mr-2" />
                Connect to Snowflake
              </Button>
            )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 overflow-hidden">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onLogout && (
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}