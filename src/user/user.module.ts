import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from '../schema/user.schema';
import { UserAddress, UserAddressSchema } from '../schema/userAddress.schema';
import { CityAddress, CityAddressSchema } from '../schema/cityAddress.schema';
import { AwsService } from '../utils/s3';
import { TokenService } from '../token/token.service';
import { UtilService } from 'src/utils/util.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: CityAddress.name, schema: CityAddressSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, AwsService, TokenService, UtilService, AuthService],
})
export class UserModule {}
