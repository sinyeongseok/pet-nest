import { Module } from '@nestjs/common';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { KakaoModule } from './kakao/kakao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    AddressModule,
    AuthModule,
    UserModule,
    KakaoModule,
  ],
})
export class AppModule {}
