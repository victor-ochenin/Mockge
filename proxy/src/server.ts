import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { redisClient } from './database/redis';
import { MockStateService } from './services/mockState';
import { generateEntity, generateEntityArray } from './services/generator';
import { Schema } from './types/schema';
import { v4 as uuidv4 } from 'uuid';

// Расширяем интерфейс запроса для хранения поддомена
declare module 'fastify' {
  interface FastifyRequest {
    subdomain?: string;
  }
}

// Расширяем интерфейс FastifyInstance для хранения сервиса
declare module 'fastify' {
  interface FastifyInstance {
    mockStateService?: MockStateService;
  }
}

/**
 * Парсит поддомен из hostname
 * project123.mockge.io -> project123
 */
function parseSubdomain(hostname: string): string | null {
  // Игнорируем localhost и IP-адреса
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Возвращаем первую часть (поддомен)
    return parts[0];
  }

  return null;
}

/**
 * Находит сущность в схеме по имени
 * Поддерживает множественное число (users -> User)
 */
function findEntity(schema: Schema, entityName: string) {
  // Прямое совпадение
  const exactMatch = schema.entities.find((e) => e.name.toLowerCase() === entityName.toLowerCase());
  if (exactMatch) {
    return exactMatch;
  }

  // Пробуем убрать 's' в конце для множественного числа
  if (entityName.endsWith('s')) {
    const singular = entityName.slice(0, -1);
    return schema.entities.find((e) => e.name.toLowerCase() === singular.toLowerCase());
  }

  return undefined;
}

/**
 * Основной обработчик запросов к мок-серверу
 */
async function handleMockRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const subdomain = request.subdomain;
  const path = request.url;
  const method = request.method;

  if (!subdomain) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Subdomain is required. Use format: project123.mockge.io',
    });
  }

  logger.info({ subdomain, path, method }, 'Incoming mock request');

  // Получаем сервис из экземпляра сервера
  const stateService = request.server.mockStateService;
  if (!stateService) {
    logger.error('MockStateService not initialized');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Service not initialized',
    });
  }

  // 1. Получаем схему из Redis
  const schema = await stateService.getSchema(subdomain);

  if (!schema) {
    logger.warn({ subdomain }, 'Mock server not found');
    return reply.status(404).send({
      error: 'Not Found',
      message: `Mock server "${subdomain}" not found. Deploy your schema first.`,
    });
  }

  // 2. Имитация задержки
  const latency = schema.settings?.defaultLatency || 0;
  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  // 3. Имитация ошибок
  const errorRate = schema.settings?.errorRate || 0;
  if (Math.random() < errorRate) {
    await stateService.incrementErrorCount(subdomain);
    logger.warn({ subdomain }, 'Simulated error');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Simulated error based on errorRate setting',
    });
  }

  // 4. Парсим путь для определения сущности и ID
  const pathParts = path.split('/').filter(Boolean);
  const entityName = pathParts[0];
  const id = pathParts[1];

  if (!entityName) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Entity name is required',
    });
  }

  const entity = findEntity(schema, entityName);

  if (!entity) {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Entity "${entityName}" not found in schema`,
    });
  }

  // 5. Обработка запросов в зависимости от метода
  let data: unknown;

  try {
    if (method === 'GET') {
      if (id) {
        // GET /users/:id - одна сущность
        if (schema.settings?.stateful) {
          data = await stateService.getById(subdomain, entity.name, id);
          if (!data) {
            return reply.status(404).send({
              error: 'Not Found',
              message: `Entity with id "${id}" not found`,
            });
          }
        } else {
          // Генерируем новую сущность
          data = generateEntity(entity);
        }
      } else {
        // GET /users - список сущностей
        const stateful = schema.settings?.stateful;
        if (stateful) {
          data = await stateService.getState(subdomain, entity.name);
        }

        // Если состояние пустое или не stateful, генерируем данные
        if (!data || (Array.isArray(data) && data.length === 0)) {
          const count = schema.settings?.maxItems || 10;
          data = generateEntityArray(entity, count);
        }

        // Поддержка пагинации
        const page = parseInt((request.query as Record<string, string>).page || '1', 10);
        const limit = parseInt((request.query as Record<string, string>).limit || '10', 10);

        if (Array.isArray(data)) {
          const start = (page - 1) * limit;
          const end = start + limit;
          data = {
            data: data.slice(start, end),
            pagination: {
              page,
              limit,
              total: data.length,
            },
          };
        }
      }
    } else if (method === 'POST') {
      // POST /users - создание сущности
      const body = request.body as Record<string, unknown> | undefined;
      const newItem = {
        id: uuidv4(),
        ...generateEntity(entity),
        ...body,
        createdAt: new Date().toISOString(),
      };

      if (schema.settings?.stateful) {
        await stateService.addToState(subdomain, entity.name, newItem);
      }

      data = newItem;
      return reply.status(201).send(data);
    } else if (method === 'PUT' || method === 'PATCH') {
      // PUT/PATCH /users/:id - обновление
      if (!id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'ID is required for update',
        });
      }

      const body = request.body as Record<string, unknown>;
      const updated = await stateService.updateInState(
        subdomain,
        entity.name,
        id,
        { ...body, updatedAt: new Date().toISOString() }
      );

      if (!updated) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Entity with id "${id}" not found`,
        });
      }

      data = updated;
    } else if (method === 'DELETE') {
      // DELETE /users/:id - удаление
      if (!id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'ID is required for delete',
        });
      }

      const deleted = await stateService.deleteFromState(subdomain, entity.name, id);

      if (!deleted) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Entity with id "${id}" not found`,
        });
      }

      return reply.status(204).send();
    } else {
      return reply.status(405).send({
        error: 'Method Not Allowed',
        message: `Method ${method} is not supported`,
      });
    }

    // 6. Инкрементируем счётчик запросов
    await stateService.incrementRequestCount(subdomain);

    // 7. Отправляем ответ
    return reply.send(data);
  } catch (error) {
    logger.error({ error, subdomain, path }, 'Error processing mock request');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Error processing request',
    });
  }
}

/**
 * Создаёт и настраивает Fastify сервер
 */
export async function createServer(mockStateService?: MockStateService): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
  });

  // Добавляем сервис в экземпляр сервера
  if (mockStateService) {
    server.decorate('mockStateService', mockStateService);
  }

  // Rate Limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost'], // Исключаем локальные запросы
  });

  // Middleware для парсинга поддомена
  server.addHook('onRequest', async (request) => {
    const host = request.hostname;
    request.subdomain = parseSubdomain(host) || undefined;
  });

  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // CORS для мок-запросов (после health check)
  await server.register(cors, {
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Главный обработчик всех запросов к мокам (только для не- OPTIONS запросов)
  server.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/*',
    handler: handleMockRequest,
  });

  return server;
}

/**
 * Запускает сервер
 */
export async function startServer(): Promise<void> {
  try {
    // Подключение к Redis
    await redisClient.connect();

    // Инициализация сервиса состояния
    const stateService = new MockStateService(redisClient.getClient());

    // Создание сервера
    const server = await createServer(stateService);

    // Запуск
    await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 Mockge Proxy Server started on port ${config.port}`);
    logger.info(`📍 Health check: http://localhost:${config.port}/health`);
    logger.info(`🔗 Redis: ${config.redisHost}:${config.redisPort}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await server.close();
      await redisClient.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}
