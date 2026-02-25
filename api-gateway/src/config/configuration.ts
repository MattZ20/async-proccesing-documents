export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKey: process.env.API_KEY ?? 'default-api-key',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  storagePath:
    process.env.STORAGE_PATH ?? '/app/shared/data/results.json',
});
