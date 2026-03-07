import api from './client';

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
  getSchemas: async (projectId: string): Promise<Schema[]> => {
    const response = await api.get(`/api/projects/${projectId}/schemas`);
    return response.data;
  },

  getSchema: async (schemaId: string): Promise<Schema> => {
    const response = await api.get(`/api/schemas/${schemaId}`);
    return response.data;
  },

  createSchema: async (
    projectId: string,
    data: CreateSchemaRequest
  ): Promise<Schema> => {
    const response = await api.post(`/api/projects/${projectId}/schemas`, data);
    return response.data;
  },

  updateSchema: async (
    schemaId: string,
    data: Partial<CreateSchemaRequest>
  ): Promise<Schema> => {
    const response = await api.put(`/api/schemas/${schemaId}`, data);
    return response.data;
  },

  activateSchema: async (schemaId: string): Promise<void> => {
    await api.post(`/api/schemas/${schemaId}/activate`);
  },

  deploySchema: async (schemaId: string): Promise<{ deploymentId: string; url: string }> => {
    const response = await api.post(`/api/schemas/${schemaId}/deploy`);
    return response.data;
  },

  exportOpenApi: async (schemaId: string): Promise<unknown> => {
    const response = await api.get(`/api/schemas/${schemaId}/export/openapi`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
