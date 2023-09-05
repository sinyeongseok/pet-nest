import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsedItemBoard, UsedItemBoardDocument } from 'src/schema/board.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schema/chatRoom.schema';
import {
  ChatRoomSetting,
  ChatRoomSettingDocument,
} from 'src/schema/chatRoomSetting.schema';
import { Message, MessageDocument } from 'src/schema/message.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { UtilService } from 'src/utils/util.service';
import * as dayjs from 'dayjs';

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
    private chatRoomSettingModel: Model<ChatRoomSettingDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private utilService: UtilService
  ) {}

  async createChatRoom(email, boardId) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: boardId,
      });
      const createChatRoomQuery = new this.chatRoomModel({
        users: [email, usedItemBoardInfo.seller.email],
        boardId: boardId,
        region: usedItemBoardInfo.address,
      });
      const createChatRoomResult = await createChatRoomQuery.save();

      for await (const user of [email, usedItemBoardInfo.seller.email]) {
        const createChatRoomSettingQuery = new this.chatRoomSettingModel({
          chatRoomId: createChatRoomResult._id,
          userId: user,
        });
        await createChatRoomSettingQuery.save();
      }

      return {
        statusCode: 201,
        data: { chatRoomId: createChatRoomResult._id },
      };
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

  private async formatChatRoom(chatRoom, email) {
    const otherUser = chatRoom.users.filter((user: string[]) => user !== email);
    const userInfo = await this.userModel.findOne({ email: otherUser });

    return {
      id: chatRoom._id,
      title: userInfo.nickname,
      lastChat: chatRoom.lastChat,
      lastChatAt: this.utilService.computeTimeDifference(chatRoom.lastChatAt),
      isAllam: chatRoom.isAllam,
      isPinned: chatRoom.isPinned,
      ...(!!userInfo.profileImage && { image: userInfo.profileImage }),
    };
  }

  private async formatChatRoomList(chatRoomList, email) {
    const sortChatRoomList = chatRoomList.sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
    );

    return Promise.all(
      sortChatRoomList.map((chatRoom) => {
        return this.formatChatRoom(chatRoom, email);
      })
    );
  }

  async getChatRoomList(email: string) {
    try {
      const chatRoomAndSettings = await this.chatRoomModel.aggregate([
        {
          $match: {
            users: email,
          },
        },
        {
          $lookup: {
            from: 'chatroomsettings',
            localField: '_id',
            foreignField: 'chatRoomId',
            as: 'chatRoomSettings',
          },
        },
        {
          $unwind: '$chatRoomSettings',
        },
        {
          $match: {
            'chatRoomSettings.userId': email,
          },
        },
        {
          $project: {
            _id: 1,
            users: 1,
            title: 1,
            isPetMate: 1,
            lastChat: 1,
            lastChatAt: 1,
            isAllam: '$chatRoomSettings.isAllam',
            isPinned: '$chatRoomSettings.isPinned',
          },
        },
        {
          $sort: {
            lastChatAt: -1,
          },
        },
      ]);
      const result = await this.formatChatRoomList(chatRoomAndSettings, email);

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createMessage({ chatRoomId, sender, message }) {
    try {
      const timestamp = dayjs(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      );
      const createMessageQuery = new this.messageModel({
        chatRoomId,
        sender,
        timestamp,
        content: message,
      });
      const updateChatRoomQuery = this.chatRoomModel.updateOne(
        {
          _id: chatRoomId,
        },
        {
          lastChat: message,
          lastChatAt: timestamp,
        }
      );

      await Promise.all([createMessageQuery.save(), updateChatRoomQuery]);

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  formatChatList(email, chatList) {
    return chatList.reduce((res, acc) => {
      if (!res[dayjs(acc.timestamp).format('YYYY년 M월 D일')]) {
        res[dayjs(acc.timestamp).format('YYYY년 M월 D일')] = [];
      }

      if (res[dayjs(acc.timestamp).format('YYYY년 M월 D일')].length > 0) {
        const length =
          res[dayjs(acc.timestamp).format('YYYY년 M월 D일')].length;

        if (
          res[dayjs(acc.timestamp).format('YYYY년 M월 D일')][length - 1]
            .timestamp == dayjs(acc.timestamp).format('H:mm')
        ) {
          delete res[dayjs(acc.timestamp).format('YYYY년 M월 D일')][length - 1]
            .timestamp;
          delete res[dayjs(acc.timestamp).format('YYYY년 M월 D일')][length - 1]
            .timeOfDay;
        }
      }

      res[dayjs(acc.timestamp).format('YYYY년 M월 D일')].push({
        id: acc._id,
        content: acc.content,
        timestamp: dayjs(acc.timestamp).format('H:mm'),
        timeOfDay: dayjs(acc.timestamp).hour() < 12 ? '오전' : '오후',
        ...(acc.sender === email && { isMe: true }),
      });

      return res;
    }, {});
  }

  async getChatList(email, chatRoomId: string) {
    try {
      const chatList = await this.messageModel
        .find({ chatRoomId })
        .sort({ timestamp: 1 });
      const result = this.formatChatList(email, chatList);

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getChatRoomHeaderInfo(email: string, chatRoomId: string) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const otherUser = chatRoomInfo.users.filter((user) => user !== email);
      const userInfo = await this.userModel.findOne({ email: otherUser });
      const chatRoomSetting = await this.chatRoomSettingModel.findOne({
        chatRoomId,
        userId: email,
      });
      const result = {
        nickname: userInfo.nickname,
        region: chatRoomInfo.region,
        isAllam: chatRoomSetting.isAllam,
      };

      return { statusCode: 200, data: { chatRoomHeaderInfo: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async patchChatRoomSetting({ email, chatRoomId, patchItem }) {
    try {
      const chatRoomSettingInfo = await this.chatRoomSettingModel.findOne({
        chatRoomId,
        userId: email,
      });

      await this.chatRoomSettingModel.updateOne(
        {
          chatRoomId,
          userId: email,
        },
        {
          [patchItem]: !chatRoomSettingInfo[patchItem],
        }
      );

      const result = await this.getChatRoomList(email);

      return { statusCode: 200, data: { chatRoomList: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
