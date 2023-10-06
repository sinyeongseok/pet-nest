import { Module } from '@nestjs/common';
import { MyPageController } from './my-page.controller';
import { MyPageService } from './my-page.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
    ]),
  ],
  controllers: [MyPageController],
  providers: [MyPageService],
})
export class MyPageModule {}
