import { type SnowflakeConnection } from "@shared/schema";
import snowflake from 'snowflake-sdk';

class SnowflakeService {
  async testConnection(connection: {
    account: string;
    username: string;
    password: string;
    role: string;
    warehouse: string;
  }): Promise<boolean> {
    try {
      if (!connection.account || !connection.username || !connection.password) {
        throw new Error("Invalid connection parameters");
      }
      
      const sfConnection = snowflake.createConnection({
        account: connection.account,
        username: connection.username,
        password: connection.password,
        role: connection.role,
        warehouse: connection.warehouse
      });
      
      // Create a promise-based connection
      return new Promise((resolve, reject) => {
        sfConnection.connect((err) => {
          if (err) {
            reject(new Error(`Unable to connect to Snowflake: ${err.message}`));
            return;
          }
          
          // Successfully connected, now disconnect
          sfConnection.destroy((destroyErr) => {
            if (destroyErr) {
              console.warn('Error when disconnecting:', destroyErr);
            }
            resolve(true);
          });
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to connect to Snowflake: ${error.message}`);
    }
  }

  async executeQuery(
    connection: SnowflakeConnection,
    query: string
  ): Promise<{
    executionTime: number;
    bytesScanned: number;
    results?: any[];
  }> {
    try {
      if (!connection.account || !connection.username || !connection.password) {
        throw new Error("Invalid connection parameters");
      }
      
      // Validate query
      if (!query || query.trim() === "") {
        throw new Error("Empty query");
      }
      
      // Simple query validation - detect basic SQL syntax
      if (!this.isValidSqlQuery(query)) {
        throw new Error("Invalid SQL syntax");
      }
      
      const startTime = Date.now();
      
      const sfConnection = snowflake.createConnection({
        account: connection.account,
        username: connection.username,
        password: connection.password,
        role: connection.role || "ACCOUNTADMIN", // Ensure never null
        warehouse: connection.warehouse || "COMPUTE_WH" // Ensure never null
      });
      
      // Execute the query
      const results = await new Promise<any[]>((resolve, reject) => {
        sfConnection.connect((err) => {
          if (err) {
            reject(new Error(`Unable to connect to Snowflake: ${err.message}`));
            return;
          }
          
          sfConnection.execute({
            sqlText: query,
            complete: (executionErr, stmt, rows) => {
              sfConnection.destroy((destroyErr) => {
                if (destroyErr) {
                  console.warn('Error when disconnecting:', destroyErr);
                }
              });
              
              if (executionErr) {
                reject(new Error(`Failed to execute query: ${executionErr.message}`));
                return;
              }
              resolve(rows || []);
            }
          });
        });
      });
      
      const executionTime = Date.now() - startTime;
      
      // Ideally, we would get bytes scanned from the query statistics
      // For now, we'll estimate
      const bytesScanned = Math.max(10000, results.length * 1000);
      
      return {
        executionTime,
        bytesScanned,
        results
      };
    } catch (error: any) {
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  async getTableSchema(
    connection: SnowflakeConnection,
    database: string,
    schema: string,
    table: string
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          COLUMN_NAME as name, 
          DATA_TYPE as type 
        FROM 
          ${database}.INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = '${schema}' 
          AND TABLE_NAME = '${table}'
        ORDER BY 
          ORDINAL_POSITION
      `;
      
      const result = await this.executeQuery(connection, query);
      return result.results || [];
    } catch (error: any) {
      throw new Error(`Failed to get table schema: ${error.message}`);
    }
  }

  async getTableList(
    connection: SnowflakeConnection,
    database: string,
    schema: string
  ): Promise<string[]> {
    try {
      const query = `
        SELECT 
          TABLE_NAME 
        FROM 
          ${database}.INFORMATION_SCHEMA.TABLES 
        WHERE 
          TABLE_SCHEMA = '${schema}'
        ORDER BY 
          TABLE_NAME
      `;
      
      const result = await this.executeQuery(connection, query);
      return (result.results || []).map(row => row.TABLE_NAME);
    } catch (error: any) {
      throw new Error(`Failed to get table list: ${error.message}`);
    }
  }
  
  async getAccountUsageTables(connection: SnowflakeConnection): Promise<any[]> {
    try {
      const query = `
        SELECT 
          TABLE_NAME, 
          TABLE_SCHEMA,
          TABLE_CATALOG,
          ROW_COUNT,
          BYTES
        FROM 
          SNOWFLAKE.ACCOUNT_USAGE.TABLES
        ORDER BY 
          BYTES DESC
        LIMIT 20
      `;
      
      const result = await this.executeQuery(connection, query);
      return result.results || [];
    } catch (error: any) {
      throw new Error(`Failed to get account usage tables: ${error.message}`);
    }
  }

  async getWarehouses(connection: SnowflakeConnection): Promise<any[]> {
    try {
      const query = `
        SELECT 
          WAREHOUSE_NAME as name,
          ORGANIZATION_NAME as org,
          ACCOUNT_NAME as account,
          SIZE as size,
          MIN_CLUSTER_COUNT || ' to ' || MAX_CLUSTER_COUNT as cluster,
          CREDITS_USED * 3.0 as maxMonthlyCost,
          CASE WHEN AUTO_SUSPEND > 0 THEN true ELSE false END as isManaged,
          'Owner' as yourRole,
          STATE as state,
          TO_CHAR(CREATED_ON, 'YYYY-MM-DD') as lastUpdated,
          WAREHOUSE_ID as id
        FROM 
          SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSES
        ORDER BY 
          CREDITS_USED DESC
      `;
      
      const result = await this.executeQuery(connection, query);
      return result.results || [];
    } catch (error: any) {
      throw new Error(`Failed to get warehouses: ${error.message}`);
    }
  }

  private isValidSqlQuery(query: string): boolean {
    // Very simplified SQL validation
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for basic SQL keywords
    return (
      normalizedQuery.includes("select") ||
      normalizedQuery.includes("insert") ||
      normalizedQuery.includes("update") ||
      normalizedQuery.includes("delete") ||
      normalizedQuery.includes("create") ||
      normalizedQuery.includes("drop") ||
      normalizedQuery.includes("alter")
    );
  }
}

export const snowflakeService = new SnowflakeService();
