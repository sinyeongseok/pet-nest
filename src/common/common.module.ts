import { Module } from '@nestjs/common';
import { JwtAccessStrategy } from './strategy/jwtAccess.strategy';

@Module({
  providers: [JwtAccessStrategy],
  exports: [JwtAccessStrategy],
})
export class CommonModule {}
