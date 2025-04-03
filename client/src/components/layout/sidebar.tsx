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
  BookOpen,
  Snowflake,
  Sparkles
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
  
  const mainLinks = [
    { path: '/', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { path: '/data-observability', label: 'Data Observability', icon: <Eye className="h-4 w-4" /> },
    { path: '/query-advisor', label: 'Query Advisor', icon: <Search className="h-4 w-4" /> },
    { path: '/error-analyzer', label: 'Error Analyzer', icon: <AlertCircle className="h-4 w-4" /> },
  ];
  
  const resourceLinks = [
    { path: '/databases', label: 'Databases', icon: <Database className="h-4 w-4" /> },
    { path: '/warehouses', label: 'Warehouses', icon: <Server className="h-4 w-4" /> },
    { path: '/performance', label: 'Performance', icon: <Activity className="h-4 w-4" /> },
  ];

  const insightLinks = [
    { path: '/recommendations', label: 'Recommendations', icon: <Gauge className="h-4 w-4" /> },
    { path: '/dashboards', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ];
  
  const settingsLinks = [
    { path: '/connections', label: 'Connections', icon: <Settings className="h-4 w-4" /> },
    { path: '/documentation', label: 'Documentation', icon: <BookOpen className="h-4 w-4" /> }
  ];

  return (
    <nav className="space-y-6 flex-1">
      <div className="space-y-1">
        {mainLinks.map((link) => (
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
      </div>
      
      <div>
        <div className="px-3 mb-2">
          <p className="text-xs uppercase font-medium text-gray-500">Resources</p>
        </div>
        <div className="space-y-1">
          {resourceLinks.map((link) => (
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
        </div>
      </div>
      
      <div>
        <div className="px-3 mb-2">
          <p className="text-xs uppercase font-medium text-gray-500">Insights</p>
        </div>
        <div className="space-y-1">
          {insightLinks.map((link) => (
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
        </div>
      </div>
      
      <div>
        <div className="px-3 mb-2">
          <p className="text-xs uppercase font-medium text-gray-500">Settings</p>
        </div>
        <div className="space-y-1">
          {settingsLinks.map((link) => (
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
        </div>
      </div>
      
      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md mr-1 flex items-center justify-center">
            <Sparkles className="h-2 w-2 text-white" />
          </div>
          <span>Powered by DataSarva AI</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;