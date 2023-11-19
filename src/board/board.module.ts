import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { UsedItemBoardService } from './usedItemBoard.service';
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
import {
  PetMateBoard,
  PetMateBoardSchema,
} from 'src/schema/petMateBoardSchema.schema';
import {
  participatingPets,
  participatingPetsSchema,
} from 'src/schema/participatingPetsSchema.schema';
import { PetMateBoardService } from './petMateBoard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: CityAddress.name, schema: CityAddressSchema },
      { name: User.name, schema: UserSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: BlockedUser.name, schema: BlockedUserSchema },
      { name: PetMateBoard.name, schema: PetMateBoardSchema },
      { name: participatingPets.name, schema: participatingPetsSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [
    UsedItemBoardService,
    AwsService,
    AddressService,
    UtilService,
    PetMateBoardService,
  ],
})
export class BoardModule {}
