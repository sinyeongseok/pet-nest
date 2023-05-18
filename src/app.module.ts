import { Module } from '@nestjs/common';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://yeongseok:luckybag@mongosin.pjffd.mongodb.net/petmily'
    ),
    AddressModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
