import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsedItemBoard, UsedItemBoardDocument } from 'src/schema/board.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schema/chatRoom.schema';
import {
  ChatRoomSetting,
  ChatRoomSettingDocument,
} from 'src/schema/chatRoomSetting.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(UsedItemBoard.name)
    private usedItemBoardModel: Model<UsedItemBoardDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatRoomSetting.name)
    private chatRoomSettingModel: Model<ChatRoomSettingDocument>
  ) {}

  async createChatRoom(users, usedItemBoardId) {
    try {
      const createChatRoomQuery = new this.chatRoomModel({
        users,
        boardId: usedItemBoardId,
      });
      const createChatRoomResult = await createChatRoomQuery.save();
      for await (const user of users) {
        const createChatRoomSettingQuery = new this.chatRoomSettingModel({
          chatRoomId: createChatRoomResult._id,
          userId: user,
        });
        await createChatRoomSettingQuery.save();
      }

      return { id: createChatRoomResult._id };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getProvideUsedTradingInfo(chatRoomId) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: chatRoomInfo.boardId,
      });

      return {
        title: usedItemBoardInfo.title,
        price: `${usedItemBoardInfo.price.toLocaleString()}원`,
        status: usedItemBoardInfo.salesStatus,
        image: usedItemBoardInfo.images[0],
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
