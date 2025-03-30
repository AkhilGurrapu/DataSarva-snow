import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SidebarProps = {
  activeConnection?: string;
  onMobileSidebarClose?: () => void;
  isMobile?: boolean;
};

export default function Sidebar({ activeConnection, onMobileSidebarClose, isMobile = false }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ) 
    },
    { 
      name: "Connections", 
      href: "/connections", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ) 
    },
    { 
      name: "Performance", 
      href: "/performance", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ) 
    },
    { 
      name: "ETL Workflows", 
      href: "/etl-workflows", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ) 
    },
    { 
      name: "Query Optimizer", 
      href: "/query-optimizer", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ) 
    },
    { 
      name: "Debugging", 
      href: "/debugging", 
      icon: (
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      ) 
    },
  ];

  function handleClick() {
    if (isMobile && onMobileSidebarClose) {
      onMobileSidebarClose();
    }
  }

  return (
    <div className="fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-white border-r border-neutral-200 lg:translate-x-0 lg:static lg:inset-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-neutral-200">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.929l-7.071 7.071 1.414 1.414L12 7.757l5.657 5.657 1.414-1.414L12 4.929zM12 12.343l-7.071 7.071 1.414 1.414L12 15.172l5.657 5.657 1.414-1.414L12 12.343z"/>
          </svg>
          <span className="ml-2 text-xl font-semibold text-primary">SnowAutoPilot</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-5 px-2 space-y-1">
        {navItems.map((item) => (
          <div key={item.name}>
            <Link 
              href={item.href}
              onClick={handleClick}
            >
              <div
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md group cursor-pointer",
                  location === item.href
                    ? "bg-primary text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                {item.icon}
                {item.name}
              </div>
            </Link>
          </div>
        ))}
      </nav>
      
      {/* Connection Status */}
      {activeConnection && (
        <div className="absolute bottom-0 w-full border-t border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="relative inline-block w-2 h-2 mr-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </div>
            <div className="text-sm font-medium text-neutral-700">Connected to:</div>
          </div>
          <div className="mt-1 text-sm font-semibold truncate">{activeConnection}</div>
        </div>
      )}
    </div>
  );
}
