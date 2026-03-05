/**
 * Модели данных для схемы мок-сервера
 */

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'date'
  | 'url'
  | 'phone'
  | 'uuid'
  | 'text';

export interface FieldRelation {
  entity: string;
  type: 'oneToOne' | 'manyToOne' | 'oneToMany' | 'manyToMany';
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  required?: boolean;
  primary?: boolean;
  generated?: boolean;
  faker?: string;
  min?: number;
  max?: number;
  pattern?: string;
  relation?: FieldRelation;
}

export interface Entity {
  id: string;
  name: string;
  fields: Field[];
}

export interface Endpoint {
  list: string;
  detail: string;
  create: string;
  update: string;
  delete: string;
}

export interface Endpoints {
  [entityName: string]: Endpoint;
}

export interface MockSettings {
  defaultLatency?: number;
  errorRate?: number;
  stateful?: boolean;
  maxItems?: number;
}

export interface Schema {
  id: string;
  name: string;
  entities: Entity[];
  endpoints: Endpoints;
  settings: MockSettings;
}
