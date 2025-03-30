import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const snowflakeConnections = pgTable("snowflake_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  account: text("account").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").default("ACCOUNTADMIN"),
  warehouse: text("warehouse").default("COMPUTE_WH"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(snowflakeConnections).pick({
  userId: true,
  name: true,
  account: true,
  username: true,
  password: true,
  role: true,
  warehouse: true,
});

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type SnowflakeConnection = typeof snowflakeConnections.$inferSelect;

export const queryHistory = pgTable("query_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  originalQuery: text("original_query").notNull(),
  optimizedQuery: text("optimized_query"),
  executionTimeOriginal: integer("execution_time_original"),
  executionTimeOptimized: integer("execution_time_optimized"),
  suggestions: jsonb("suggestions"),
  bytesScanned: integer("bytes_scanned"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertQueryHistorySchema = createInsertSchema(queryHistory).pick({
  userId: true,
  connectionId: true,
  originalQuery: true,
  optimizedQuery: true,
  executionTimeOriginal: true,
  executionTimeOptimized: true,
  suggestions: true,
  bytesScanned: true,
});

export type InsertQueryHistory = z.infer<typeof insertQueryHistorySchema>;
export type QueryHistory = typeof queryHistory.$inferSelect;

export const etlPipelines = pgTable("etl_pipelines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sourceDescription: text("source_description").notNull(),
  targetDescription: text("target_description").notNull(),
  businessRequirements: text("business_requirements"),
  schedule: text("schedule"),
  pipelineCode: text("pipeline_code").notNull(),
  status: text("status").default("paused").notNull(),
  lastRunTime: integer("last_run_time"),
  lastRunStatus: text("last_run_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEtlPipelineSchema = createInsertSchema(etlPipelines).pick({
  userId: true,
  connectionId: true,
  name: true,
  description: true,
  sourceDescription: true,
  targetDescription: true,
  businessRequirements: true,
  schedule: true,
  pipelineCode: true,
  status: true,
});

export type InsertEtlPipeline = z.infer<typeof insertEtlPipelineSchema>;
export type EtlPipeline = typeof etlPipelines.$inferSelect;

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectionId: integer("connection_id").notNull(),
  errorMessage: text("error_message").notNull(),
  errorCode: text("error_code"),
  errorContext: text("error_context"),
  analysis: jsonb("analysis"),
  status: text("status").default("pending").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).pick({
  userId: true,
  connectionId: true,
  errorMessage: true,
  errorCode: true,
  errorContext: true,
  status: true,
});

export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  activityType: true,
  description: true,
  details: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
