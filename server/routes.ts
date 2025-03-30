import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage-factory";
import { 
  insertUserSchema, 
  insertConnectionSchema, 
  insertQueryHistorySchema, 
  insertEtlPipelineSchema, 
  insertErrorLogSchema,
  insertActivityLogSchema
} from "@shared/schema";
import { snowflakeService } from "./services/snowflake-service";
import { openaiService } from "./services/openai-service";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Get the initialized storage instance
  const storage = getStorage();

  // Set up memory store for sessions
  const MemoryStoreSession = MemoryStore(session);

  // Set up session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "snow-autopilot-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.password !== password) {
          // In a real app, you would use proper password hashing
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Snowflake connection routes
  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUserId(userId);
      res.json(connections);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        userId
      });
      
      // Test the connection before saving
      try {
        await snowflakeService.testConnection({
          account: connectionData.account,
          username: connectionData.username,
          password: connectionData.password,
          role: connectionData.role || "ACCOUNTADMIN", // Ensure role is not undefined
          warehouse: connectionData.warehouse || "COMPUTE_WH" // Ensure warehouse is not undefined
        });
      } catch (error: any) {
        return res.status(400).json({ message: `Connection failed: ${error.message}` });
      }
      
      const connection = await storage.createConnection(connectionData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "CONNECTION_CREATED",
        description: `Created connection to ${connection.name}`,
        details: { connectionId: connection.id }
      });
      
      res.status(201).json(connection);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedConnection = await storage.updateConnection(connectionId, req.body);
      res.json(updatedConnection);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteConnection(connectionId);
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Query optimization routes
  app.post("/api/query-optimize", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { connectionId, query } = req.body;
      
      if (!connectionId || !query) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connection = await storage.getConnection(parseInt(connectionId));
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get execution time of original query
      const originalExecutionResult = await snowflakeService.executeQuery(connection, query);
      
      // Analyze and optimize the query using OpenAI
      const analysis = await openaiService.analyzeQuery(query);
      
      // Execute the optimized query to measure performance
      const optimizedExecutionResult = await snowflakeService.executeQuery(connection, analysis.optimizedQuery);
      
      // Save to query history
      const queryHistoryData: any = {
        userId,
        connectionId,
        originalQuery: query,
        optimizedQuery: analysis.optimizedQuery,
        executionTimeOriginal: originalExecutionResult.executionTime,
        executionTimeOptimized: optimizedExecutionResult.executionTime,
        suggestions: analysis.suggestions,
        bytesScanned: originalExecutionResult.bytesScanned
      };
      
      const queryHistoryEntry = await storage.createQueryHistory(queryHistoryData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "QUERY_OPTIMIZED",
        description: "Query optimized successfully",
        details: {
          queryHistoryId: queryHistoryEntry.id,
          improvement: originalExecutionResult.executionTime - optimizedExecutionResult.executionTime
        }
      });
      
      res.json({
        originalQuery: query,
        optimizedQuery: analysis.optimizedQuery,
        suggestions: analysis.suggestions,
        originalExecutionTime: originalExecutionResult.executionTime,
        optimizedExecutionTime: optimizedExecutionResult.executionTime,
        improvement: (originalExecutionResult.executionTime - optimizedExecutionResult.executionTime) / originalExecutionResult.executionTime * 100
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/query-history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const queryHistory = await storage.getQueryHistoryByUserId(userId, limit);
      res.json(queryHistory);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ETL pipeline routes
  app.get("/api/pipelines", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const pipelines = await storage.getPipelinesByUserId(userId);
      res.json(pipelines);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/pipelines", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { connectionId, sourceDescription, targetDescription, businessRequirements, ...rest } = req.body;
      
      if (!connectionId || !sourceDescription || !targetDescription) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connection = await storage.getConnection(parseInt(connectionId));
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Generate ETL pipeline code
      const pipelineResult = await openaiService.generateEtlPipeline(
        sourceDescription,
        targetDescription,
        businessRequirements || ""
      );
      
      const pipelineData = insertEtlPipelineSchema.parse({
        userId,
        connectionId: parseInt(connectionId),
        sourceDescription,
        targetDescription,
        businessRequirements: businessRequirements || "",
        pipelineCode: pipelineResult.pipelineCode,
        ...rest
      });
      
      const pipeline = await storage.createPipeline(pipelineData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "PIPELINE_CREATED",
        description: `Created ETL pipeline: ${pipeline.name}`,
        details: { pipelineId: pipeline.id }
      });
      
      res.status(201).json(pipeline);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/pipelines/:id", isAuthenticated, async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const pipeline = await storage.getPipeline(pipelineId);
      
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      if (pipeline.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedPipeline = await storage.updatePipeline(pipelineId, req.body);
      res.json(updatedPipeline);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/pipelines/:id", isAuthenticated, async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const pipeline = await storage.getPipeline(pipelineId);
      
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      if (pipeline.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deletePipeline(pipelineId);
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Error analysis routes
  app.post("/api/error-analyze", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { connectionId, errorMessage, errorCode, errorContext } = req.body;
      
      if (!connectionId || !errorMessage) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connection = await storage.getConnection(parseInt(connectionId));
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Analyze error using OpenAI
      const analysis = await openaiService.analyzeErrorLog(errorMessage, errorContext);
      
      // Save error log
      const errorLogData = insertErrorLogSchema.parse({
        userId,
        connectionId: parseInt(connectionId),
        errorMessage,
        errorCode: errorCode || null,
        errorContext: errorContext || null,
        status: "analyzed"
      });
      
      const errorLog = await storage.createErrorLog(errorLogData);
      
      // Update with analysis
      const updatedErrorLog = await storage.updateErrorLog(errorLog.id, {
        analysis: analysis
      });
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "ERROR_ANALYZED",
        description: "Error analyzed successfully",
        details: { errorLogId: errorLog.id }
      });
      
      res.json({
        errorLog: updatedErrorLog,
        analysis
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/error-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const errorLogs = await storage.getErrorLogsByUserId(userId, limit);
      res.json(errorLogs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Activity logs route
  app.get("/api/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activityLogs = await storage.getActivityLogs(userId, limit);
      res.json(activityLogs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Warehouse recommendations
  app.get("/api/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUserId(userId);
      
      // Make sure there's an active connection
      const activeConnection = connections.find(c => c.isActive);
      
      if (!activeConnection) {
        return res.status(400).json({ message: "No active connection found" });
      }
      
      // In a real implementation, this would query Snowflake to get actual usage
      // and generate recommendations based on that data
      try {
        // Get warehouse recommendations from Snowflake
        // This would involve analyzing query patterns, usage metrics, etc.
        const recommendationsQuery = `
          SELECT 
            WAREHOUSE_NAME, 
            CREDITS_USED * 3.0 AS CURRENT_COST, 
            CASE 
              WHEN AVG_RUNNING < 50 THEN CREDITS_USED * 3.0 * 0.6
              WHEN AVG_RUNNING < 70 THEN CREDITS_USED * 3.0 * 0.7
              ELSE CREDITS_USED * 3.0 * 0.8
            END AS RECOMMENDED_COST
          FROM 
            SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
          WHERE 
            START_TIME >= DATEADD(day, -30, CURRENT_TIMESTAMP())
          ORDER BY 
            CREDITS_USED DESC
          LIMIT 5;
        `;
        
        const result = await snowflakeService.executeQuery(activeConnection, recommendationsQuery);
        
        if (result && result.results && result.results.length > 0) {
          // Transform the results into the expected format
          const recommendations = result.results.map((row: any, index: number) => {
            const currentCost = parseFloat(row.CURRENT_COST);
            const recommendedCost = parseFloat(row.RECOMMENDED_COST);
            const savings = currentCost - recommendedCost;
            const savingsPercentage = (savings / currentCost) * 100;
            
            return {
              id: index + 1,
              warehouseName: row.WAREHOUSE_NAME,
              currentCost: currentCost,
              recommendedCost: recommendedCost,
              savings: savings,
              savingsPercentage: savingsPercentage
            };
          });
          
          return res.json(recommendations);
        }
        
        // If the query executed but returned no data, return an empty array
        return res.json([]);
        
      } catch (err) {
        // If Snowflake query fails, handle gracefully
        console.error("Failed to get warehouse recommendations from Snowflake:", err);
        
        // In a real implementation with fallback logic, you might:
        // 1. Try an alternative query
        // 2. Use cached data if available
        // 3. Return empty results with a status
        return res.json([]);
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Stats and dashboard data
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get query history
      const queryHistory = await storage.getQueryHistoryByUserId(userId, 100);
      
      // Get ETL pipelines
      const pipelines = await storage.getPipelinesByUserId(userId);
      
      // Get error logs
      const errorLogs = await storage.getErrorLogsByUserId(userId, 100);
      
      // Calculate stats
      const queriesOptimized = queryHistory.length;
      
      // Calculate cost savings (simple estimate based on time saved)
      const costSavings = queryHistory.reduce((total, query) => {
        if (query.executionTimeOriginal && query.executionTimeOptimized) {
          // Assuming $0.01 per second of compute time saved
          return total + (query.executionTimeOriginal - query.executionTimeOptimized) * 0.01;
        }
        return total;
      }, 0);
      
      // Count active and paused pipelines
      const activePipelines = pipelines.filter(p => p.status === 'active').length;
      const pausedPipelines = pipelines.filter(p => p.status === 'paused').length;
      
      // Count recent errors
      const recentErrorsCount = errorLogs.filter(
        log => log.timestamp && new Date().getTime() - log.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length;
      
      res.json({
        queriesOptimized,
        costSavings,
        etlPipelines: {
          total: pipelines.length,
          active: activePipelines,
          paused: pausedPipelines
        },
        errorsDetected: recentErrorsCount
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/dashboard/performance-data", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const period = req.query.period || '30days';
      
      // Get query history
      const queryHistory = await storage.getQueryHistoryByUserId(userId, 100);
      
      // Group by day
      const performanceData = queryHistory.reduce((acc: any, query) => {
        if (!query.timestamp) return acc;
        
        const day = query.timestamp.toISOString().split('T')[0];
        
        if (!acc[day]) {
          acc[day] = {
            date: day,
            originalTimes: [],
            optimizedTimes: []
          };
        }
        
        if (query.executionTimeOriginal) {
          acc[day].originalTimes.push(query.executionTimeOriginal);
        }
        
        if (query.executionTimeOptimized) {
          acc[day].optimizedTimes.push(query.executionTimeOptimized);
        }
        
        return acc;
      }, {});
      
      // Calculate averages
      const chartData = Object.values(performanceData).map((day: any) => {
        return {
          date: day.date,
          originalTime: day.originalTimes.length > 0 
            ? day.originalTimes.reduce((sum: number, time: number) => sum + time, 0) / day.originalTimes.length 
            : 0,
          optimizedTime: day.optimizedTimes.length > 0 
            ? day.optimizedTimes.reduce((sum: number, time: number) => sum + time, 0) / day.optimizedTimes.length 
            : 0
        };
      });
      
      res.json(chartData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Snowflake account usage tables endpoint
  app.get("/api/snowflake/account-usage/tables", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUserId(userId);
      
      // Find an active connection
      const activeConnection = connections.find(c => c.isActive);
      if (!activeConnection) {
        return res.status(400).json({ message: "No active Snowflake connection found. Please set a connection as active." });
      }
      
      // Get account usage tables data
      const tables = await snowflakeService.getAccountUsageTables(activeConnection);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "QUERY_EXECUTED",
        description: "Queried Snowflake account usage tables",
        details: { connectionId: activeConnection.id }
      });
      
      res.json(tables);
    } catch (err: any) {
      console.error("Error querying Snowflake account usage:", err);
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
