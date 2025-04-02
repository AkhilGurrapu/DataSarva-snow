import OpenAI from "openai";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set");
      throw new Error("OpenAI API key is required");
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  async analyzeQuery(query: string): Promise<{
    suggestions: { title: string; description: string; suggestion: string }[];
    optimizedQuery: string;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a Snowflake SQL optimization expert. Analyze the query for performance issues and suggest improvements. Provide specific suggestions and an optimized version of the query. Return the response in JSON format with 'suggestions' as an array of objects with 'title', 'description', and 'suggestion' fields, and 'optimizedQuery' as the improved SQL query."
          },
          {
            role: "user",
            content: `Analyze this Snowflake query for performance:\n\n${query}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      
      // Ensure each suggestion has a title, description, and suggestion field
      const formattedSuggestions = (result.suggestions || []).map((sugg: any) => ({
        title: sugg.title || "Optimization suggestion",
        description: sugg.description || "No description provided",
        suggestion: sugg.suggestion || sugg.description || "No suggestion provided"
      }));
      
      return {
        suggestions: formattedSuggestions,
        optimizedQuery: result.optimizedQuery || query
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        suggestions: [
          {
            title: "Error analyzing query",
            description: "An error occurred while analyzing the query. Please try again.",
            suggestion: "Try simplifying your query or check for syntax errors before trying again."
          }
        ],
        optimizedQuery: query
      };
    }
  }

  async analyzeErrorLog(
    errorMessage: string,
    context?: string
  ): Promise<{
    rootCause: string;
    solution: string;
    preventionMeasures: string;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a Snowflake troubleshooting expert. Analyze the error message and provide insights. Return the response in JSON format with 'rootCause', 'solution', and 'preventionMeasures' fields."
          },
          {
            role: "user",
            content: `Error message: ${errorMessage}\nContext: ${context || "No additional context provided"}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        rootCause: result.rootCause || "Unknown cause",
        solution: result.solution || "No solution provided",
        preventionMeasures: result.preventionMeasures || "No prevention measures provided"
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        rootCause: "Error analysis failed",
        solution: "Please try again or contact support.",
        preventionMeasures: "N/A"
      };
    }
  }

  async generateEtlPipeline(
    sourceDescription: string,
    targetDescription: string,
    businessRequirements: string
  ): Promise<{
    pipelineCode: string;
    schedulingRecommendations: string;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an ETL pipeline expert for Snowflake. Generate a complete ETL pipeline based on the specifications. Return the response in JSON format with 'pipelineCode' and 'schedulingRecommendations' fields."
          },
          {
            role: "user",
            content: `
              Source System: ${sourceDescription}
              Target System: ${targetDescription}
              Business Requirements: ${businessRequirements}
              
              Generate a complete Snowflake ETL pipeline including:
              1. The SQL to extract data from the source
              2. Any necessary transformations
              3. The loading strategy into the target
              4. Scheduling information and dependencies
            `
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        pipelineCode: result.pipelineCode || "-- No pipeline code generated",
        schedulingRecommendations: result.schedulingRecommendations || "No scheduling recommendations provided"
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        pipelineCode: "-- Error generating pipeline code",
        schedulingRecommendations: "Error occurred during generation. Please try again."
      };
    }
  }

  async recommendWarehouseSize(
    queryText: string,
    dataVolumeGB: number
  ): Promise<{
    recommendedSize: string;
    reasoning: string;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a Snowflake warehouse sizing expert. Analyze the query and data volume to recommend an appropriate warehouse size. Return the response in JSON format with 'recommendedSize' (one of: X-Small, Small, Medium, Large, X-Large, 2X-Large, 3X-Large, 4X-Large) and 'reasoning' fields."
          },
          {
            role: "user",
            content: `
              Query: ${queryText}
              Data Volume (GB): ${dataVolumeGB}
              
              Recommend an appropriate warehouse size based on this information.
            `
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        recommendedSize: result.recommendedSize || "Small",
        reasoning: result.reasoning || "No reasoning provided"
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        recommendedSize: "Small",
        reasoning: "Error occurred during recommendation. Using default size."
      };
    }
  }

  async analyzeDataFreshness(
    tableName: string,
    lastUpdatedTimestamp: string,
    expectedFrequency: string
  ): Promise<{
    status: 'fresh' | 'stale' | 'critical';
    confidence: number;
    recommendation: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a data freshness monitoring expert for Snowflake. Analyze the data freshness and provide insights. Return the response in JSON format with 'status' (one of: 'fresh', 'stale', 'critical'), 'confidence' (a number between 0 and 1), and 'recommendation' fields."
          },
          {
            role: "user",
            content: `
              Table: ${tableName}
              Last Updated: ${lastUpdatedTimestamp}
              Expected Update Frequency: ${expectedFrequency}
              
              Analyze the data freshness and provide a recommendation.
            `
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        status: result.status || "stale",
        confidence: result.confidence || 0.5,
        recommendation: result.recommendation || "No recommendation provided"
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        status: "stale",
        confidence: 0.5,
        recommendation: "Error during analysis. Please check the data manually."
      };
    }
  }

  async detectDataAnomaly(
    tableMetrics: {
      tableName: string;
      rowCount: number;
      distinctValues: Record<string, number>;
      nullPercentages: Record<string, number>;
      historical?: {
        avgRowCount: number;
        avgNullPercentages: Record<string, number>;
      }
    }
  ): Promise<{
    anomalies: Array<{
      column?: string;
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
    overallHealth: number;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a data quality expert for Snowflake. Detect anomalies in the table metrics and provide insights. Return the response in JSON format with 'anomalies' as an array of objects with 'column', 'type', 'severity', 'description', and 'recommendation' fields, and 'overallHealth' as a number between 0 and 1."
          },
          {
            role: "user",
            content: `
              Table Metrics: ${JSON.stringify(tableMetrics, null, 2)}
              
              Detect anomalies in the table metrics and provide a recommendation.
            `
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        anomalies: result.anomalies || [],
        overallHealth: result.overallHealth || 0.5
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        anomalies: [{
          type: "error",
          severity: "medium",
          description: "Error during anomaly detection",
          recommendation: "Please check the data manually."
        }],
        overallHealth: 0.5
      };
    }
  }

  async generateDataObservabilityReport(
    systemData: {
      tables: Array<{
        name: string;
        rowCount: number;
        lastUpdated: string;
        schema: string;
      }>;
      recentErrors: Array<{
        message: string;
        timestamp: string;
      }>;
      queryPerformance: {
        avgExecutionTime: number;
        slowestQueries: number;
      };
    }
  ): Promise<{
    summary: string;
    healthScore: number;
    criticalIssues: Array<{
      title: string;
      description: string;
      recommendation: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      impact: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a data observability expert for Snowflake. Generate a comprehensive data observability report. Return the response in JSON format with 'summary', 'healthScore', 'criticalIssues', and 'recommendations' fields."
          },
          {
            role: "user",
            content: `
              System Data: ${JSON.stringify(systemData, null, 2)}
              
              Generate a comprehensive data observability report.
            `
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Failed to get response from OpenAI");
      }

      const result = JSON.parse(content);
      return {
        summary: result.summary || "No summary provided",
        healthScore: result.healthScore || 0.5,
        criticalIssues: result.criticalIssues || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        summary: "Error generating report",
        healthScore: 0.5,
        criticalIssues: [{
          title: "Error during report generation",
          description: "There was an error generating the data observability report.",
          recommendation: "Please try again or contact support.",
          severity: "medium"
        }],
        recommendations: []
      };
    }
  }
}

export const openaiService = new OpenAIService();
