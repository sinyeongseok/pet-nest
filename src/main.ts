import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dayjs from 'dayjs';
import dayjsDateFormatPlugin from './utils/plugin/dayjsDateFormatPlugin';

dayjs.extend(dayjsDateFormatPlugin);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
