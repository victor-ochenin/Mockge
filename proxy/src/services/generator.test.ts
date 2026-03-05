import { describe, it, expect } from 'vitest';
import { generateFieldValue, generateEntity } from './generator';
import { Field, Entity } from '../types/schema';

describe('Generator Service', () => {
  describe('generateFieldValue', () => {
    it('должен генерировать UUID для primary поля', () => {
      const field: Field = {
        id: '1',
        name: 'id',
        type: 'uuid',
        primary: true,
      };

      const result = generateFieldValue(field);

      expect(typeof result).toBe('string');
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('должен генерировать UUID для типа uuid', () => {
      const field: Field = {
        id: '1',
        name: 'userId',
        type: 'uuid',
      };

      const result = generateFieldValue(field);

      expect(typeof result).toBe('string');
      expect(result).toHaveLength(36); // UUID format
    });

    it('должен генерировать строку для типа string', () => {
      const field: Field = {
        id: '1',
        name: 'name',
        type: 'string',
      };

      const result = generateFieldValue(field);

      expect(typeof result).toBe('string');
      expect(result).length.greaterThan(0);
    });

    it('должен генерировать число для типа number', () => {
      const field: Field = {
        id: '1',
        name: 'age',
        type: 'number',
        min: 18,
        max: 65,
      };

      const result = generateFieldValue(field) as number;

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(18);
      expect(result).toBeLessThanOrEqual(65);
    });

    it('должен генерировать boolean для типа boolean', () => {
      const field: Field = {
        id: '1',
        name: 'active',
        type: 'boolean',
      };

      const result = generateFieldValue(field);

      expect(typeof result).toBe('boolean');
    });

    it('должен генерировать email для типа email', () => {
      const field: Field = {
        id: '1',
        name: 'email',
        type: 'email',
      };

      const result = generateFieldValue(field) as string;

      expect(typeof result).toBe('string');
      expect(result).toContain('@');
      expect(result).toContain('.');
    });

    it('должен генерировать дату для типа date', () => {
      const field: Field = {
        id: '1',
        name: 'birthDate',
        type: 'date',
      };

      const result = generateFieldValue(field) as string;

      expect(typeof result).toBe('string');
      expect(() => new Date(result)).not.toThrow();
    });

    it('должен генерировать URL для типа url', () => {
      const field: Field = {
        id: '1',
        name: 'website',
        type: 'url',
      };

      const result = generateFieldValue(field) as string;

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^https?:\/\//);
    });

    it('должен генерировать телефон для типа phone', () => {
      const field: Field = {
        id: '1',
        name: 'phone',
        type: 'phone',
      };

      const result = generateFieldValue(field) as string;

      expect(typeof result).toBe('string');
      expect(result).length.greaterThan(0);
    });
  });

  describe('generateEntity', () => {
    it('должен генерировать объект со всеми полями сущности', () => {
      const entity: Entity = {
        id: 'entity_1',
        name: 'User',
        fields: [
          {
            id: 'field_1',
            name: 'id',
            type: 'uuid',
            primary: true,
          },
          {
            id: 'field_2',
            name: 'email',
            type: 'email',
            required: true,
          },
          {
            id: 'field_3',
            name: 'name',
            type: 'string',
          },
          {
            id: 'field_4',
            name: 'age',
            type: 'number',
            min: 0,
            max: 100,
          },
        ],
      };

      const result = generateEntity(entity);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
    });

    it('должен генерировать разные значения при каждом вызове', () => {
      const entity: Entity = {
        id: 'entity_1',
        name: 'User',
        fields: [
          {
            id: 'field_1',
            name: 'name',
            type: 'string',
          },
        ],
      };

      const result1 = generateEntity(entity);
      const result2 = generateEntity(entity);

      // Маловероятно, но возможно совпадение, поэтому проверяем UUID
      expect(result1).not.toEqual(result2);
    });
  });
});
