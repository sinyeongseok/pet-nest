import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardSchema } from 'src/schema/board.schema';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedItemBoard.name, schema: UsedItemBoardSchema },
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: User.name, schema: UserSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatRoomSetting.name, schema: ChatRoomSettingSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, UtilService, TokenService],
})
export class ChatModule {}
