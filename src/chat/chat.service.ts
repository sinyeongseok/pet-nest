import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UsedItemBoard,
  UsedItemBoardDocument,
} from 'src/schema/usedItemBoard.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schema/chatRoom.schema';
import {
  ChatRoomSetting,
  ChatRoomSettingDocument,
} from 'src/schema/chatRoomSetting.schema';
import { Message, MessageDocument } from 'src/schema/message.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { UtilService } from 'src/utils/util.service';
import * as dayjs from 'dayjs';
import {
  BlockedUser,
  BlockedUserDocument,
} from 'src/schema/blockedUserSchema.schema';
import {
  UsedItemSchedule,
  UsedItemScheduleDocument,
} from 'src/schema/usedItemSchedule.schema';
import { AlarmTime } from 'src/config/type';
import {
  PetMateBoard,
  PetMateBoardDocument,
} from 'src/schema/petMateBoardSchema.schema';
import {
  ParticipatingList,
  ParticipatingListDocument,
} from 'src/schema/ParticipatingList.schema';
import e from 'express';

dayjs.locale('ko');

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
    @InjectModel(BlockedUser.name)
    private blockedUserModel: Model<BlockedUserDocument>,
    @InjectModel(UsedItemSchedule.name)
    private usedItemScheduleModel: Model<UsedItemScheduleDocument>,
    @InjectModel(PetMateBoard.name)
    private petMateBoardModel: Model<PetMateBoardDocument>,
    @InjectModel(ParticipatingList.name)
    private participatingListModel: Model<ParticipatingListDocument>,
    private utilService: UtilService
  ) {}

  async createChatRoom(email, boardId) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: boardId,
      });
      const createChatRoomQuery = new this.chatRoomModel({
        type: 'usedTrade',
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
        id: usedItemBoardInfo._id,
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
    const userAddress = await this.utilService.getUserRecentAddress(email);

    return {
      id: chatRoom._id,
      type: chatRoom.type,
      title: userInfo.nickname,
      lastChat: chatRoom.lastChat,
      lastChatAt: dayjs.computeTimeDifference(chatRoom.lastChatAt),
      region: userAddress.eupMyeonDong,
      isAlarm: chatRoom.isAlarm,
      isPinned: chatRoom.isPinned,
      ...(!!userInfo.profileImage && { image: userInfo.profileImage }),
      ...(!!chatRoom.images && { productImage: chatRoom.images[0] }),
    };
  }

  private async formatChatRoomList(chatRoomList, email) {
    const sortChatRoomList = chatRoomList.sort(
      (a, b) => b.isPinned - a.isPinned
    );

    return Promise.all(
      sortChatRoomList.map((chatRoom) => this.formatChatRoom(chatRoom, email))
    );
  }

  async getChatRoomList(email: string, boardId: string = null) {
    try {
      const chatRoomAndSettings = await this.chatRoomModel.aggregate([
        {
          $match: {
            users: {
              $in: [email],
            },
            ...(!!boardId && { boardId: new Types.ObjectId(boardId) }),
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
            'chatRoomSettings.isLeave': false,
          },
        },
        {
          $lookup: {
            from: 'useditemboards',
            localField: 'boardId',
            foreignField: '_id',
            as: 'usedItemBoards',
          },
        },
        {
          $unwind: '$usedItemBoards',
        },
        {
          $project: {
            _id: 1,
            type: 1,
            users: 1,
            title: 1,
            lastChat: 1,
            lastChatAt: 1,
            isAlarm: '$chatRoomSettings.isAlarm',
            isPinned: '$chatRoomSettings.isPinned',
            images: '$usedItemBoards.images',
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
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const createMessageQuery = new this.messageModel({
        chatRoomId,
        type: 'message',
        details: {
          sender,
          timestamp,
          content: message,
          type: chatRoomInfo.type,
        },
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

  formatChatTimestamp(type, timestamp) {
    if (type === 'schedule') {
      return dayjs.convertToKoreanDate(timestamp);
    }

    return `${dayjs(timestamp).hour() < 12 ? '오전' : '오후'} ${dayjs(
      timestamp
    ).format('H:mm')}`;
  }

  formatChatList(email, chatList) {
    return chatList.reduce((res, acc) => {
      const date = dayjs(acc.timestamp).format('YYYY년 M월 D일');
      if (!res[date]) {
        res[date] = [];
      }

      if (res[date].length > 0) {
        const length = res[date].length;

        if (
          res[date][length - 1].timestamp ==
            dayjs(acc.timestamp).format('H:mm') &&
          res[date][length - 1].details.type !== 'schedule'
        ) {
          delete res[date][length - 1].timestamp;
        }
      }

      res[date].push({
        id: acc._id,
        type: acc.type,
        details: {
          type: acc.details.type,
          content: acc.details.content,
          timestamp: this.formatChatTimestamp(
            acc.details.type,
            acc.details.timestamp
          ),
          ...(acc.sender === email && { isMe: true }),
          ...(acc.details.type === 'petMate' && { user: acc.details.user }),
        },
      });

      return res;
    }, {});
  }

  async getUsedTradeChatList(email, chatRoomId) {
    const getChatList = this.messageModel
      .find({ chatRoomId })
      .sort({ timestamp: 1 })
      .exec();
    const getScheduleList = this.usedItemScheduleModel
      .find({ chatRoomId })
      .sort({ timestamp: 1 })
      .exec();
    const [chatList, scheduleList] = await Promise.all([
      getChatList,
      getScheduleList,
    ]);
    const newScheduleList = scheduleList.map((schedule) => {
      return {
        _id: schedule._id,
        type: 'message',
        details: {
          type: 'schedule',
          sender: schedule.writer,
          content: schedule.content,
          timestamp: schedule.timestamp,
        },
      };
    });
    const newChatList = [...chatList, ...newScheduleList].sort(
      (a, b) =>
        new Date(a.details.timestamp).getTime() -
        new Date(b.details.timestamp).getTime()
    );

    return this.formatChatList(email, newChatList);
  }

  async getPetMateChatList(email, chatRoomId) {
    const chatList = await this.messageModel
      .find({ chatRoomId })
      .sort({ timestamp: 1 })
      .exec();
    const newChatList = await Promise.all(
      chatList.map(async (chat) => {
        if (chat.details.type === 'petMate') {
          const userInfo = await this.userModel.findOne({
            email: chat.details.sender,
          });

          return {
            _id: chat._id,
            type: chat.type,
            details: {
              ...chat.details,
              user: {
                nickname: userInfo.nickname,
                profileImage: userInfo.profileImage,
              },
            },
          };
        }

        return chat;
      })
    );

    return this.formatChatList(email, newChatList);
  }

  async getChatList(email, chatRoomId: string) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });

      if (chatRoomInfo.type === 'usedTrade') {
        return await this.getUsedTradeChatList(email, chatRoomId);
      } else if (chatRoomInfo.type === 'petMate') {
        return await this.getPetMateChatList(email, chatRoomId);
      }
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
        id: userInfo.email,
        nickname: userInfo.nickname,
        region: chatRoomInfo.region,
        isAlarm: chatRoomSetting.isAlarm,
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

  async patchChatRoomSetting({
    email,
    chatRoomId,
    patchItem,
    isChatListVisible = false,
  }) {
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

      if (isChatListVisible) {
        return {
          statusCode: 200,
          data: { [patchItem]: !chatRoomSettingInfo[patchItem] },
        };
      }

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

  async patchChatRoomSettingHeader({ email, chatRoomId, patchItem }) {
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

      return {
        statusCode: 200,
        data: { [patchItem]: !chatRoomSettingInfo[patchItem] },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async LeaveChatRoom(email: string, chatRoomId: string) {
    try {
      await this.chatRoomSettingModel.updateOne(
        {
          chatRoomId,
          userId: email,
        },
        {
          isLeave: true,
        }
      );

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async blockUser(email: string, chatRoomId: string) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const otherUser = chatRoomInfo.users.filter((user) => user !== email);
      const blockedUserQuery = new this.blockedUserModel({
        blockedBy: otherUser[0],
        userId: email,
      });

      await blockedUserQuery.save();

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unblockUser(email: string, chatRoomId: string) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const otherUser = chatRoomInfo.users.filter((user) => user !== email);
      await this.blockedUserModel.deleteOne({
        blockedBy: otherUser[0],
        userId: email,
      });

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createUsedItemSchedule({
    chatRoomId,
    promiseAt,
    alarmTime,
    writer,
  }: {
    chatRoomId: string;
    promiseAt: string;
    alarmTime: AlarmTime;
    writer: string;
  }) {
    try {
      const date = dayjs(promiseAt, 'YYYY-MM-DD HH:mm');
      const timestamp = dayjs(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      );
      const alarmAt = this.calculateRelativeAlarmTime(date, alarmTime);
      const createUsedItemScheduleQuery = new this.usedItemScheduleModel({
        chatRoomId,
        writer,
        timestamp,
        promiseAt: date.toDate(),
        content: '직거래 약속이 잡혔어요',
        ...(!!alarmTime && { alarmAt, isAlarm: true }),
      });
      const updateChatRoomQuery = this.chatRoomModel.updateOne(
        {
          _id: chatRoomId,
        },
        {
          lastChat: '직거래 약속이 잡혔어요',
          lastChatAt: timestamp,
        }
      );

      await Promise.all([
        updateChatRoomQuery,
        createUsedItemScheduleQuery.save(),
      ]);

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAlarmInfo(alarmId: string) {
    try {
      const alarmInfo = await this.usedItemScheduleModel.findOne({
        _id: alarmId,
      });
      const alarmTime = (() => {
        const promiseAt = dayjs(alarmInfo.promiseAt);
        const alarmAt = dayjs(alarmInfo.alarmAt);
        const diffMinute = promiseAt.diff(alarmAt, 'minute');

        if (diffMinute === 60) {
          return `1시간 전`;
        }

        return `${diffMinute}분 전`;
      })();
      const promiseDateAndTime = dayjs
        .convertToKoreanDate(alarmInfo.promiseAt)
        .split(' ');
      const result = {
        promiseAt: alarmInfo.promiseAt,
        promiseDate: `${promiseDateAndTime[0]} ${promiseDateAndTime[1].replace(
          /,/g,
          ''
        )}`,
        promiseTime: `${promiseDateAndTime[2]} ${promiseDateAndTime[3]}`,
        ...(alarmInfo.isAlarm && { alarmTime, isAlarm: alarmInfo.isAlarm }),
      };

      return { statusCode: 200, data: { alarmInfo: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteSchedule(email: string, scheduleId: string) {
    try {
      const [scheduleInfo, userInfo] = await Promise.all([
        this.usedItemScheduleModel.findOne({
          _id: scheduleId,
        }),
        this.userModel.findOne({ email }),
      ]);
      const chatRoomId = String(scheduleInfo.chatRoomId);
      const deleteScheduleQuery = this.usedItemScheduleModel.deleteOne({
        _id: scheduleId,
      });
      const timestamp = dayjs(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      );
      const message = `${userInfo.nickname}님이 약속을 삭제했어요.`;
      const updateChatRoomQuery = this.chatRoomModel.updateOne(
        {
          _id: chatRoomId,
        },
        {
          lastChat: message,
          lastChatAt: timestamp,
        }
      );
      const createMessageQuery = new this.messageModel({
        chatRoomId,
        type: 'action',
        details: {
          timestamp,
          type: 'schedule_cancel',
          sender: email,
          content: message,
        },
      });

      await Promise.all([
        deleteScheduleQuery,
        updateChatRoomQuery,
        createMessageQuery.save(),
      ]);

      return chatRoomId;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  calculateRelativeAlarmTime(date: dayjs.Dayjs, alarmTime: AlarmTime) {
    const alarm = alarmTime === '1시간 전' ? 60 : parseInt(alarmTime);

    return date.subtract(alarm, 'minute').toDate();
  }

  async updateUsedItemSchedule({
    scheduleId,
    promiseAt,
    alarmTime,
  }: {
    scheduleId: string;
    promiseAt: string;
    alarmTime: AlarmTime;
  }) {
    try {
      const date = dayjs(promiseAt, 'YYYY-MM-DD HH:mm');
      const alarmAt = this.calculateRelativeAlarmTime(date, alarmTime);
      const result = await this.usedItemScheduleModel.findOneAndUpdate(
        {
          _id: scheduleId,
        },
        {
          promiseAt: date.toDate(),
          isAlarm: !!alarmTime,
          ...(!!alarmTime && {
            alarmAt,
          }),
        }
      );

      return String(result.chatRoomId);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkBlockedUserChats(email: string, chatRoomId: string) {
    try {
      const chatRoomInfo = await this.chatRoomModel.findOne({
        _id: chatRoomId,
      });
      const otherUser = chatRoomInfo.users.filter((user) => user !== email);
      const [myBlockList, otherUserBlockList] = await Promise.all([
        this.blockedUserModel.findOne({
          userId: email,
          blockedBy: otherUser,
        }),
        this.blockedUserModel.findOne({
          userId: otherUser,
          blockedBy: email,
        }),
      ]);

      if (!!myBlockList) {
        return { statusCode: 200, data: { blockedStatus: 'Me' } };
      }

      if (!!otherUserBlockList) {
        return { statusCode: 200, data: { blockedStatus: 'Other' } };
      }

      return { statusCode: 200, data: { blockedStatus: 'None' } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async isSameTimeSchedule(
    email: string,
    promiseAt,
    scheduleId: string = null
  ) {
    try {
      const sameTimeSchedule = await this.chatRoomModel.aggregate([
        {
          $match: {
            users: {
              $in: [email],
            },
            ...(!!scheduleId && {
              _id: {
                $ne: new Types.ObjectId(scheduleId),
              },
            }),
          },
        },
        {
          $lookup: {
            from: 'useditemschedules',
            localField: '_id',
            foreignField: 'chatRoomId',
            as: 'usedItemSchedules',
          },
        },
        {
          $unwind: '$usedItemSchedules',
        },
        {
          $match: {
            'usedItemSchedules.promiseAt': new Date(promiseAt),
          },
        },
        {
          $project: {
            _id: 0,
            id: '$usedItemSchedules._id',
            promiseAt: '$usedItemSchedules.promiseAt',
          },
        },
      ]);

      return !!sameTimeSchedule.length;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createPetMateChatRoom(boardId) {
    try {
      const [petMateBoardInfo, participatingList] = await Promise.all([
        this.petMateBoardModel.findOne({
          _id: boardId,
        }),
        this.participatingListModel.find({
          boardId,
          isApproved: true,
        }),
      ]);
      const users = participatingList.map((data) => data.userEmail);
      const createChatRoomQuery = new this.chatRoomModel({
        users,
        type: 'petMate',
        boardId: boardId,
        region: petMateBoardInfo.address,
      });
      const createChatRoomResult = await createChatRoomQuery.save();

      for await (const user of users) {
        const createChatRoomSettingQuery = new this.chatRoomSettingModel({
          chatRoomId: createChatRoomResult._id,
          userId: user,
        });
        await createChatRoomSettingQuery.save();
      }

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async joinPetMateChatRoom(email, boardId) {
    try {
      const [chatRoomInfo, userInfo] = await Promise.all([
        this.chatRoomModel.findOne({ boardId }),
        this.userModel.findOne({ email }),
      ]);
      const createChatRoomSettingQuery = new this.chatRoomSettingModel({
        chatRoomId: chatRoomInfo._id,
        userId: email,
      });
      const createMessage = new this.messageModel({
        chatRoomId: chatRoomInfo._id,
        type: 'action',
        details: {
          timestamp: dayjs(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          ),
          type: 'join',
          sender: email,
          content: `${userInfo.nickname}님이 들어왔습니다.`,
        },
      });

      await Promise.all([
        createChatRoomSettingQuery.save(),
        createMessage.save(),
        this.chatRoomModel.updateOne(
          { _id: chatRoomInfo._id },
          { $push: { users: email } }
        ),
      ]);

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
