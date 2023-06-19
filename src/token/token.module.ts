import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schema/user.schema';
import { UserAddress, UserAddressSchema } from '../schema/userAddress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
    ]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
