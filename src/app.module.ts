import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { WebModule } from './web/web.module';
import { JwtModule } from '@nestjs/jwt';
import { BoardModule } from './board/board.module';
import { VerifyTokenMiddleware } from './common/middlewares/verifyToken.middleware';
import { TokenModule } from './token/token.module';
import { UtilModule } from './utils/util.module';

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
    UtilModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes('board/used-item', 'token/refresh-token', 'auth/local-area');
  }
}
