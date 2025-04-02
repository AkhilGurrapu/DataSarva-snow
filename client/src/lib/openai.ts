import { apiRequest } from './queryClient';

export const openaiClient = {
  async analyzeQuery(connectionId: number, query: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/analyze-query`, {
      query,
    });
    return response;
  },

  async analyzeError(connectionId: number, errorMessage: string, errorCode?: string, errorContext?: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/analyze-error`, {
      errorMessage,
      errorCode,
      errorContext,
    });
    return response;
  },

  async generateEtlPipeline(
    connectionId: number,
    sourceTable: string,
    targetTable: string,
    transformations: string[]
  ) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/generate-etl`, {
      sourceTable,
      targetTable,
      transformations,
    });
    return response;
  },

  async checkDataFreshness(
    connectionId: number,
    tableName: string,
    expectedUpdateFrequency: string
  ) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/check-data-freshness`, {
      tableName,
      expectedUpdateFrequency,
    });
    return response;
  },

  async detectAnomalies(
    connectionId: number,
    tableName: string
  ) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/detect-anomalies`, {
      tableName,
    });
    return response;
  },

  async generateDataObservabilityReport(connectionId: number) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/generate-observability-report`, {});
    return response;
  },

  async monitorTableHealth(connectionId: number, tableName: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/monitor-table-health`, {
      tableName,
    });
    return response;
  },

  async getDataQualityScore(connectionId: number, databaseName?: string) {
    const response = await apiRequest('POST', `/api/snowflake/${connectionId}/get-data-quality-score`, {
      databaseName,
    });
    return response;
  }
};