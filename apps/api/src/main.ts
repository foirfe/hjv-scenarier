import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  const config = new DocumentBuilder()
    .setTitle('HJV Scenarier API')
    .setDescription('API til opgaver, scenarier og scenarieafvikling')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('tasks', 'Administration af opgaver')
    .addTag('scenarios', 'Administration af scenarier')
    .addTag('users', 'Administration af brugere')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
