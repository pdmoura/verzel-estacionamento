import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚗 Estacionamento API running on http://0.0.0.0:${port} (Swagger at /docs)`);
}

bootstrap();
