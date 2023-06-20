import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardSchema } from '../schema/Board.schema';
import { AwsService } from '../utils/s3';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';
import { Address, AddressSchema } from 'src/schema/address.schema';
import { AddressService } from 'src/address/address.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: Address.name, schema: AddressSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService, AwsService, AddressService],
})
export class BoardModule {}
