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
      return await apiRequest("POST", "/api/connections", connectionParams);
    } catch (error) {
      console.error("Connection test failed:", error);
      throw new Error("Failed to test connection. Please check your credentials.");
    }
  },

  async getConnections() {
    try {
      return await apiRequest("GET", "/api/connections");
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
      return await apiRequest("PUT", `/api/connections/${id}`, connectionParams);
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
      return await apiRequest("GET", "/api/dashboard/stats");
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      throw new Error("Failed to fetch dashboard stats. Please try again.");
    }
  },

  async getPerformanceData(period: string = '30days') {
    try {
      return await apiRequest("GET", `/api/dashboard/performance-data?period=${period}`);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
      throw new Error("Failed to fetch performance data. Please try again.");
    }
  },

  async getActivityLogs(limit: number = 10) {
    try {
      return await apiRequest("GET", `/api/activity-logs?limit=${limit}`);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      throw new Error("Failed to fetch activity logs. Please try again.");
    }
  },

  async getPipelines() {
    try {
      return await apiRequest("GET", "/api/pipelines");
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
      return await apiRequest("PUT", `/api/pipelines/${id}`, pipelineParams);
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
      return await apiRequest("GET", `/api/query-history?limit=${limit}`);
    } catch (error) {
      console.error("Failed to fetch query history:", error);
      throw new Error("Failed to fetch query history. Please try again.");
    }
  },

  async getErrorLogs(limit: number = 10) {
    try {
      return await apiRequest("GET", `/api/error-logs?limit=${limit}`);
    } catch (error) {
      console.error("Failed to fetch error logs:", error);
      throw new Error("Failed to fetch error logs. Please try again.");
    }
  },
  
  async getWarehouses() {
    try {
      return await apiRequest("GET", "/api/warehouses");
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
      throw new Error("Failed to fetch warehouses. Please try again.");
    }
  },
  
  async getRecommendations() {
    try {
      return await apiRequest("GET", "/api/recommendations");
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      throw new Error("Failed to fetch recommendations. Please try again.");
    }
  },
  
  async getWarehousePerformance(warehouseName: string, period: string = '30days') {
    try {
      return await apiRequest("GET", `/api/warehouse-performance/${warehouseName}?period=${period}`);
    } catch (error) {
      console.error("Failed to fetch warehouse performance data:", error);
      throw new Error("Failed to fetch warehouse performance data. Please try again.");
    }
  }
};
