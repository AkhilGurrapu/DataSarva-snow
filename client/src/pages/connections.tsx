import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import ConnectionForm from "@/components/connections/connection-form";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type ConnectionsProps = {
  user: any;
  onLogout: () => void;
};

type Connection = {
  id: number;
  name: string;
  account: string;
  username: string;
  role: string;
  warehouse: string;
  isActive: boolean;
  createdAt: string;
};

export default function Connections({ user, onLogout }: ConnectionsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConnectionDialog, setShowNewConnectionDialog] = useState(false);
  const [activeConnection, setActiveConnection] = useState<string | undefined>(undefined);
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      setLoading(true);
      const data = await snowflakeClient.getConnections();
      setConnections(data);
      
      const active = data.find((c: Connection) => c.isActive);
      if (active) {
        setActiveConnection(active.name);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      toast({
        title: "Error",
        description: "Failed to load Snowflake connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(connectionId: number) {
    try {
      // Set isActive for this connection and inactive for all others
      await snowflakeClient.updateConnection(connectionId, { isActive: true });
      
      // Update local state
      const updatedConnections = connections.map((conn) => ({
        ...conn,
        isActive: conn.id === connectionId,
      }));
      
      setConnections(updatedConnections);
      
      const active = updatedConnections.find(c => c.isActive);
      if (active) {
        setActiveConnection(active.name);
      }
      
      toast({
        title: "Connection activated",
        description: "Successfully activated connection",
      });
    } catch (error) {
      console.error("Failed to activate connection:", error);
      toast({
        title: "Error",
        description: "Failed to activate connection",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteConnection(connectionId: number) {
    try {
      await snowflakeClient.deleteConnection(connectionId);
      
      // Update local state
      setConnections(connections.filter((conn) => conn.id !== connectionId));
      
      // If we deleted the active connection, clear the active state
      const deletedConnection = connections.find(c => c.id === connectionId);
      if (deletedConnection?.isActive) {
        setActiveConnection(undefined);
      }
      
      toast({
        title: "Connection deleted",
        description: "Successfully deleted connection",
      });
    } catch (error) {
      console.error("Failed to delete connection:", error);
      toast({
        title: "Error",
        description: "Failed to delete connection",
        variant: "destructive",
      });
    } finally {
      setConnectionToDelete(null);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - only directly visible on desktop */}
      <div className={`${isMobile ? 'block lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300' : 'hidden'} ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}>
        <div onClick={e => e.stopPropagation()}>
          <Sidebar 
            activeConnection={activeConnection} 
            onMobileSidebarClose={() => setSidebarOpen(false)} 
            isMobile={true} 
          />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeConnection={activeConnection} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar 
          title="Snowflake Connections" 
          user={user} 
          onLogout={onLogout} 
          onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Manage Connections</h2>
                <Button onClick={() => setShowNewConnectionDialog(true)}>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Connection
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : connections.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <svg className="h-12 w-12 text-neutral-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-700">No connections found</h3>
                    <p className="text-neutral-500 mb-6 text-center max-w-md mt-2">
                      Create your first Snowflake connection to get started with optimization and automation features.
                    </p>
                    <Button onClick={() => setShowNewConnectionDialog(true)}>Add Connection</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connections.map((connection) => (
                    <Card key={connection.id} className={`shadow hover:shadow-md transition-shadow ${connection.isActive ? 'border-primary' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{connection.name}</CardTitle>
                          {connection.isActive && (
                            <Badge className="bg-success text-white">Active</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-neutral-600">
                          <div className="flex justify-between">
                            <span className="font-medium">Account:</span>
                            <span>{connection.account}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Username:</span>
                            <span>{connection.username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Role:</span>
                            <span>{connection.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Warehouse:</span>
                            <span>{connection.warehouse}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-6">
                          {!connection.isActive ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleSetActive(connection.id)}
                              className="flex-1 mr-2"
                            >
                              Set Active
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled
                              className="flex-1 mr-2"
                            >
                              Current Active
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setConnectionToDelete(connection)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* New Connection Dialog */}
      <Dialog open={showNewConnectionDialog} onOpenChange={setShowNewConnectionDialog}>
        <DialogContent className="max-w-md">
          <ConnectionForm onSuccess={() => {
            setShowNewConnectionDialog(false);
            fetchConnections();
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!connectionToDelete} onOpenChange={() => setConnectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the connection &quot;{connectionToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => connectionToDelete && handleDeleteConnection(connectionToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
