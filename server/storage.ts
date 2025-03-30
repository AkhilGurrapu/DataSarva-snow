import {
  users, type User, type InsertUser,
  snowflakeConnections, type SnowflakeConnection, type InsertConnection,
  queryHistory, type QueryHistory, type InsertQueryHistory,
  etlPipelines, type EtlPipeline, type InsertEtlPipeline,
  errorLogs, type ErrorLog, type InsertErrorLog,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Snowflake connection operations
  getConnection(id: number): Promise<SnowflakeConnection | undefined>;
  getConnectionsByUserId(userId: number): Promise<SnowflakeConnection[]>;
  createConnection(connection: InsertConnection): Promise<SnowflakeConnection>;
  updateConnection(id: number, connection: Partial<SnowflakeConnection>): Promise<SnowflakeConnection | undefined>;
  deleteConnection(id: number): Promise<boolean>;
  
  // Query history operations
  getQueryHistory(id: number): Promise<QueryHistory | undefined>;
  getQueryHistoryByUserId(userId: number, limit?: number): Promise<QueryHistory[]>;
  createQueryHistory(history: InsertQueryHistory): Promise<QueryHistory>;
  
  // ETL pipeline operations
  getPipeline(id: number): Promise<EtlPipeline | undefined>;
  getPipelinesByUserId(userId: number): Promise<EtlPipeline[]>;
  createPipeline(pipeline: InsertEtlPipeline): Promise<EtlPipeline>;
  updatePipeline(id: number, pipeline: Partial<EtlPipeline>): Promise<EtlPipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;
  
  // Error log operations
  getErrorLog(id: number): Promise<ErrorLog | undefined>;
  getErrorLogsByUserId(userId: number, limit?: number): Promise<ErrorLog[]>;
  createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog>;
  updateErrorLog(id: number, errorLog: Partial<ErrorLog>): Promise<ErrorLog | undefined>;
  
  // Activity log operations
  getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, SnowflakeConnection>;
  private queryHistories: Map<number, QueryHistory>;
  private etlPipelines: Map<number, EtlPipeline>;
  private errorLogs: Map<number, ErrorLog>;
  private activityLogs: Map<number, ActivityLog>;
  private currentIds: {
    user: number;
    connection: number;
    queryHistory: number;
    etlPipeline: number;
    errorLog: number;
    activityLog: number;
  };

  constructor() {
    this.users = new Map();
    this.connections = new Map();
    this.queryHistories = new Map();
    this.etlPipelines = new Map();
    this.errorLogs = new Map();
    this.activityLogs = new Map();
    this.currentIds = {
      user: 1,
      connection: 1,
      queryHistory: 1,
      etlPipeline: 1,
      errorLog: 1,
      activityLog: 1
    };
    
    // Create a demo user
    const demoUser: User = {
      id: 1,
      username: "demo",
      password: "password123", // In a real app, this would be hashed
      email: "demo@example.com",
      fullName: null,
      role: "user"
    };
    this.users.set(demoUser.id, demoUser);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { 
      ...insertUser, 
      id,
      role: "user",
      fullName: insertUser.fullName || null
    };
    this.users.set(id, user);
    return user;
  }

  // Snowflake connection operations
  async getConnection(id: number): Promise<SnowflakeConnection | undefined> {
    return this.connections.get(id);
  }

  async getConnectionsByUserId(userId: number): Promise<SnowflakeConnection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.userId === userId
    );
  }

  async createConnection(insertConnection: InsertConnection): Promise<SnowflakeConnection> {
    const id = this.currentIds.connection++;
    const createdAt = new Date();
    const connection: SnowflakeConnection = { 
      id,
      userId: insertConnection.userId,
      name: insertConnection.name,
      account: insertConnection.account,
      username: insertConnection.username,
      password: insertConnection.password,
      role: insertConnection.role || "ACCOUNTADMIN",
      warehouse: insertConnection.warehouse || "COMPUTE_WH",
      isActive: false, 
      createdAt 
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnection(id: number, connectionData: Partial<SnowflakeConnection>): Promise<SnowflakeConnection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, ...connectionData };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async deleteConnection(id: number): Promise<boolean> {
    return this.connections.delete(id);
  }

  // Query history operations
  async getQueryHistory(id: number): Promise<QueryHistory | undefined> {
    return this.queryHistories.get(id);
  }

  async getQueryHistoryByUserId(userId: number, limit = 10): Promise<QueryHistory[]> {
    return Array.from(this.queryHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createQueryHistory(insertHistory: InsertQueryHistory): Promise<QueryHistory> {
    const id = this.currentIds.queryHistory++;
    const timestamp = new Date();
    const history: QueryHistory = { 
      id,
      userId: insertHistory.userId,
      connectionId: insertHistory.connectionId,
      originalQuery: insertHistory.originalQuery,
      optimizedQuery: insertHistory.optimizedQuery || null,
      executionTimeOriginal: insertHistory.executionTimeOriginal || null,
      executionTimeOptimized: insertHistory.executionTimeOptimized || null,
      suggestions: insertHistory.suggestions || {},
      bytesScanned: insertHistory.bytesScanned || null,
      timestamp
    };
    this.queryHistories.set(id, history);
    return history;
  }

  // ETL pipeline operations
  async getPipeline(id: number): Promise<EtlPipeline | undefined> {
    return this.etlPipelines.get(id);
  }

  async getPipelinesByUserId(userId: number): Promise<EtlPipeline[]> {
    return Array.from(this.etlPipelines.values()).filter(
      (pipeline) => pipeline.userId === userId
    );
  }

  async createPipeline(insertPipeline: InsertEtlPipeline): Promise<EtlPipeline> {
    const id = this.currentIds.etlPipeline++;
    const createdAt = new Date();
    const pipeline: EtlPipeline = { 
      id,
      name: insertPipeline.name,
      userId: insertPipeline.userId,
      connectionId: insertPipeline.connectionId,
      sourceDescription: insertPipeline.sourceDescription,
      targetDescription: insertPipeline.targetDescription,
      pipelineCode: insertPipeline.pipelineCode,
      status: insertPipeline.status || "INACTIVE",
      description: insertPipeline.description || null,
      businessRequirements: insertPipeline.businessRequirements || null,
      schedule: insertPipeline.schedule || null,
      lastRunTime: null, 
      lastRunStatus: null, 
      createdAt 
    };
    this.etlPipelines.set(id, pipeline);
    return pipeline;
  }

  async updatePipeline(id: number, pipelineData: Partial<EtlPipeline>): Promise<EtlPipeline | undefined> {
    const pipeline = this.etlPipelines.get(id);
    if (!pipeline) return undefined;
    
    const updatedPipeline = { ...pipeline, ...pipelineData };
    this.etlPipelines.set(id, updatedPipeline);
    return updatedPipeline;
  }

  async deletePipeline(id: number): Promise<boolean> {
    return this.etlPipelines.delete(id);
  }

  // Error log operations
  async getErrorLog(id: number): Promise<ErrorLog | undefined> {
    return this.errorLogs.get(id);
  }

  async getErrorLogsByUserId(userId: number, limit = 10): Promise<ErrorLog[]> {
    return Array.from(this.errorLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createErrorLog(insertErrorLog: InsertErrorLog): Promise<ErrorLog> {
    const id = this.currentIds.errorLog++;
    const timestamp = new Date();
    const errorLog: ErrorLog = { 
      id,
      userId: insertErrorLog.userId,
      connectionId: insertErrorLog.connectionId,
      errorMessage: insertErrorLog.errorMessage,
      errorCode: insertErrorLog.errorCode || null,
      errorContext: insertErrorLog.errorContext || null,
      status: insertErrorLog.status || "NEW",
      analysis: null, 
      timestamp 
    };
    this.errorLogs.set(id, errorLog);
    return errorLog;
  }

  async updateErrorLog(id: number, logData: Partial<ErrorLog>): Promise<ErrorLog | undefined> {
    const log = this.errorLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.errorLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Activity log operations
  async getActivityLogs(userId: number, limit = 10): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentIds.activityLog++;
    const timestamp = new Date();
    const activityLog: ActivityLog = {
      id,
      userId: insertActivityLog.userId,
      description: insertActivityLog.description,
      activityType: insertActivityLog.activityType,
      details: insertActivityLog.details || {},
      timestamp
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
}

// The MemStorage class is already exported above
