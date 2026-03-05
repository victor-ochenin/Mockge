import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockStateService } from './mockState';
import { Schema } from '../types/schema';

// Мок Redis клиента
const createMockRedis = () => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  quit: vi.fn(),
});

describe('MockStateService', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let service: MockStateService;

  beforeEach(() => {
    mockRedis = createMockRedis();
    service = new MockStateService(mockRedis as unknown as Redis);
  });

  describe('getSchema', () => {
    it('должен возвращать схему при наличии данных в Redis', async () => {
      const schema: Schema = {
        id: 'schema_1',
        name: 'Test Schema',
        entities: [],
        endpoints: {},
        settings: {},
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(schema));

      const result = await service.getSchema('test-project');

      expect(result).toEqual(schema);
      expect(mockRedis.get).toHaveBeenCalledWith('mock:test-project:schema');
    });

    it('должен возвращать null при отсутствии схемы', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getSchema('non-existent');

      expect(result).toBeNull();
    });

    it('должен возвращать null при невалидном JSON', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await service.getSchema('test-project');

      expect(result).toBeNull();
    });
  });

  describe('saveSchema', () => {
    it('должен сохранять схему в Redis', async () => {
      const schema: Schema = {
        id: 'schema_1',
        name: 'Test Schema',
        entities: [],
        endpoints: {},
        settings: {},
      };

      await service.saveSchema('test-project', schema);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'mock:test-project:schema',
        JSON.stringify(schema)
      );
    });
  });

  describe('getState', () => {
    it('должен возвращать массив данных состояния', async () => {
      const state = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.getState('test-project', 'users');

      expect(result).toEqual(state);
    });

    it('должен возвращать пустой массив при отсутствии данных', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getState('test-project', 'users');

      expect(result).toEqual([]);
    });
  });

  describe('addToState', () => {
    it('должен добавлять объект в состояние', async () => {
      const existingState = [{ id: '1', name: 'User 1' }];
      const newItem = { id: '2', name: 'User 2' };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      await service.addToState('test-project', 'users', newItem);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'mock:test-project:state:users',
        JSON.stringify([...existingState, newItem])
      );
    });
  });

  describe('updateInState', () => {
    it('должен обновлять объект по ID', async () => {
      const existingState = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.updateInState('test-project', 'users', '1', {
        name: 'Updated User',
      });

      expect(result).toEqual({ id: '1', name: 'Updated User' });
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('должен возвращать null если объект не найден', async () => {
      const existingState = [{ id: '1', name: 'User 1' }];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.updateInState('test-project', 'users', '999', {
        name: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteFromState', () => {
    it('должен удалять объект по ID и возвращать true', async () => {
      const existingState = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.deleteFromState('test-project', 'users', '1');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'mock:test-project:state:users',
        JSON.stringify([{ id: '2', name: 'User 2' }])
      );
    });

    it('должен возвращать false если объект не найден', async () => {
      const existingState = [{ id: '1', name: 'User 1' }];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.deleteFromState('test-project', 'users', '999');

      expect(result).toBe(false);
    });
  });

  describe('getById', () => {
    it('должен возвращать объект по ID', async () => {
      const existingState = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.getById('test-project', 'users', '1');

      expect(result).toEqual({ id: '1', name: 'User 1' });
    });

    it('должен возвращать null если объект не найден', async () => {
      const existingState = [{ id: '1', name: 'User 1' }];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingState));

      const result = await service.getById('test-project', 'users', '999');

      expect(result).toBeNull();
    });
  });
});
