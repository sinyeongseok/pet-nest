import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsedItemBoard,
  UsedItemBoardSchema,
} from 'src/schema/usedItemBoard.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { UserAddress, UserAddressSchema } from 'src/schema/userAddress.schema';
import { ChatRoom, ChatRoomSchema } from 'src/schema/chatRoom.schema';
import {
  ChatRoomSetting,
  ChatRoomSettingSchema,
} from 'src/schema/chatRoomSetting.schema';
import { Message, MessageSchema } from 'src/schema/message.schema';
import { UtilService } from 'src/utils/util.service';
import { TokenService } from 'src/token/token.service';
import { ChatController } from './chat.controller';
import {
  BlockedUser,
  BlockedUserSchema,
} from 'src/schema/blockedUserSchema.schema';
import {
  UsedItemSchedule,
  UsedItemScheduleSchema,
} from 'src/schema/usedItemSchedule.schema';
import { UsedItemBoardService } from 'src/board/usedItemBoard.service';
import { AddressService } from 'src/address/address.service';
import { AwsService } from 'src/utils/s3';
import { CityAddress, CityAddressSchema } from 'src/schema/cityAddress.schema';
import {
  PetMateBoard,
  PetMateBoardSchema,
} from 'src/schema/petMateBoardSchema.schema';
import {
  ParticipatingList,
  ParticipatingListSchema,
} from 'src/schema/ParticipatingList.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: CityAddress.name, schema: CityAddressSchema },
      { name: User.name, schema: UserSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatRoomSetting.name, schema: ChatRoomSettingSchema },
      { name: Message.name, schema: MessageSchema },
      { name: BlockedUser.name, schema: BlockedUserSchema },
      { name: UsedItemSchedule.name, schema: UsedItemScheduleSchema },
      { name: PetMateBoard.name, schema: PetMateBoardSchema },
      { name: ParticipatingList.name, schema: ParticipatingListSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    UtilService,
    TokenService,
    UsedItemBoardService,
    AwsService,
    AddressService,
  ],
})
export class ChatModule {}
