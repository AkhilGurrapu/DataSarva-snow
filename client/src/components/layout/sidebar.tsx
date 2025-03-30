import { Link } from "wouter";
import { 
  Home, 
  Database, 
  ServerCog, 
  BarChart2, 
  MessageSquareText, 
  FileText, 
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useState } from "react";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "/dashboards": currentPath.startsWith("/dashboards")
  });

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/warehouses", label: "Warehouses", icon: ServerCog },
    { path: "/databases", label: "Databases", icon: Database },
    { path: "/recommendations", label: "Recommendations", icon: MessageSquareText },
    { 
      path: "/dashboards", 
      label: "Analytics", 
      icon: BarChart2,
      submenu: [
        { path: "/dashboards/cost", label: "Cost Analysis" },
        { path: "/dashboards/performance", label: "Performance" },
        { path: "/dashboards/usage", label: "Usage Metrics" }
      ]
    },
    { path: "/query-advisor", label: "Query Advisor", icon: MessageSquareText },
    { path: "/documentation", label: "Documentation", icon: FileText },
  ];

  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="text-xl font-semibold text-white">SnowflakeDataSuite</div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || 
                          (item.submenu && currentPath.startsWith(item.path));
          const isExpanded = expandedMenus[item.path];
          
          return (
            <div key={item.path}>
              {item.submenu ? (
                <div>
                  <button 
                    onClick={() => toggleMenu(item.path)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 rounded-md my-1 text-sm",
                      isActive ? "bg-gray-800 text-blue-400" : "text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-9 mt-1 mb-2 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link 
                          key={subitem.path}
                          href={subitem.path}
                          className={cn(
                            "block py-2 pl-3 text-sm rounded-md",
                            currentPath === subitem.path 
                              ? "text-blue-400 bg-gray-800 font-medium" 
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
                          )}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.path} 
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md my-1 text-sm",
                    isActive 
                      ? "bg-gray-800 text-blue-400" 
                      : "text-gray-300 hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        v1.0.0 | Connected to Snowflake
      </div>
    </div>
  );
}