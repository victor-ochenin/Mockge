export interface Config {
  port: number;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  environment: 'development' | 'production' | 'test';
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD,
  environment: (process.env.NODE_ENV as Config['environment']) || 'development',
};
