import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export class RedisClient {
  private client: Redis | null = null;

  async connect(): Promise<void> {
    this.client = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      retryStrategy: (times) => {
        if (times > 10) {
          logger.error('Max Redis connection retries reached');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });

    // Проверка соединения
    await this.client.ping();
    logger.info('Redis connection verified');
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Disconnected from Redis');
    }
  }
}

export const redisClient = new RedisClient();
