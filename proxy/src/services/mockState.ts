import Redis from 'ioredis';
import { Schema } from '../types/schema';
import { logger } from '../utils/logger';

/**
 * Сервис для работы с данными мок-сервера в Redis
 */
export class MockStateService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Получает схему мок-сервера по поддомену
   */
  async getSchema(subdomain: string): Promise<Schema | null> {
    const key = `mock:${subdomain}:schema`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as Schema;
    } catch (error) {
      logger.error({ error }, 'Error parsing schema');
      return null;
    }
  }

  /**
   * Сохраняет схему мок-сервера
   */
  async saveSchema(subdomain: string, schema: Schema): Promise<void> {
    const key = `mock:${subdomain}:schema`;
    await this.redis.set(key, JSON.stringify(schema));
    logger.info(`Schema saved for subdomain: ${subdomain}`);
  }

  /**
   * Получает состояние для сущности (stateful mock)
   */
  async getState(subdomain: string, entity: string): Promise<Record<string, unknown>[]> {
    const key = `mock:${subdomain}:state:${entity}`;
    const data = await this.redis.get(key);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data) as Record<string, unknown>[];
    } catch (error) {
      logger.error({ error }, 'Error parsing state');
      return [];
    }
  }

  /**
   * Сохраняет состояние для сущности
   */
  async saveState(
    subdomain: string,
    entity: string,
    data: Record<string, unknown>[]
  ): Promise<void> {
    const key = `mock:${subdomain}:state:${entity}`;
    const maxItems = 1000; // Лимит элементов

    // Обрезаем до максимального размера
    const trimmedData = data.slice(-maxItems);

    await this.redis.set(key, JSON.stringify(trimmedData));
    logger.debug(`State saved for ${subdomain}:${entity}`);
  }

  /**
   * Добавляет один объект в состояние
   */
  async addToState(
    subdomain: string,
    entity: string,
    item: Record<string, unknown>
  ): Promise<void> {
    const currentState = await this.getState(subdomain, entity);
    currentState.push(item);
    await this.saveState(subdomain, entity, currentState);
  }

  /**
   * Обновляет объект в состоянии по ID
   */
  async updateInState(
    subdomain: string,
    entity: string,
    id: string,
    updates: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const currentState = await this.getState(subdomain, entity);
    const index = currentState.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    currentState[index] = { ...currentState[index], ...updates };
    await this.saveState(subdomain, entity, currentState);

    return currentState[index];
  }

  /**
   * Удаляет объект из состояния по ID
   */
  async deleteFromState(
    subdomain: string,
    entity: string,
    id: string
  ): Promise<boolean> {
    const currentState = await this.getState(subdomain, entity);
    const initialLength = currentState.length;
    const newState = currentState.filter((item) => item.id !== id);

    if (newState.length === initialLength) {
      return false;
    }

    await this.saveState(subdomain, entity, newState);
    return true;
  }

  /**
   * Получает объект из состояния по ID
   */
  async getById(
    subdomain: string,
    entity: string,
    id: string
  ): Promise<Record<string, unknown> | null> {
    const currentState = await this.getState(subdomain, entity);
    return currentState.find((item) => item.id === id) || null;
  }

  /**
   * Инкрементирует счётчик запросов
   */
  async incrementRequestCount(subdomain: string): Promise<void> {
    const key = `mock:${subdomain}:stats:requests`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // TTL 1 день
  }

  /**
   * Инкрементирует счётчик ошибок
   */
  async incrementErrorCount(subdomain: string): Promise<void> {
    const key = `mock:${subdomain}:stats:errors`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // TTL 1 день
  }
}
