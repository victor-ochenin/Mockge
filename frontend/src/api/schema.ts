import api, { setAuthToken } from './client';

export interface CreateSchemaRequest {
  name: string;
  schemaJson: Record<string, unknown>;
}

export interface Schema {
  id: string;
  projectId: string;
  version: number;
  name: string;
  schemaJson: Record<string, unknown>;
  createdAt: string;
  isActive: boolean;
}

export const schemaApi = {
  getSchemas: async (projectId: string, token: string): Promise<Schema[]> => {
    setAuthToken(token);
    const response = await api.get(`/projects/${projectId}/schemas`);
    return response.data;
  },

  getActiveSchema: async (projectId: string, token: string): Promise<Schema | null> => {
    setAuthToken(token);
    try {
      const response = await api.get(`/projects/${projectId}/schemas/active`);
      return response.data;
    } catch (error) {
      // 404 означает, что активная схема не найдена
      return null;
    }
  },

  getSchema: async (schemaId: string, token: string): Promise<Schema> => {
    setAuthToken(token);
    const response = await api.get(`/schemas/${schemaId}`);
    return response.data;
  },

  createSchema: async (
    projectId: string,
    data: CreateSchemaRequest,
    token: string
  ): Promise<Schema> => {
    setAuthToken(token);
    const response = await api.post(`/projects/${projectId}/schemas`, data);
    return response.data;
  },

  updateSchema: async (
    schemaId: string,
    data: Partial<CreateSchemaRequest>,
    token: string
  ): Promise<Schema> => {
    setAuthToken(token);
    const response = await api.put(`/schemas/${schemaId}`, data);
    return response.data;
  },

  activateSchema: async (schemaId: string, token: string): Promise<void> => {
    setAuthToken(token);
    await api.post(`/schemas/${schemaId}/activate`);
  },

  deploySchema: async (schemaId: string, token: string): Promise<{ deploymentId: string; url: string }> => {
    setAuthToken(token);
    const response = await api.post(`/schemas/${schemaId}/deploy`);
    return response.data;
  },

  exportOpenApi: async (schemaId: string, token: string): Promise<unknown> => {
    setAuthToken(token);
    const response = await api.get(`/schemas/${schemaId}/export/openapi`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
