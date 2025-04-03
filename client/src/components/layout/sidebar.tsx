import React from 'react';
import { Link } from 'wouter';
import { 
  Home, 
  Database, 
  Gauge, 
  Search, 
  BarChart3, 
  Settings, 
  Server, 
  AlertCircle, 
  Activity,
  Eye,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') {
      return true;
    }
    
    return path !== '/' && currentPath.startsWith(path);
  };
  
  const links = [
    { path: '/', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { path: '/databases', label: 'Databases', icon: <Database className="h-4 w-4" /> },
    { path: '/warehouses', label: 'Warehouses', icon: <Server className="h-4 w-4" /> },
    { path: '/query-advisor', label: 'Query Advisor', icon: <Search className="h-4 w-4" /> },
    { path: '/data-observability', label: 'Data Observability', icon: <Eye className="h-4 w-4" /> },
    { path: '/recommendations', label: 'Recommendations', icon: <Gauge className="h-4 w-4" /> },
    { path: '/dashboards', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { path: '/error-analyzer', label: 'Error Analyzer', icon: <AlertCircle className="h-4 w-4" /> },
    { path: '/performance', label: 'Performance', icon: <Activity className="h-4 w-4" /> },
    { path: '/documentation', label: 'Documentation', icon: <BookOpen className="h-4 w-4" /> },
    { path: '/connections', label: 'Connections', icon: <Settings className="h-4 w-4" /> }
  ];

  return (
    <div className="w-56 h-full bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="py-6 px-3 flex flex-col h-full">
        <div className="px-3 flex items-center mb-8">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
            <span>S</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">SnowSarva</h2>
        </div>
        
        <nav className="space-y-1 flex-1">
          {links.map((link) => (
            <Link key={link.path} href={link.path}>
              <a
                className={`flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            </Link>
          ))}
        </nav>
        
        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 mb-2">
            <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
              Powered By
            </p>
          </div>
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <div className="w-6 h-6 rounded-md bg-blue-600 mr-2"></div>
            <span>DataSarva</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;