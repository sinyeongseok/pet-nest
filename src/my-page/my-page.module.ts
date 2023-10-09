import { Module } from '@nestjs/common';
import { MyPageController } from './my-page.controller';
import { MyPageService } from './my-page.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';
import { Pet, PetSchema } from 'src/schema/pet.schema';
import { AwsService } from 'src/utils/s3';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: Pet.name, schema: PetSchema },
    ]),
  ],
  controllers: [MyPageController],
  providers: [MyPageService, AwsService],
})
export class MyPageModule {}
