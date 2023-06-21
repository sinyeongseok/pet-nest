import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { CityAddress, CityAddressSchema } from '../schema/cityAddress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CityAddress.name, schema: CityAddressSchema },
    ]),
  ],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
