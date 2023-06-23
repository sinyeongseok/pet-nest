import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardSchema } from '../schema/board.schema';
import { AwsService } from '../utils/s3';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';
import { AddressService } from 'src/address/address.service';
import { CityAddress, CityAddressSchema } from 'src/schema/cityAddress.schema';
import { UtilService } from 'src/utils/util.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: CityAddress.name, schema: CityAddressSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService, AwsService, AddressService, UtilService],
})
export class BoardModule {}
