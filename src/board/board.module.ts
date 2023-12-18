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
  ParticipatingList,
  ParticipatingListSchema,
} from 'src/schema/ParticipatingList.schema';
import { PetMateBoardService } from './petMateBoard.service';
import { Pet, PetSchema } from 'src/schema/pet.schema';
import { ChatService } from 'src/chat/chat.service';
import {
  ChatRoomSetting,
  ChatRoomSettingSchema,
} from 'src/schema/chatRoomSetting.schema';
import { Message, MessageSchema } from 'src/schema/message.schema';
import {
  UsedItemSchedule,
  UsedItemScheduleSchema,
} from 'src/schema/usedItemSchedule.schema';

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
      { name: ParticipatingList.name, schema: ParticipatingListSchema },
      { name: Pet.name, schema: PetSchema },
      { name: PetMateBoard.name, schema: PetMateBoardSchema },
      { name: ChatRoomSetting.name, schema: ChatRoomSettingSchema },
      { name: Message.name, schema: MessageSchema },
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UsedItemSchedule.name, schema: UsedItemScheduleSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [
    UsedItemBoardService,
    AwsService,
    AddressService,
    UtilService,
    PetMateBoardService,
    ChatService,
  ],
})
export class BoardModule {}
