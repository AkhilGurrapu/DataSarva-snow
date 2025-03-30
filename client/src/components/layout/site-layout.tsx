import { Link } from "wouter";
import { Home, Database, Zap, GitPullRequest, LineChart, Bug, TestTube2 } from "lucide-react";

type SiteLayoutProps = {
  user: any;
  onLogout: () => void;
  children: React.ReactNode;
  currentPath: string;
};

export default function SiteLayout({ user, onLogout, children, currentPath }: SiteLayoutProps) {
  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/connections", label: "Connections", icon: Database },
    { path: "/query-optimizer", label: "Query Optimizer", icon: Zap },
    { path: "/etl-workflows", label: "ETL Workflows", icon: GitPullRequest },
    { path: "/performance", label: "Performance", icon: LineChart },
    { path: "/debugging", label: "Debugging", icon: Bug },
    { path: "/snowflake-test", label: "Snowflake Test", icon: TestTube2 },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-900 text-white flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <div className="text-xl font-bold">SnowAutoPilot</div>
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => {
              const sidebar = document.getElementById('sidebar-nav');
              if (sidebar) {
                sidebar.classList.toggle('hidden');
              }
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div id="sidebar-nav" className="hidden md:block">
          <nav className="mt-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <a 
                    className={`flex items-center px-4 py-3 ${
                      currentPath === item.path
                        ? "bg-gray-800 text-blue-400 border-l-4 border-blue-400" 
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-gray-400">Admin</div>
              </div>
            </div>
            <button 
              className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{navItems.find(item => item.path === currentPath)?.label}</h1>
          <div className="md:hidden">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
              </div>
              <button 
                className="ml-4 px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}