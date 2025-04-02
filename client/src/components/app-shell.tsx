import React from "react";
import { useLocation, Link } from "wouter";
import { LogOut, User, Bell, Settings } from "lucide-react";
import Sidebar from "./layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";

type AppShellProps = {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
};

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const [location] = useLocation();
  
  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPath={location} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
          <div className="text-xl font-semibold text-gray-800 dark:text-white">
            {/* Page title based on current path */}
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
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}