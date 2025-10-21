import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './auth/rate-limit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new RateLimitInterceptor(reflector));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
