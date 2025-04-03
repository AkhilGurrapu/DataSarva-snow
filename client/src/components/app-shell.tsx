import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { LogOut, User, Bell, Settings, Database, ChevronDown, Snowflake, Sparkles } from "lucide-react";
import Sidebar from "./layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";
import { useConnection } from "@/hooks/use-connection";

type AppShellProps = {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
};

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const [location] = useLocation();
  const { activeConnection, connections, setActiveConnection } = useConnection();
  
  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };
  
  const handleConnectionSelect = async (connectionId: number) => {
    try {
      await setActiveConnection(connectionId);
    } catch (error) {
      console.error("Failed to set active connection:", error);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-56 h-full bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="py-6 px-3 flex flex-col h-full">
          <div className="px-3 flex items-center mb-8">
            <div className="w-9 h-9 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold mr-2 shadow-sm">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                Snow<span className="text-gray-800">Sarva</span>
                <Sparkles className="h-3 w-3 ml-1 text-yellow-500" />
              </h2>
              <p className="text-[10px] leading-none text-gray-500">Powered by DataSarva</p>
            </div>
          </div>
          
          {/* Rest of sidebar */}
          <Sidebar currentPath={location} />
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            {/* Page title based on current path */}
            <div className="text-2xl font-semibold text-gray-800 dark:text-white">
              {location === "/" && "Dashboard"}
              {location === "/warehouses" && "Warehouse Management"}
              {location === "/databases" && "Database Explorer"}
              {location === "/recommendations" && "Recommendations"}
              {location.startsWith("/dashboards") && "Analytics Dashboard"}
              {location === "/data-observability" && "Data Observability"}
              {location === "/query-advisor" && "Query Advisor"}
              {location === "/connections" && "Connection Management"}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Selector */}
              {!location.includes("/connections") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-2 h-9"
                    >
                      <Database className="h-4 w-4 text-blue-600" />
                      <span>{activeConnection ? activeConnection.name : "Snowflake"}</span>
                      <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px]">
                    {connections.map((conn) => (
                      <DropdownMenuItem 
                        key={conn.id}
                        className={`flex items-center justify-between py-2 ${conn.isActive ? 'bg-blue-50' : ''}`}
                        onClick={() => handleConnectionSelect(conn.id)}
                      >
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{conn.name}</span>
                        </div>
                        {conn.isActive && (
                          <span className="text-blue-600 text-sm">Active</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/connections">
                        <a className="w-full">Manage connections</a>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
                <Bell className="h-5 w-5" />
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
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}