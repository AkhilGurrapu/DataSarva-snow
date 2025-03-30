import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import { Bell, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";

type MainLayoutProps = {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
};

export default function MainLayout({ children, user, onLogout }: MainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPath={location} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-100 h-14 flex items-center justify-between px-6">
          <div className="hidden md:block font-medium text-gray-700">
            SnowflakeDataSuite
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-2">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-700 mr-3 hidden md:inline-block">
                {user?.username || 'User'}
              </span>
              {onLogout && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}