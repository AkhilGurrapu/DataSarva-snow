import React from "react";
import { useLocation, Link } from "wouter";
import { LogOut, User, Bell, Settings, Database } from "lucide-react";
import Sidebar from "./layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";
import { useConnection } from "@/hooks/use-connection";
import { Badge } from "@/components/ui/badge";

type AppShellProps = {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
};

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const [location] = useLocation();
  const { activeConnection, connections } = useConnection();
  
  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPath={location} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-100 h-14 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {/* Page title based on current path */}
              {location === "/" && "Dashboard"}
              {location === "/warehouses" && "Warehouse Management"}
              {location === "/databases" && "Database Explorer"}
              {location === "/recommendations" && "Recommendations"}
              {location.startsWith("/dashboards") && "Analytics Dashboard"}
              {location === "/data-observability" && "Data Observability"}
              {location === "/query-advisor" && "Query Advisor"}
              {location === "/connections" && "Connection Management"}
              {location === "/error-analyzer" && "Error Analyzer"}
              {location === "/performance" && "Performance"}
            </h1>
          </div>
          
          {/* Connection Selector */}
          <div className="flex-1 mx-8">
            {activeConnection ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-md px-3 py-1.5 flex items-center gap-2 h-9 max-w-full"
                  >
                    <Database className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[200px]">{activeConnection.name}</span>
                    <span className="ml-auto text-blue-600">▼</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  {connections.map((conn) => (
                    <DropdownMenuItem 
                      key={conn.id}
                      className={`flex items-center gap-2 ${conn.id === activeConnection.id ? 'bg-blue-50' : ''}`}
                    >
                      <Database className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 truncate">{conn.name}</div>
                      {conn.id === activeConnection.id && <span className="text-xs text-blue-600">Active</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button 
                className="bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-md px-3 py-1.5 flex items-center gap-2"
              >
                <Database className="h-4 w-4 text-blue-600" />
                Snowflake
              </button>
            )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user && (
                      <>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email || "user@example.com"}</p>
                      </>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}