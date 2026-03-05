import { Faker, en } from '@faker-js/faker';
import { Entity, Field } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

const faker = new Faker({ locale: [en] });

/**
 * Генерирует значение для одного поля на основе его типа и настроек
 */
export function generateFieldValue(field: Field): unknown {
  // Первичный ключ - всегда UUID
  if (field.primary) {
    return uuidv4();
  }

  // Если указан Faker-шаблон, используем его
  if (field.generated && field.faker) {
    return generateWithFaker(field.faker);
  }

  // Генерация по типу поля
  switch (field.type) {
    case 'uuid':
      return uuidv4();

    case 'string':
      return faker.lorem.word();

    case 'text':
      return faker.lorem.paragraph();

    case 'number':
      return faker.number.int({
        min: field.min ?? 0,
        max: field.max ?? 100,
      });

    case 'boolean':
      return faker.datatype.boolean();

    case 'email':
      return faker.internet.email();

    case 'date':
      return faker.date.past().toISOString();

    case 'url':
      return faker.internet.url();

    case 'phone':
      return faker.phone.number();

    default:
      return faker.lorem.word();
  }
}

/**
 * Генерирует значение по Faker-шаблону (например, 'person.fullName')
 */
function generateWithFaker(fakerTemplate: string): unknown {
  const parts = fakerTemplate.split('.');
  let result: unknown = faker;

  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return faker.lorem.word();
    }
  }

  // Если это функция - вызываем её
  if (typeof result === 'function') {
    return result();
  }

  return result ?? faker.lorem.word();
}

/**
 * Генерирует одну сущность по её схеме
 */
export function generateEntity(entity: Entity): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of entity.fields) {
    result[field.name] = generateFieldValue(field);
  }

  return result;
}

/**
 * Генерирует массив сущностей
 */
export function generateEntityArray(
  entity: Entity,
  count: number
): Record<string, unknown>[] {
  return Array.from({ length: count }, () => generateEntity(entity));
}
