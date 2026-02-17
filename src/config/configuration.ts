export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKey: process.env.API_KEY ?? 'default-api-key',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
