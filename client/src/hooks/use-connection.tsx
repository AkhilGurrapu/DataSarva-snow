import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";

type SnowflakeConnection = {
  id: number;
  name: string;
  account: string;
  username: string;
  role: string;
  warehouse: string;
  isActive: boolean;
  createdAt: string;
};

type ConnectionContextType = {
  activeConnection: SnowflakeConnection | null;
  connections: SnowflakeConnection[];
  loading: boolean;
  error: string | null;
  refreshConnections: () => Promise<void>;
  setActiveConnection: (connectionId: number) => Promise<void>;
  hasConnections: boolean;
};

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [activeConnection, setActiveConnectionState] = useState<SnowflakeConnection | null>(null);
  const [connections, setConnections] = useState<SnowflakeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    refreshConnections();
  }, []);

  async function refreshConnections() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await snowflakeClient.getConnections();
      
      if (Array.isArray(data)) {
        setConnections(data);
        
        // Find the active connection
        const active = data.find((c: SnowflakeConnection) => c.isActive);
        if (active) {
          setActiveConnectionState(active);
        } else {
          setActiveConnectionState(null);
        }
      } else {
        setConnections([]);
        setActiveConnectionState(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch connections:", error);
      setError(error.message || "Failed to fetch Snowflake connections");
      setConnections([]);
      setActiveConnectionState(null);
    } finally {
      setLoading(false);
    }
  }

  async function setActiveConnection(connectionId: number) {
    try {
      await snowflakeClient.updateConnection(connectionId, { isActive: true });
      
      // Update local state
      const updatedConnections = connections.map((conn) => ({
        ...conn,
        isActive: conn.id === connectionId,
      }));
      
      setConnections(updatedConnections);
      
      // Set the active connection
      const active = updatedConnections.find(c => c.isActive);
      if (active) {
        setActiveConnectionState(active);
        
        toast({
          title: "Connection activated",
          description: `Successfully connected to ${active.name}`,
        });
      }
    } catch (error: any) {
      console.error("Failed to activate connection:", error);
      setError(error.message || "Failed to activate Snowflake connection");
      
      toast({
        title: "Error",
        description: "Failed to activate connection",
        variant: "destructive",
      });
    }
  }

  return (
    <ConnectionContext.Provider
      value={{
        activeConnection,
        connections,
        loading,
        error,
        refreshConnections,
        setActiveConnection,
        hasConnections: connections.length > 0,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === null) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}