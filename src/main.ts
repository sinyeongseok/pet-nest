import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dayjs from 'dayjs';
import dayjsPlugin from './utils/plugin/dayjsPlugin';

dayjs.extend(dayjsPlugin);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
