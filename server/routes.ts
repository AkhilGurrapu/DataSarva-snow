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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Get active connection
      const connections = await storage.getConnectionsByUserId(userId);
      const activeConnection = connections.find(c => c.isActive);
      
      if (!activeConnection) {
        return res.status(400).json({ message: "No active Snowflake connection found" });
      }
      
      try {
        // Set the role to ACCOUNTADMIN for accessing ACCOUNT_USAGE
        await snowflakeService.executeQuery(activeConnection, "USE ROLE ACCOUNTADMIN");
        
        // Query the ACCOUNT_USAGE.QUERY_HISTORY view
        const query = `
          SELECT 
            QUERY_ID,
            QUERY_TEXT,
            START_TIME,
            WAREHOUSE_NAME,
            EXECUTION_TIME,
            COMPILATION_TIME,
            CREDITS_USED_CLOUD_SERVICES,
            QUERY_TYPE,
            DATABASE_NAME,
            SCHEMA_NAME,
            EXECUTION_STATUS,
            ERROR_CODE,
            ERROR_MESSAGE,
            BYTES_SCANNED,
            ROWS_PRODUCED,
            COMPILATION_TIME + EXECUTION_TIME AS TOTAL_ELAPSED_TIME,
            QUEUED_OVERLOAD_TIME
          FROM 
            SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
          WHERE 
            START_TIME >= DATEADD(day, -30, CURRENT_TIMESTAMP())
          ORDER BY 
            START_TIME DESC
          LIMIT ${limit}
        `;
        
        const result = await snowflakeService.executeQuery(activeConnection, query);
        
        if (result && result.results) {
          return res.json(result.results);
        } else {
          return res.json([]);
        }
      } catch (snowflakeError: any) {
        console.error("Error querying Snowflake:", snowflakeError);
        
        // If there's an error with Snowflake, fall back to the local storage
        const queryHistory = await storage.getQueryHistoryByUserId(userId, limit);
        res.json(queryHistory);
      }
    } catch (err: any) {
      console.error("Error in query history endpoint:", err);
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
  
  // Query analysis route
  app.post("/api/analyze-query", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { query, connectionId } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get connections
      const connections = await storage.getConnectionsByUserId(userId);
      let activeConnection;
      
      if (connectionId) {
        // If connectionId is provided, use that connection
        activeConnection = connections.find(c => c.id === parseInt(connectionId));
      } else {
        // Otherwise use the active connection
        activeConnection = connections.find(c => c.isActive);
      }
      
      if (!activeConnection) {
        return res.status(400).json({ message: "No active Snowflake connection found" });
      }
      
      // Try to analyze the query through OpenAI
      const analysis = await openaiService.analyzeQuery(query);
      
      // Save to query history
      try {
        const queryHistoryData: any = {
          userId,
          connectionId: activeConnection.id,
          originalQuery: query,
          optimizedQuery: analysis.optimizedQuery || query,
          suggestions: analysis.suggestions || []
        };
        
        await storage.createQueryHistory(queryHistoryData);
      } catch (historyErr) {
        console.error("Failed to save query history:", historyErr);
        // Continue even if history saving fails
      }
      
      res.json(analysis);
    } catch (err: any) {
      console.error("Error analyzing query:", err);
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

  // Warehouse routes
  app.get("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUserId(userId);
      
      // Make sure there's an active connection
      const activeConnection = connections.find(c => c.isActive);
      
      if (!activeConnection) {
        return res.status(400).json({ message: "No active connection found" });
      }
      
      try {
        // Get warehouse data from Snowflake
        const warehouses = await snowflakeService.getWarehouses(activeConnection);
        return res.json(warehouses);
      } catch (err: any) {
        console.error("Failed to get warehouses from Snowflake:", err);
        return res.status(500).json({ message: `Snowflake error: ${err.message}` });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Get detailed performance data for a specific warehouse
  app.get("/api/warehouse-performance/:warehouseName", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const warehouseName = req.params.warehouseName;
      const period = req.query.period || '30days';
      
      if (!warehouseName) {
        return res.status(400).json({ message: "Warehouse name is required" });
      }
      
      const connections = await storage.getConnectionsByUserId(userId);
      const activeConnection = connections.find(c => c.isActive);
      
      if (!activeConnection) {
        return res.status(400).json({ message: "No active connection found" });
      }
      
      try {
        // Set the role to ACCOUNTADMIN for permissions
        await snowflakeService.executeQuery(activeConnection, "USE ROLE ACCOUNTADMIN");
        
        // Get warehouse details
        const warehouseDetailsQuery = `SHOW WAREHOUSES LIKE '${warehouseName}'`;
        const warehouseDetails = await snowflakeService.executeQuery(activeConnection, warehouseDetailsQuery);
        
        if (!warehouseDetails.results || warehouseDetails.results.length === 0) {
          return res.status(404).json({ message: "Warehouse not found" });
        }
        
        // Get query history for this warehouse
        const daysPeriod = period === '90days' ? 90 : period === '60days' ? 60 : 30;
        
        const queryHistoryQuery = `
          SELECT 
            TO_VARCHAR(DATE_TRUNC('DAY', START_TIME), 'YYYY-MM-DD') as DATE,
            COUNT(*) as QUERY_COUNT,
            AVG(EXECUTION_TIME) / 1000 as AVG_EXECUTION_TIME_SECONDS,
            SUM(EXECUTION_TIME) / 1000 as TOTAL_EXECUTION_TIME_SECONDS,
            AVG(BYTES_SCANNED) / (1024 * 1024 * 1024) as AVG_GB_SCANNED
          FROM 
            SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
          WHERE 
            START_TIME >= DATEADD(day, -${daysPeriod}, CURRENT_TIMESTAMP())
            AND WAREHOUSE_NAME ILIKE '${warehouseName}'
          GROUP BY 
            DATE
          ORDER BY 
            DATE ASC
        `;
        
        const queryHistoryResult = await snowflakeService.executeQuery(activeConnection, queryHistoryQuery);
        
        // Get credit usage data
        const creditQuery = `
          SELECT 
            TO_VARCHAR(DATE_TRUNC('DAY', START_TIME), 'YYYY-MM-DD') as DATE,
            SUM(CREDITS_USED) as CREDITS_USED
          FROM 
            SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
          WHERE 
            START_TIME >= DATEADD(day, -${daysPeriod}, CURRENT_TIMESTAMP())
            AND WAREHOUSE_NAME ILIKE '${warehouseName}'
          GROUP BY 
            DATE
          ORDER BY 
            DATE ASC
        `;
        
        const creditResult = await snowflakeService.executeQuery(activeConnection, creditQuery);
        
        // Calculate metrics for this warehouse
        const warehouse = warehouseDetails.results[0];
        const warehouseSize = warehouse.size || warehouse["size"] || "X-Small";
        
        // Calculate total credits used
        const totalCredits = (creditResult.results && creditResult.results.length > 0)
          ? creditResult.results.reduce((sum: number, day: any) => {
              return sum + Number(day.CREDITS_USED || day["CREDITS_USED"] || 0);
            }, 0)
          : 0;
        
        // Calculate average execution time
        const avgExecTime = (queryHistoryResult.results && queryHistoryResult.results.length > 0) 
          ? queryHistoryResult.results.reduce((sum: number, day: any) => {
              return sum + Number(day.AVG_EXECUTION_TIME_SECONDS || day["AVG_EXECUTION_TIME_SECONDS"] || 0);
            }, 0) / queryHistoryResult.results.length 
          : 0;
        
        // Calculate query count
        const totalQueries = (queryHistoryResult.results && queryHistoryResult.results.length > 0)
          ? queryHistoryResult.results.reduce((sum: number, day: any) => {
              return sum + Number(day.QUERY_COUNT || day["QUERY_COUNT"] || 0);
            }, 0)
          : 0;
        
        // Generate recommendation based on usage patterns
        const currentCost = totalCredits * 3; // Assuming $3 per credit
        let recommendedCost = currentCost;
        let recommendation = "";
        
        const sizeMap: Record<string, { cost: number, index: number }> = {
          "X-Small": { cost: 1, index: 0 },
          "Small": { cost: 2, index: 1 },
          "Medium": { cost: 4, index: 2 },
          "Large": { cost: 8, index: 3 },
          "X-Large": { cost: 16, index: 4 },
          "2X-Large": { cost: 32, index: 5 },
          "3X-Large": { cost: 64, index: 6 },
          "4X-Large": { cost: 128, index: 7 }
        };
        
        // Generate a recommendation based on usage pattern
        const currentSizeInfo = sizeMap[warehouseSize];
        
        if (currentSizeInfo && totalQueries < 100 && currentSizeInfo.index > 0) {
          // Recommend downsizing if low query count and not already smallest size
          const sizes = Object.keys(sizeMap);
          const newSizeKey = sizes[currentSizeInfo.index - 1];
          const newSizeCost = sizeMap[newSizeKey].cost;
          
          recommendedCost = currentCost * (newSizeCost / currentSizeInfo.cost);
          recommendation = `Downsize from ${warehouseSize} to ${newSizeKey}`;
        } else if (totalQueries < 50) {
          // Recommend auto-suspend if very low query count
          recommendedCost = currentCost * 0.7;
          recommendation = "Configure auto-suspend to reduce idle time";
        }
        
        // Calculate potential savings
        const savings = currentCost - recommendedCost;
        const savingsPercentage = (savings / currentCost) * 100;
        
        // Format chart data
        const chartData = (queryHistoryResult.results && queryHistoryResult.results.length > 0)
          ? queryHistoryResult.results.map((day: any) => {
              const date = day.DATE || day["DATE"];
              const creditDay = creditResult.results?.find((c: any) => 
                (c.DATE || c["DATE"]) === date
              );
              
              return {
                date,
                queryCount: Number(day.QUERY_COUNT || day["QUERY_COUNT"] || 0),
                avgExecutionTime: Number(day.AVG_EXECUTION_TIME_SECONDS || day["AVG_EXECUTION_TIME_SECONDS"] || 0).toFixed(2),
                totalExecutionTime: Number(day.TOTAL_EXECUTION_TIME_SECONDS || day["TOTAL_EXECUTION_TIME_SECONDS"] || 0).toFixed(2),
                avgGbScanned: Number(day.AVG_GB_SCANNED || day["AVG_GB_SCANNED"] || 0).toFixed(2),
                creditsUsed: Number(creditDay?.CREDITS_USED || creditDay?.["CREDITS_USED"] || 0).toFixed(2),
                cost: (Number(creditDay?.CREDITS_USED || creditDay?.["CREDITS_USED"] || 0) * 3).toFixed(2)
              };
            })
          : [];
        
        const response = {
          warehouseName,
          warehouseSize,
          metrics: {
            totalQueries,
            avgExecutionTime: avgExecTime,
            totalCredits,
            currentCost,
            recommendedCost,
            savings,
            savingsPercentage,
            recommendation
          },
          chartData
        };
        
        return res.json(response);
      } catch (err: any) {
        console.error("Failed to get warehouse performance data:", err);
        return res.status(500).json({ message: `Snowflake error: ${err.message}` });
      }
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
      
      try {
        // First set the role to ACCOUNTADMIN
        await snowflakeService.executeQuery(activeConnection, "USE ROLE ACCOUNTADMIN");
        
        // Get warehouses
        const warehousesResult = await snowflakeService.executeQuery(activeConnection, "SHOW WAREHOUSES");
        
        if (!warehousesResult.results || warehousesResult.results.length === 0) {
          return res.json([]);
        }
        
        // Get warehouse usage from query history
        const usageQuery = `
          SELECT 
            WAREHOUSE_NAME,
            COUNT(*) as QUERY_COUNT,
            AVG(EXECUTION_TIME) / 1000 as AVG_EXECUTION_TIME_SECONDS,
            SUM(EXECUTION_TIME) / 1000 as TOTAL_EXECUTION_TIME_SECONDS
          FROM 
            SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
          WHERE 
            START_TIME >= DATEADD(day, -30, CURRENT_TIMESTAMP())
            AND WAREHOUSE_NAME IS NOT NULL
          GROUP BY 
            WAREHOUSE_NAME
          ORDER BY 
            TOTAL_EXECUTION_TIME_SECONDS DESC
        `;
        
        const usageResult = await snowflakeService.executeQuery(activeConnection, usageQuery);
        
        // Get warehouse credit usage if possible
        let creditUsageResult;
        try {
          const creditQuery = `
            SELECT 
              WAREHOUSE_NAME, 
              SUM(CREDITS_USED) as TOTAL_CREDITS
            FROM 
              SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
            WHERE 
              START_TIME >= DATEADD(day, -30, CURRENT_TIMESTAMP())
            GROUP BY 
              WAREHOUSE_NAME
          `;
          
          creditUsageResult = await snowflakeService.executeQuery(activeConnection, creditQuery);
        } catch (creditError) {
          console.warn("Could not get credit usage data:", creditError);
          // Continue without credit data
        }
        
        // Build recommendations by analyzing warehouse size, usage patterns, and credits
        const recommendations = [];
        
        for (const warehouse of warehousesResult.results) {
          const warehouseName = warehouse.name || warehouse["name"];
          if (!warehouseName) continue;
          
          // Find usage data for this warehouse
          const usageData = usageResult.results?.find((r: any) => {
            const name = r.WAREHOUSE_NAME || r["WAREHOUSE_NAME"];
            return name && name.toUpperCase() === warehouseName.toUpperCase();
          });
          
          // Find credit data for this warehouse
          const creditData = creditUsageResult?.results?.find((r: any) => {
            const name = r.WAREHOUSE_NAME || r["WAREHOUSE_NAME"];
            return name && name.toUpperCase() === warehouseName.toUpperCase();
          });
          
          // Skip warehouses with no usage data
          if (!usageData) continue;
          
          // Calculate metrics for recommendations
          const queryCount = Number(usageData.QUERY_COUNT || usageData["QUERY_COUNT"] || 0);
          const avgExecutionTime = Number(usageData.AVG_EXECUTION_TIME_SECONDS || usageData["AVG_EXECUTION_TIME_SECONDS"] || 0);
          const totalExecutionTime = Number(usageData.TOTAL_EXECUTION_TIME_SECONDS || usageData["TOTAL_EXECUTION_TIME_SECONDS"] || 0);
          
          // Get warehouse size and estimate if we can downsize
          const warehouseSize = warehouse.size || warehouse["size"] || "X-Small";
          const sizeMap: Record<string, { cost: number, index: number }> = {
            "X-Small": { cost: 1, index: 0 },
            "Small": { cost: 2, index: 1 },
            "Medium": { cost: 4, index: 2 },
            "Large": { cost: 8, index: 3 },
            "X-Large": { cost: 16, index: 4 },
            "2X-Large": { cost: 32, index: 5 },
            "3X-Large": { cost: 64, index: 6 },
            "4X-Large": { cost: 128, index: 7 }
          };
          
          // Credits and costs
          const credits = Number(creditData?.TOTAL_CREDITS || creditData?.["TOTAL_CREDITS"] || 0);
          const currentCost = credits > 0 ? credits * 3 : (sizeMap[warehouseSize]?.cost || 1) * 3 * (totalExecutionTime / 3600);
          
          // Only generate recommendations for warehouses that seem high cost
          if (currentCost < 10) continue;
          
          // Generate recommendation logic:
          // 1. Long-running queries + large warehouse → auto-suspend
          // 2. Low query count + large warehouse → downsize
          
          let recommendedCost = currentCost;
          let recommendation = "";
          let savingsPercentage = 0;
          
          if (avgExecutionTime > 60 && queryCount < 100) {
            // Recommend downsizing
            const currentSizeInfo = sizeMap[warehouseSize];
            if (currentSizeInfo && currentSizeInfo.index > 0) {
              const sizes = Object.keys(sizeMap);
              const newSizeKey = sizes[currentSizeInfo.index - 1];
              const newSizeCost = sizeMap[newSizeKey].cost;
              
              recommendedCost = (credits > 0) 
                ? currentCost * (newSizeCost / currentSizeInfo.cost)
                : newSizeCost * 3 * (totalExecutionTime / 3600);
                
              recommendation = `Downsize from ${warehouseSize} to ${newSizeKey}`;
            }
          } else if (queryCount < 50) {
            // Recommend auto-suspend
            recommendedCost = currentCost * 0.7;
            recommendation = "Configure auto-suspend to reduce idle time";
          } else {
            // No clear recommendation
            continue;
          }
          
          // Calculate savings
          const savings = currentCost - recommendedCost;
          savingsPercentage = (savings / currentCost) * 100;
          
          if (savings > 0) {
            recommendations.push({
              id: recommendations.length + 1,
              warehouseName,
              currentCost: parseFloat(currentCost.toFixed(2)),
              recommendedCost: parseFloat(recommendedCost.toFixed(2)),
              savings: parseFloat(savings.toFixed(2)),
              savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
              recommendation
            });
          }
        }
        
        // Sort by potential savings and limit to top recommendations
        recommendations.sort((a, b) => b.savings - a.savings);
        return res.json(recommendations.slice(0, 5));
        
      } catch (err) {
        // If Snowflake query fails, handle gracefully
        console.error("Failed to get warehouse recommendations from Snowflake:", err);
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
  
  // Get databases from Snowflake
  app.get("/api/snowflake/databases", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUserId(userId);
      
      // Find an active connection
      const activeConnection = connections.find(c => c.isActive);
      if (!activeConnection) {
        return res.status(400).json({ message: "No active Snowflake connection found. Please set a connection as active." });
      }
      
      // Get databases data
      const databases = await snowflakeService.getDatabases(activeConnection);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        activityType: "QUERY_EXECUTED",
        description: "Queried Snowflake databases",
        details: { connectionId: activeConnection.id }
      });
      
      res.json(databases);
    } catch (err: any) {
      console.error("Error querying Snowflake databases:", err);
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
