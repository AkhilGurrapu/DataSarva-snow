import snowflake from 'snowflake-sdk';
import { IStorage } from './storage';
import { 
  User, InsertUser,
  SnowflakeConnection, InsertConnection,
  QueryHistory, InsertQueryHistory,
  EtlPipeline, InsertEtlPipeline,
  ErrorLog, InsertErrorLog,
  ActivityLog, InsertActivityLog
} from '@shared/schema';

export class SnowflakeStorage implements IStorage {
  private connection: snowflake.Connection;
  private connectionConfig: snowflake.ConnectionOptions;
  private connected: boolean = false;

  constructor(connectionOptions: SnowflakeConnection) {
    // Initialize Snowflake connection configuration
    this.connectionConfig = {
      account: connectionOptions.account,
      username: connectionOptions.username,
      password: connectionOptions.password,
      warehouse: connectionOptions.warehouse || 'COMPUTE_WH',
      role: connectionOptions.role || 'ACCOUNTADMIN',
    };

    // Create connection object
    this.connection = snowflake.createConnection(this.connectionConfig);
  }

  // Initialize connection to Snowflake
  async initializeConnection(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.connection.connect((err) => {
        if (err) {
          console.error('Unable to connect to Snowflake:', err);
          reject(err);
          return;
        }
        
        this.connected = true;
        console.log('Successfully connected to Snowflake!');
        resolve();
      });
    });
  }

  // Initialize tables in Snowflake
  async initializeTables(): Promise<void> {
    await this.initializeConnection();

    // Create users table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTOINCREMENT PRIMARY KEY,
        username VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        full_name VARCHAR,
        role VARCHAR DEFAULT 'user' NOT NULL
      )
    `);

    // Create snowflake_connections table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS snowflake_connections (
        id INT AUTOINCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR NOT NULL,
        account VARCHAR NOT NULL,
        username VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        role VARCHAR DEFAULT 'ACCOUNTADMIN',
        warehouse VARCHAR DEFAULT 'COMPUTE_WH',
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);

    // Create query_history table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INT AUTOINCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        connection_id INT NOT NULL,
        original_query VARCHAR NOT NULL,
        optimized_query VARCHAR,
        execution_time_original INT,
        execution_time_optimized INT,
        suggestions VARIANT,
        bytes_scanned INT,
        timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);

    // Create etl_pipelines table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS etl_pipelines (
        id INT AUTOINCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        connection_id INT NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source_description VARCHAR NOT NULL,
        target_description VARCHAR NOT NULL,
        business_requirements VARCHAR,
        schedule VARCHAR,
        pipeline_code VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'paused' NOT NULL,
        last_run_time INT,
        last_run_status VARCHAR,
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);

    // Create error_logs table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id INT AUTOINCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        connection_id INT NOT NULL,
        error_message VARCHAR NOT NULL,
        error_code VARCHAR,
        error_context VARCHAR,
        analysis VARIANT,
        status VARCHAR DEFAULT 'pending' NOT NULL,
        timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);

    // Create activity_logs table
    await this.executeStatement(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTOINCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        details VARIANT,
        timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
  }

  // Helper method to execute SQL statements
  private async executeStatement(sql: string, binds: any[] = []): Promise<any[]> {
    await this.initializeConnection();

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: sql,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to execute statement:', err);
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      });
    });
  }

  // Close the connection
  async close(): Promise<void> {
    if (!this.connected) return;

    return new Promise((resolve, reject) => {
      this.connection.destroy((err) => {
        if (err) {
          console.error('Error disconnecting from Snowflake:', err);
          reject(err);
          return;
        }
        this.connected = false;
        console.log('Disconnected from Snowflake');
        resolve();
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return undefined;
    
    const userData = rows[0];
    return {
      id: userData.ID,
      username: userData.USERNAME,
      password: userData.PASSWORD,
      email: userData.EMAIL,
      fullName: userData.FULL_NAME,
      role: userData.ROLE
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) return undefined;
    
    const userData = rows[0];
    return {
      id: userData.ID,
      username: userData.USERNAME,
      password: userData.PASSWORD,
      email: userData.EMAIL,
      fullName: userData.FULL_NAME,
      role: userData.ROLE
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const rows = await this.executeStatement(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?) RETURNING *',
      [user.username, user.password, user.email, user.fullName || null, 'user']
    );
    
    const userData = rows[0];
    return {
      id: userData.ID,
      username: userData.USERNAME,
      password: userData.PASSWORD,
      email: userData.EMAIL,
      fullName: userData.FULL_NAME,
      role: userData.ROLE
    };
  }

  // Snowflake connection operations
  async getConnection(id: number): Promise<SnowflakeConnection | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM snowflake_connections WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return undefined;
    
    const connData = rows[0];
    return {
      id: connData.ID,
      userId: connData.USER_ID,
      name: connData.NAME,
      account: connData.ACCOUNT,
      username: connData.USERNAME,
      password: connData.PASSWORD,
      role: connData.ROLE,
      warehouse: connData.WAREHOUSE,
      isActive: connData.IS_ACTIVE,
      createdAt: connData.CREATED_AT
    };
  }

  async getConnectionsByUserId(userId: number): Promise<SnowflakeConnection[]> {
    const rows = await this.executeStatement(
      'SELECT * FROM snowflake_connections WHERE user_id = ?',
      [userId]
    );
    
    return rows.map(connData => ({
      id: connData.ID,
      userId: connData.USER_ID,
      name: connData.NAME,
      account: connData.ACCOUNT,
      username: connData.USERNAME,
      password: connData.PASSWORD,
      role: connData.ROLE,
      warehouse: connData.WAREHOUSE,
      isActive: connData.IS_ACTIVE,
      createdAt: connData.CREATED_AT
    }));
  }

  async createConnection(connection: InsertConnection): Promise<SnowflakeConnection> {
    const rows = await this.executeStatement(
      `INSERT INTO snowflake_connections 
       (user_id, name, account, username, password, role, warehouse, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING *`,
      [
        connection.userId, 
        connection.name, 
        connection.account, 
        connection.username, 
        connection.password, 
        connection.role || 'ACCOUNTADMIN', 
        connection.warehouse || 'COMPUTE_WH', 
        false
      ]
    );
    
    const connData = rows[0];
    return {
      id: connData.ID,
      userId: connData.USER_ID,
      name: connData.NAME,
      account: connData.ACCOUNT,
      username: connData.USERNAME,
      password: connData.PASSWORD,
      role: connData.ROLE,
      warehouse: connData.WAREHOUSE,
      isActive: connData.IS_ACTIVE,
      createdAt: connData.CREATED_AT
    };
  }

  async updateConnection(id: number, connection: Partial<SnowflakeConnection>): Promise<SnowflakeConnection | undefined> {
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (connection.name !== undefined) {
      updates.push('name = ?');
      values.push(connection.name);
    }
    
    if (connection.account !== undefined) {
      updates.push('account = ?');
      values.push(connection.account);
    }
    
    if (connection.username !== undefined) {
      updates.push('username = ?');
      values.push(connection.username);
    }
    
    if (connection.password !== undefined) {
      updates.push('password = ?');
      values.push(connection.password);
    }
    
    if (connection.role !== undefined) {
      updates.push('role = ?');
      values.push(connection.role);
    }
    
    if (connection.warehouse !== undefined) {
      updates.push('warehouse = ?');
      values.push(connection.warehouse);
    }
    
    if (connection.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(connection.isActive);
    }
    
    if (updates.length === 0) {
      return this.getConnection(id);
    }
    
    // Add the ID to the values array
    values.push(id);
    
    const rows = await this.executeStatement(
      `UPDATE snowflake_connections SET ${updates.join(', ')} WHERE id = ? RETURNING *`,
      values
    );
    
    if (rows.length === 0) return undefined;
    
    const connData = rows[0];
    return {
      id: connData.ID,
      userId: connData.USER_ID,
      name: connData.NAME,
      account: connData.ACCOUNT,
      username: connData.USERNAME,
      password: connData.PASSWORD,
      role: connData.ROLE,
      warehouse: connData.WAREHOUSE,
      isActive: connData.IS_ACTIVE,
      createdAt: connData.CREATED_AT
    };
  }

  async deleteConnection(id: number): Promise<boolean> {
    const result = await this.executeStatement(
      'DELETE FROM snowflake_connections WHERE id = ?',
      [id]
    );
    
    return true; // If no error was thrown, we assume the deletion was successful
  }

  // Query history operations
  async getQueryHistory(id: number): Promise<QueryHistory | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM query_history WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return undefined;
    
    const queryData = rows[0];
    return {
      id: queryData.ID,
      userId: queryData.USER_ID,
      connectionId: queryData.CONNECTION_ID,
      originalQuery: queryData.ORIGINAL_QUERY,
      optimizedQuery: queryData.OPTIMIZED_QUERY,
      executionTimeOriginal: queryData.EXECUTION_TIME_ORIGINAL,
      executionTimeOptimized: queryData.EXECUTION_TIME_OPTIMIZED,
      suggestions: queryData.SUGGESTIONS,
      bytesScanned: queryData.BYTES_SCANNED,
      timestamp: queryData.TIMESTAMP
    };
  }

  async getQueryHistoryByUserId(userId: number, limit = 10): Promise<QueryHistory[]> {
    const rows = await this.executeStatement(
      'SELECT * FROM query_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
    
    return rows.map(queryData => ({
      id: queryData.ID,
      userId: queryData.USER_ID,
      connectionId: queryData.CONNECTION_ID,
      originalQuery: queryData.ORIGINAL_QUERY,
      optimizedQuery: queryData.OPTIMIZED_QUERY,
      executionTimeOriginal: queryData.EXECUTION_TIME_ORIGINAL,
      executionTimeOptimized: queryData.EXECUTION_TIME_OPTIMIZED,
      suggestions: queryData.SUGGESTIONS,
      bytesScanned: queryData.BYTES_SCANNED,
      timestamp: queryData.TIMESTAMP
    }));
  }

  async createQueryHistory(history: InsertQueryHistory): Promise<QueryHistory> {
    const rows = await this.executeStatement(
      `INSERT INTO query_history 
       (user_id, connection_id, original_query, optimized_query, execution_time_original, execution_time_optimized, suggestions, bytes_scanned) 
       VALUES (?, ?, ?, ?, ?, ?, PARSE_JSON(?), ?) 
       RETURNING *`,
      [
        history.userId,
        history.connectionId,
        history.originalQuery,
        history.optimizedQuery || null,
        history.executionTimeOriginal || null,
        history.executionTimeOptimized || null,
        history.suggestions ? JSON.stringify(history.suggestions) : null,
        history.bytesScanned || null
      ]
    );
    
    const queryData = rows[0];
    return {
      id: queryData.ID,
      userId: queryData.USER_ID,
      connectionId: queryData.CONNECTION_ID,
      originalQuery: queryData.ORIGINAL_QUERY,
      optimizedQuery: queryData.OPTIMIZED_QUERY,
      executionTimeOriginal: queryData.EXECUTION_TIME_ORIGINAL,
      executionTimeOptimized: queryData.EXECUTION_TIME_OPTIMIZED,
      suggestions: queryData.SUGGESTIONS,
      bytesScanned: queryData.BYTES_SCANNED,
      timestamp: queryData.TIMESTAMP
    };
  }

  // ETL pipeline operations
  async getPipeline(id: number): Promise<EtlPipeline | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM etl_pipelines WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return undefined;
    
    const pipelineData = rows[0];
    return {
      id: pipelineData.ID,
      userId: pipelineData.USER_ID,
      connectionId: pipelineData.CONNECTION_ID,
      name: pipelineData.NAME,
      description: pipelineData.DESCRIPTION,
      sourceDescription: pipelineData.SOURCE_DESCRIPTION,
      targetDescription: pipelineData.TARGET_DESCRIPTION,
      businessRequirements: pipelineData.BUSINESS_REQUIREMENTS,
      schedule: pipelineData.SCHEDULE,
      pipelineCode: pipelineData.PIPELINE_CODE,
      status: pipelineData.STATUS,
      lastRunTime: pipelineData.LAST_RUN_TIME,
      lastRunStatus: pipelineData.LAST_RUN_STATUS,
      createdAt: pipelineData.CREATED_AT
    };
  }

  async getPipelinesByUserId(userId: number): Promise<EtlPipeline[]> {
    const rows = await this.executeStatement(
      'SELECT * FROM etl_pipelines WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    return rows.map(pipelineData => ({
      id: pipelineData.ID,
      userId: pipelineData.USER_ID,
      connectionId: pipelineData.CONNECTION_ID,
      name: pipelineData.NAME,
      description: pipelineData.DESCRIPTION,
      sourceDescription: pipelineData.SOURCE_DESCRIPTION,
      targetDescription: pipelineData.TARGET_DESCRIPTION,
      businessRequirements: pipelineData.BUSINESS_REQUIREMENTS,
      schedule: pipelineData.SCHEDULE,
      pipelineCode: pipelineData.PIPELINE_CODE,
      status: pipelineData.STATUS,
      lastRunTime: pipelineData.LAST_RUN_TIME,
      lastRunStatus: pipelineData.LAST_RUN_STATUS,
      createdAt: pipelineData.CREATED_AT
    }));
  }

  async createPipeline(pipeline: InsertEtlPipeline): Promise<EtlPipeline> {
    const rows = await this.executeStatement(
      `INSERT INTO etl_pipelines 
       (user_id, connection_id, name, description, source_description, target_description, business_requirements, schedule, pipeline_code, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING *`,
      [
        pipeline.userId,
        pipeline.connectionId,
        pipeline.name,
        pipeline.description || null,
        pipeline.sourceDescription,
        pipeline.targetDescription,
        pipeline.businessRequirements || null,
        pipeline.schedule || null,
        pipeline.pipelineCode,
        pipeline.status || 'INACTIVE'
      ]
    );
    
    const pipelineData = rows[0];
    return {
      id: pipelineData.ID,
      userId: pipelineData.USER_ID,
      connectionId: pipelineData.CONNECTION_ID,
      name: pipelineData.NAME,
      description: pipelineData.DESCRIPTION,
      sourceDescription: pipelineData.SOURCE_DESCRIPTION,
      targetDescription: pipelineData.TARGET_DESCRIPTION,
      businessRequirements: pipelineData.BUSINESS_REQUIREMENTS,
      schedule: pipelineData.SCHEDULE,
      pipelineCode: pipelineData.PIPELINE_CODE,
      status: pipelineData.STATUS,
      lastRunTime: pipelineData.LAST_RUN_TIME,
      lastRunStatus: pipelineData.LAST_RUN_STATUS,
      createdAt: pipelineData.CREATED_AT
    };
  }

  async updatePipeline(id: number, pipeline: Partial<EtlPipeline>): Promise<EtlPipeline | undefined> {
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (pipeline.name !== undefined) {
      updates.push('name = ?');
      values.push(pipeline.name);
    }
    
    if (pipeline.description !== undefined) {
      updates.push('description = ?');
      values.push(pipeline.description);
    }
    
    if (pipeline.sourceDescription !== undefined) {
      updates.push('source_description = ?');
      values.push(pipeline.sourceDescription);
    }
    
    if (pipeline.targetDescription !== undefined) {
      updates.push('target_description = ?');
      values.push(pipeline.targetDescription);
    }
    
    if (pipeline.businessRequirements !== undefined) {
      updates.push('business_requirements = ?');
      values.push(pipeline.businessRequirements);
    }
    
    if (pipeline.schedule !== undefined) {
      updates.push('schedule = ?');
      values.push(pipeline.schedule);
    }
    
    if (pipeline.pipelineCode !== undefined) {
      updates.push('pipeline_code = ?');
      values.push(pipeline.pipelineCode);
    }
    
    if (pipeline.status !== undefined) {
      updates.push('status = ?');
      values.push(pipeline.status);
    }
    
    if (pipeline.lastRunTime !== undefined) {
      updates.push('last_run_time = ?');
      values.push(pipeline.lastRunTime);
    }
    
    if (pipeline.lastRunStatus !== undefined) {
      updates.push('last_run_status = ?');
      values.push(pipeline.lastRunStatus);
    }
    
    if (updates.length === 0) {
      return this.getPipeline(id);
    }
    
    // Add the ID to the values array
    values.push(id);
    
    const rows = await this.executeStatement(
      `UPDATE etl_pipelines SET ${updates.join(', ')} WHERE id = ? RETURNING *`,
      values
    );
    
    if (rows.length === 0) return undefined;
    
    const pipelineData = rows[0];
    return {
      id: pipelineData.ID,
      userId: pipelineData.USER_ID,
      connectionId: pipelineData.CONNECTION_ID,
      name: pipelineData.NAME,
      description: pipelineData.DESCRIPTION,
      sourceDescription: pipelineData.SOURCE_DESCRIPTION,
      targetDescription: pipelineData.TARGET_DESCRIPTION,
      businessRequirements: pipelineData.BUSINESS_REQUIREMENTS,
      schedule: pipelineData.SCHEDULE,
      pipelineCode: pipelineData.PIPELINE_CODE,
      status: pipelineData.STATUS,
      lastRunTime: pipelineData.LAST_RUN_TIME,
      lastRunStatus: pipelineData.LAST_RUN_STATUS,
      createdAt: pipelineData.CREATED_AT
    };
  }

  async deletePipeline(id: number): Promise<boolean> {
    await this.executeStatement(
      'DELETE FROM etl_pipelines WHERE id = ?',
      [id]
    );
    
    return true; // If no error was thrown, we assume the deletion was successful
  }

  // Error log operations
  async getErrorLog(id: number): Promise<ErrorLog | undefined> {
    const rows = await this.executeStatement(
      'SELECT * FROM error_logs WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return undefined;
    
    const errorData = rows[0];
    return {
      id: errorData.ID,
      userId: errorData.USER_ID,
      connectionId: errorData.CONNECTION_ID,
      errorMessage: errorData.ERROR_MESSAGE,
      errorCode: errorData.ERROR_CODE,
      errorContext: errorData.ERROR_CONTEXT,
      analysis: errorData.ANALYSIS,
      status: errorData.STATUS,
      timestamp: errorData.TIMESTAMP
    };
  }

  async getErrorLogsByUserId(userId: number, limit = 10): Promise<ErrorLog[]> {
    const rows = await this.executeStatement(
      'SELECT * FROM error_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
    
    return rows.map(errorData => ({
      id: errorData.ID,
      userId: errorData.USER_ID,
      connectionId: errorData.CONNECTION_ID,
      errorMessage: errorData.ERROR_MESSAGE,
      errorCode: errorData.ERROR_CODE,
      errorContext: errorData.ERROR_CONTEXT,
      analysis: errorData.ANALYSIS,
      status: errorData.STATUS,
      timestamp: errorData.TIMESTAMP
    }));
  }

  async createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog> {
    const rows = await this.executeStatement(
      `INSERT INTO error_logs 
       (user_id, connection_id, error_message, error_code, error_context, status) 
       VALUES (?, ?, ?, ?, ?, ?) 
       RETURNING *`,
      [
        errorLog.userId,
        errorLog.connectionId,
        errorLog.errorMessage,
        errorLog.errorCode || null,
        errorLog.errorContext || null,
        errorLog.status || 'NEW'
      ]
    );
    
    const errorData = rows[0];
    return {
      id: errorData.ID,
      userId: errorData.USER_ID,
      connectionId: errorData.CONNECTION_ID,
      errorMessage: errorData.ERROR_MESSAGE,
      errorCode: errorData.ERROR_CODE,
      errorContext: errorData.ERROR_CONTEXT,
      analysis: errorData.ANALYSIS,
      status: errorData.STATUS,
      timestamp: errorData.TIMESTAMP
    };
  }

  async updateErrorLog(id: number, errorLog: Partial<ErrorLog>): Promise<ErrorLog | undefined> {
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (errorLog.errorMessage !== undefined) {
      updates.push('error_message = ?');
      values.push(errorLog.errorMessage);
    }
    
    if (errorLog.errorCode !== undefined) {
      updates.push('error_code = ?');
      values.push(errorLog.errorCode);
    }
    
    if (errorLog.errorContext !== undefined) {
      updates.push('error_context = ?');
      values.push(errorLog.errorContext);
    }
    
    if (errorLog.analysis !== undefined) {
      updates.push('analysis = PARSE_JSON(?)');
      values.push(JSON.stringify(errorLog.analysis));
    }
    
    if (errorLog.status !== undefined) {
      updates.push('status = ?');
      values.push(errorLog.status);
    }
    
    if (updates.length === 0) {
      return this.getErrorLog(id);
    }
    
    // Add the ID to the values array
    values.push(id);
    
    const rows = await this.executeStatement(
      `UPDATE error_logs SET ${updates.join(', ')} WHERE id = ? RETURNING *`,
      values
    );
    
    if (rows.length === 0) return undefined;
    
    const errorData = rows[0];
    return {
      id: errorData.ID,
      userId: errorData.USER_ID,
      connectionId: errorData.CONNECTION_ID,
      errorMessage: errorData.ERROR_MESSAGE,
      errorCode: errorData.ERROR_CODE,
      errorContext: errorData.ERROR_CONTEXT,
      analysis: errorData.ANALYSIS,
      status: errorData.STATUS,
      timestamp: errorData.TIMESTAMP
    };
  }

  // Activity log operations
  async getActivityLogs(userId: number, limit = 10): Promise<ActivityLog[]> {
    const rows = await this.executeStatement(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
    
    return rows.map(activityData => ({
      id: activityData.ID,
      userId: activityData.USER_ID,
      activityType: activityData.ACTIVITY_TYPE,
      description: activityData.DESCRIPTION,
      details: activityData.DETAILS,
      timestamp: activityData.TIMESTAMP
    }));
  }

  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    const rows = await this.executeStatement(
      `INSERT INTO activity_logs 
       (user_id, activity_type, description, details) 
       VALUES (?, ?, ?, PARSE_JSON(?)) 
       RETURNING *`,
      [
        activityLog.userId,
        activityLog.activityType,
        activityLog.description,
        activityLog.details ? JSON.stringify(activityLog.details) : '{}'
      ]
    );
    
    const activityData = rows[0];
    return {
      id: activityData.ID,
      userId: activityData.USER_ID,
      activityType: activityData.ACTIVITY_TYPE,
      description: activityData.DESCRIPTION,
      details: activityData.DETAILS,
      timestamp: activityData.TIMESTAMP
    };
  }
}