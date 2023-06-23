import { Module } from '@nestjs/common';
import { UtilService } from './util.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAddress.name, schema: UserAddressSchema },
    ]),
  ],
  providers: [UtilService],
  exports: [UtilService],
})
export class UtilModule {}
