import { Link, useLocation } from "wouter";
import Sidebar from "./sidebar";
import { Bell, Settings, User } from "lucide-react";
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
        <header className="bg-white shadow-sm border-b border-gray-100 h-12 flex items-center justify-end px-6">
          <div className="flex items-center space-x-4">
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
            <button className="flex items-center text-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}