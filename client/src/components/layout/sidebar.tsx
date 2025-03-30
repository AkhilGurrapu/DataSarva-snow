import { Link } from "wouter";
import { 
  Home, 
  Database, 
  ServerCog, 
  BarChart2, 
  MessageSquareText, 
  FileText, 
  PieChart,
  Bell
} from "lucide-react";
import { cn } from "../../lib/utils";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/warehouses", label: "My warehouses", icon: ServerCog },
    { path: "/databases", label: "My databases", icon: Database },
    { path: "/recommendations", label: "Recommendations", icon: MessageSquareText },
    { path: "/approvals", label: "Approvals Inbox", icon: Bell },
    { 
      path: "/dashboards", 
      label: "Dashboards", 
      icon: BarChart2,
      submenu: [
        { path: "/dashboards/cost", label: "Cost Analysis" },
        { path: "/dashboards/usage", label: "Usage Analysis" },
        { path: "/dashboards/performance", label: "Warehouse Performance" },
        { path: "/dashboards/credits", label: "Credits Analysis" }
      ]
    },
    { path: "/query-advisor", label: "Query Advisor", icon: MessageSquareText },
    { path: "/documentation", label: "Documentation", icon: FileText },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center">
          <img 
            src="https://1000logos.net/wp-content/uploads/2020/09/Capital-One-Logo.png" 
            alt="Logo" 
            className="h-6 mr-2" 
          />
          <span className="font-semibold text-blue-600">Slingshot</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-0">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath && currentPath.startsWith(item.path);
            return (
              <li key={item.path} className={cn(
                item.submenu && isActive ? "pb-1" : ""
              )}>
                <Link href={item.path} className={cn(
                  "flex items-center px-4 py-3 text-sm",
                  isActive ? "bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}>
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
                {item.submenu && isActive && (
                  <ul className="ml-10 mt-1">
                    {item.submenu.map((subitem) => (
                      <li key={subitem.path}>
                        <Link 
                          href={subitem.path}
                          className={cn(
                            "block py-2 text-sm",
                            currentPath === subitem.path 
                              ? "text-blue-600 font-medium" 
                              : "text-gray-600 hover:text-blue-600"
                          )}
                        >
                          {subitem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}