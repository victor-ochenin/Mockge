import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from './server';
import { MockStateService } from './services/mockState';
import { Schema } from './types/schema';
import type { FastifyInstance } from 'fastify';

// Интеграционные тесты с использованием тестового экземпляра Redis
describe('Integration Tests', () => {
  let server: FastifyInstance;
  let mockStateService: MockStateService;
  let redisData: Map<string, string>;

  // Мок Redis для интеграционных тестов
  const createMockRedis = () => ({
    data: redisData,
    get: async (key: string) => redisData.get(key) || null,
    set: async (key: string, value: string) => {
      redisData.set(key, value);
      return 'OK';
    },
    incr: async (key: string) => {
      const current = parseInt(redisData.get(key) || '0', 10);
      redisData.set(key, (current + 1).toString());
      return current + 1;
    },
    expire: async () => 'OK',
    del: async (key: string) => {
      redisData.delete(key);
      return 1;
    },
    ping: async () => 'PONG',
    quit: async () => {},
    on: () => {},
    connect: async () => {},
  });

  beforeEach(async () => {
    redisData = new Map<string, string>();
    const mockRedis = createMockRedis();
    mockStateService = new MockStateService(mockRedis as never);
    server = await createServer(mockStateService);

    // Сохраняем тестовую схему
    const testSchema: Schema = {
      id: 'test_schema',
      name: 'Test API',
      entities: [
        {
          id: 'entity_user',
          name: 'User',
          fields: [
            { id: 'f1', name: 'id', type: 'uuid', primary: true },
            { id: 'f2', name: 'email', type: 'email', required: true },
            { id: 'f3', name: 'name', type: 'string' },
          ],
        },
        {
          id: 'entity_product',
          name: 'Product',
          fields: [
            { id: 'f1', name: 'id', type: 'uuid', primary: true },
            { id: 'f2', name: 'name', type: 'string' },
            { id: 'f3', name: 'price', type: 'number', min: 1, max: 1000 },
          ],
        },
      ],
      endpoints: {
        User: {
          list: '/users',
          detail: '/users/:id',
          create: '/users',
          update: '/users/:id',
          delete: '/users/:id',
        },
        Product: {
          list: '/products',
          detail: '/products/:id',
          create: '/products',
          update: '/products/:id',
          delete: '/products/:id',
        },
      },
      settings: {
        stateful: true,
        defaultLatency: 0,
        errorRate: 0,
      },
    };

    await mockStateService.saveSchema('test-project', testSchema);
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    it('должен возвращать статус ok на /health', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });
  });

  describe('Mock Server - локальная разработка (localhost)', () => {
    it('должен возвращать список пользователей для localhost с дефолтной схемой', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost',
        },
      });

      // localhost теперь использует дефолтную схему для разработки
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
    });

    it('должен возвращать список продуктов для localhost', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/products',
        headers: {
          host: 'localhost',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
    });

    it('должен работать с localhost после сохранения схемы для default (приоритет пользовательской схемы)', async () => {
      // Сохраняем схему для 'default' поддомена
      const defaultSchema: Schema = {
        id: 'default_schema',
        name: 'Default API',
        entities: [
          {
            id: 'entity_user',
            name: 'User',
            fields: [
              { id: 'f1', name: 'id', type: 'uuid', primary: true },
              { id: 'f2', name: 'email', type: 'email', required: true },
              { id: 'f3', name: 'name', type: 'string' },
            ],
          },
        ],
        endpoints: {
          User: {
            list: '/users',
            detail: '/users/:id',
            create: '/users',
            update: '/users/:id',
            delete: '/users/:id',
          },
        },
        settings: {
          stateful: true,
          defaultLatency: 0,
          errorRate: 0,
        },
      };

      await mockStateService.saveSchema('default', defaultSchema);

      const response = await server.inject({
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
    });
  });

  describe('Mock Server - с поддоменом', () => {
    it('должен возвращать 404 для несуществующего проекта', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users',
        headers: {
          host: 'non-existent.mockge.io',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('должен возвращать список пользователей для существующего проекта', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users',
        headers: {
          host: 'test-project.mockge.io',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('должен создавать нового пользователя через POST', async () => {
      const newUser = {
        email: 'custom@example.com',
        name: 'Custom User',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/users',
        headers: {
          host: 'test-project.mockge.io',
          'content-type': 'application/json',
        },
        payload: JSON.stringify(newUser),
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('custom@example.com');
      expect(body.name).toBe('Custom User');
      expect(body).toHaveProperty('id');
    });

    it('должен возвращать список продуктов', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/products',
        headers: {
          host: 'test-project.mockge.io',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
    });

    it('должен добавлять CORS заголовки для GET запросов', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users',
        headers: {
          host: 'test-project.mockge.io',
          origin: 'http://localhost:3000',
        },
      });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
