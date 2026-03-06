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
 * localhost:3000/users -> null (для локальной разработки без схемы)
 */
function parseSubdomain(hostname: string): string | null {
  // Удаляем порт из hostname (если есть)
  const hostWithoutPort = hostname.split(':')[0];

  // Для localhost и 127.0.0.1 возвращаем null - локальная разработка без обязательной схемы
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null;
  }

  const parts = hostWithoutPort.split('.');
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
  // Используем pathname без query строки
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const method = request.method;
  const host = request.hostname.split(':')[0];

  // Проверка на локальную разработку (localhost без схемы)
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  // Используем 'localhost' как subdomain для локальных запросов
  const effectiveSubdomain = subdomain || 'localhost';

  logger.info({ subdomain, effectiveSubdomain, pathname, method, isLocalhost }, 'Incoming mock request');

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
  let schema = subdomain ? await stateService.getSchema(subdomain) : null;

  // Для localhost без схемы создаем тестовую схему
  if (!schema && isLocalhost) {
    schema = {
      id: 'localhost_default_schema',
      name: 'Localhost Default API',
      entities: [
        {
          id: 'entity_user',
          name: 'User',
          fields: [
            { id: 'f1', name: 'id', type: 'uuid', primary: true },
            { id: 'f2', name: 'email', type: 'email', required: true },
            { id: 'f3', name: 'name', type: 'string' },
            { id: 'f4', name: 'age', type: 'number', min: 18, max: 80 },
          ],
        },
        {
          id: 'entity_product',
          name: 'Product',
          fields: [
            { id: 'f1', name: 'id', type: 'uuid', primary: true },
            { id: 'f2', name: 'name', type: 'string' },
            { id: 'f3', name: 'price', type: 'number', min: 1, max: 1000 },
            { id: 'f4', name: 'description', type: 'string' },
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
        maxItems: 10,
      },
    };
    logger.info('Using default schema for localhost development');
  }

  if (!schema) {
    const errorMsg = subdomain
      ? `Mock server "${subdomain}" not found. Deploy your schema first.`
      : 'Subdomain is required. Use format: project123.mockge.io or use localhost for development with default schema.';
    
    logger.warn({ subdomain }, 'Mock server not found');
    return reply.status(404).send({
      error: 'Not Found',
      message: errorMsg,
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
    await stateService.incrementErrorCount(effectiveSubdomain);
    logger.warn({ subdomain: effectiveSubdomain }, 'Simulated error');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Simulated error based on errorRate setting',
    });
  }

  // 4. Парсим путь для определения сущности и ID
  const pathParts = pathname.split('/').filter(Boolean);
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
          data = await stateService.getById(effectiveSubdomain, entity.name, id);
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
          data = await stateService.getState(effectiveSubdomain, entity.name);
        }

        // Поддержка пагинации
        const query = request.query as Record<string, string>;
        logger.info({ query }, 'Query params');
        const page = parseInt(query.page || query._page || '1', 10);
        const limit = parseInt(query.limit || query._limit || '10', 10);

        // Если состояние пустое или не stateful, генерируем данные с учетом пагинации
        if (!data || (Array.isArray(data) && data.length === 0)) {
          const total = schema.settings?.maxItems || 10;
          // Генерируем только нужное количество элементов для текущей страницы
          const count = Math.min(limit, total - (page - 1) * limit);
          if (count > 0) {
            data = generateEntityArray(entity, count);
          } else {
            data = [];
          }
          data = {
            data: data,
            pagination: {
              page,
              limit,
              total,
            },
          };
        } else if (Array.isArray(data)) {
          // Если данные есть в state, применяем пагинацию
          const total = data.length;
          const start = (page - 1) * limit;
          const end = start + limit;
          data = {
            data: data.slice(start, end),
            pagination: {
              page,
              limit,
              total,
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
        await stateService.addToState(effectiveSubdomain, entity.name, newItem);
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
        effectiveSubdomain,
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

      const deleted = await stateService.deleteFromState(effectiveSubdomain, entity.name, id);

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
    await stateService.incrementRequestCount(effectiveSubdomain);

    // 7. Отправляем ответ
    return reply.send(data);
  } catch (error) {
    logger.error({ error, subdomain: effectiveSubdomain, pathname }, 'Error processing mock request');
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
    querystringParser: (str: string) => {
      const parsed = new URLSearchParams(str);
      const obj: Record<string, string> = {};
      for (const [key, value] of parsed.entries()) {
        obj[key] = value;
      }
      return obj;
    },
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
