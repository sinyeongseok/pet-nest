import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from '../schema/user.schema';
import { UserAddress, UserAddressSchema } from '../schema/userAddress.schema';
import { AwsService } from '../utils/s3';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: UserAddress.name, schema: UserAddressSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, AwsService, AuthService],
})
export class UserModule {}
