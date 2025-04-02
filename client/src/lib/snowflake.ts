import { apiRequest } from './queryClient';

export const snowflakeClient = {
  async testConnection(connection: {
    account: string;
    username: string;
    password: string;
    warehouse: string;
    role: string;
    database?: string;
    schema?: string;
  }) {
    const response = await apiRequest('POST', '/api/connections/test', connection);
    return response;
  },
  async getConnections() {
    const response = await apiRequest('GET', `/api/connections`);
    return response;
  },
  
  async createConnection(connection: {
    name: string;
    account: string;
    username: string;
    password: string;
    role: string;
    warehouse: string;
  }) {
    const response = await apiRequest('POST', `/api/connections`, connection);
    return response;
  },
  
  async updateConnection(connectionId: number, params: { isActive?: boolean, name?: string }) {
    const response = await apiRequest('PUT', `/api/connections/${connectionId}`, params);
    return response;
  },
  
  async deleteConnection(connectionId: number) {
    const response = await apiRequest('DELETE', `/api/connections/${connectionId}`);
    return response;
  },
  async executeQuery(connectionId: number, query: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/execute-query`, {
      query,
    });
    return response;
  },

  async getTableSchema(connectionId: number, database: string, schema: string, table: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/schema/${database}/${schema}/${table}`);
    return response;
  },

  async getDatabases(connectionId: number) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/databases`);
    return response;
  },

  async getSchemas(connectionId: number, database: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/databases/${database}/schemas`);
    return response;
  },

  async getTables(connectionId: number, database: string, schema: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/databases/${database}/schemas/${schema}/tables`);
    return response;
  },
  
  async getAllTables(connectionId: number) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/tables`);
    return response;
  },

  async getWarehouses(connectionId: number) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/warehouses`);
    return response;
  },

  async getQueryHistory(connectionId: number) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/query-history`);
    return response;
  },
  
  async getWarehouseMetrics(connectionId: number, warehouseName: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/warehouse-metrics/${warehouseName}`);
    return response;
  },

  async createWarehouse(connectionId: number, params: { 
    name: string; 
    size?: string; 
    maxClusterCount?: number; 
    minClusterCount?: number;
    autoSuspend?: number;
    autoResume?: boolean;
    initialSuspensionDelay?: number;
    comment?: string;
  }) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/warehouses`, params);
    return response;
  },

  async updateWarehouse(connectionId: number, warehouseName: string, params: {
    size?: string;
    maxClusterCount?: number;
    minClusterCount?: number;
    autoSuspend?: number;
    autoResume?: boolean;
    comment?: string;
    resourceMonitor?: string;
  }) {
    const response = await apiRequest('PUT', `/api/snowflake/${connectionId}/warehouses/${warehouseName}`, params);
    return response;
  },

  async resumeWarehouse(connectionId: number, warehouseName: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/warehouses/${warehouseName}/resume`, {});
    return response;
  },

  async suspendWarehouse(connectionId: number, warehouseName: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/warehouses/${warehouseName}/suspend`, {});
    return response;
  },

  async getTableColumns(connectionId: number, database: string, schema: string, table: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/databases/${database}/schemas/${schema}/tables/${table}/columns`);
    return response;
  },

  async getTableStats(connectionId: number, database: string, schema: string, table: string) {
    const response = await apiRequest('GET', `/api/snowflake/${connectionId}/databases/${database}/schemas/${schema}/tables/${table}/stats`);
    return response;
  }
};