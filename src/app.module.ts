import { Module } from '@nestjs/common';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { WebModule } from './web/web.module';
import { JwtModule } from '@nestjs/jwt';
import { BoardModule } from './board/board.module';
import { TokenModule } from './token/token.module';
import { CommonModule } from './common/common.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    AddressModule,
    AuthModule,
    UserModule,
    WebModule,
    BoardModule,
    TokenModule,
    CommonModule,
    ChatModule,
  ],
})
export class AppModule {}
