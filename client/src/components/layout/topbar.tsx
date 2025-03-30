import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type TopBarProps = {
  title: string;
  user: any;
  onLogout: () => void;
  onMobileSidebarToggle: () => void;
};

export default function TopBar({ title, user, onLogout, onMobileSidebarToggle }: TopBarProps) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  function handleLogout() {
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  }

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button 
              onClick={onMobileSidebarToggle}
              className="px-4 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 relative">
              <div className="flex items-center">
                <div className="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-700">
                  {user?.fullName || user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2 text-sm text-neutral-500 hover:text-neutral-700 px-2"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
