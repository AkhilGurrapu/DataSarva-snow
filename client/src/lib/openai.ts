import { apiRequest } from "./queryClient";

// This client-side wrapper communicates with the server-side OpenAI service
export const openaiClient = {
  async analyzeQuery(connectionId: number, query: string) {
    try {
      const response = await apiRequest("POST", "/api/query-optimize", {
        connectionId,
        query
      });
      return await response.json();
    } catch (error) {
      console.error("Query analysis failed:", error);
      throw new Error("Failed to analyze query. Please try again.");
    }
  },

  async analyzeError(connectionId: number, errorMessage: string, errorCode?: string, errorContext?: string) {
    try {
      const response = await apiRequest("POST", "/api/error-analyze", {
        connectionId,
        errorMessage,
        errorCode,
        errorContext
      });
      return await response.json();
    } catch (error) {
      console.error("Error analysis failed:", error);
      throw new Error("Failed to analyze error. Please try again.");
    }
  },

  async generateEtlPipeline(
    connectionId: number,
    name: string,
    description: string,
    sourceDescription: string,
    targetDescription: string,
    businessRequirements: string,
    schedule: string
  ) {
    try {
      const response = await apiRequest("POST", "/api/pipelines", {
        connectionId,
        name,
        description,
        sourceDescription,
        targetDescription,
        businessRequirements,
        schedule,
        status: "paused" // Default status for new pipelines
      });
      return await response.json();
    } catch (error) {
      console.error("ETL pipeline generation failed:", error);
      throw new Error("Failed to generate ETL pipeline. Please try again.");
    }
  }
};
