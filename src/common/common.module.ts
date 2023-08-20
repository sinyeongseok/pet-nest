import { Module } from '@nestjs/common';
import { JwtAccessStrategy } from './strategy/jwtAccess.strategy';
import { JwtRefreshStrategy } from './strategy/jwtRefresh.strategy';

@Module({
  providers: [JwtAccessStrategy, JwtRefreshStrategy],
  exports: [JwtAccessStrategy, JwtRefreshStrategy],
})
export class CommonModule {}
