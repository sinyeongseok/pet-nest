import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsedItemBoard,
  UsedItemBoardSchema,
} from '../schema/usedItemBoard.schema';
import { AwsService } from '../utils/s3';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';
import { AddressService } from 'src/address/address.service';
import { CityAddress, CityAddressSchema } from 'src/schema/cityAddress.schema';
import { UtilService } from 'src/utils/util.service';
import { User, UserSchema } from 'src/schema/user.schema';
import { ChatRoom, ChatRoomSchema } from 'src/schema/chatRoom.schema';
import {
  BlockedUser,
  BlockedUserSchema,
} from 'src/schema/blockedUserSchema.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: CityAddress.name, schema: CityAddressSchema },
      { name: User.name, schema: UserSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: BlockedUser.name, schema: BlockedUserSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService, AwsService, AddressService, UtilService],
})
export class BoardModule {}
