import { apiRequest } from "./queryClient";

// This client-side wrapper communicates with the server-side Snowflake service
export const snowflakeClient = {
  async testConnection(connectionParams: {
    name: string;
    account: string;
    username: string;
    password: string;
    role: string;
    warehouse: string;
  }) {
    try {
      const response = await apiRequest("POST", "/api/connections", connectionParams);
      return await response.json();
    } catch (error) {
      console.error("Connection test failed:", error);
      throw new Error("Failed to test connection. Please check your credentials.");
    }
  },

  async getConnections() {
    try {
      const response = await fetch("/api/connections", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching connections: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      throw new Error("Failed to fetch connections. Please try again.");
    }
  },

  async updateConnection(id: number, connectionParams: Partial<{
    name: string;
    account: string;
    username: string;
    password: string;
    role: string;
    warehouse: string;
    isActive: boolean;
  }>) {
    try {
      const response = await apiRequest("PUT", `/api/connections/${id}`, connectionParams);
      return await response.json();
    } catch (error) {
      console.error("Connection update failed:", error);
      throw new Error("Failed to update connection. Please try again.");
    }
  },

  async deleteConnection(id: number) {
    try {
      await apiRequest("DELETE", `/api/connections/${id}`, null);
      return true;
    } catch (error) {
      console.error("Connection deletion failed:", error);
      throw new Error("Failed to delete connection. Please try again.");
    }
  },

  async getDashboardStats() {
    try {
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching dashboard stats: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      throw new Error("Failed to fetch dashboard stats. Please try again.");
    }
  },

  async getPerformanceData(period: string = '30days') {
    try {
      const response = await fetch(`/api/dashboard/performance-data?period=${period}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching performance data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
      throw new Error("Failed to fetch performance data. Please try again.");
    }
  },

  async getActivityLogs(limit: number = 10) {
    try {
      const response = await fetch(`/api/activity-logs?limit=${limit}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching activity logs: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      throw new Error("Failed to fetch activity logs. Please try again.");
    }
  },

  async getPipelines() {
    try {
      const response = await fetch("/api/pipelines", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching pipelines: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);
      throw new Error("Failed to fetch pipelines. Please try again.");
    }
  },

  async updatePipeline(id: number, pipelineParams: Partial<{
    name: string;
    description: string;
    schedule: string;
    status: string;
  }>) {
    try {
      const response = await apiRequest("PUT", `/api/pipelines/${id}`, pipelineParams);
      return await response.json();
    } catch (error) {
      console.error("Pipeline update failed:", error);
      throw new Error("Failed to update pipeline. Please try again.");
    }
  },

  async deletePipeline(id: number) {
    try {
      await apiRequest("DELETE", `/api/pipelines/${id}`, null);
      return true;
    } catch (error) {
      console.error("Pipeline deletion failed:", error);
      throw new Error("Failed to delete pipeline. Please try again.");
    }
  },

  async getQueryHistory(limit: number = 10) {
    try {
      const response = await fetch(`/api/query-history?limit=${limit}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching query history: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch query history:", error);
      throw new Error("Failed to fetch query history. Please try again.");
    }
  },

  async getErrorLogs(limit: number = 10) {
    try {
      const response = await fetch(`/api/error-logs?limit=${limit}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching error logs: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch error logs:", error);
      throw new Error("Failed to fetch error logs. Please try again.");
    }
  }
};
