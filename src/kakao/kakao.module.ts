import { Module } from '@nestjs/common';
import { KakaoController } from './kakao.controller';

@Module({
  controllers: [KakaoController]
})
export class KakaoModule {}
