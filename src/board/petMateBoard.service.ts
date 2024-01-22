import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model, Types } from 'mongoose';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import {
  ParticipatingList,
  ParticipatingListDocument,
} from 'src/schema/ParticipatingList.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schema/chatRoom.schema';
import {
  ChatRoomSetting,
  ChatRoomSettingDocument,
} from 'src/schema/chatRoomSetting.schema';
import { Message, MessageDocument } from 'src/schema/message.schema';
import { Pet, PetDocument } from 'src/schema/pet.schema';
import {
  PetMateBoard,
  PetMateBoardDocument,
} from 'src/schema/petMateBoardSchema.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { UtilService } from 'src/utils/util.service';

@Injectable()
export class PetMateBoardService {
  constructor(
    @InjectModel(PetMateBoard.name)
    private petMateBoardModel: Model<PetMateBoardDocument>,
    @InjectModel(ParticipatingList.name)
    private participatingListModel: Model<ParticipatingListDocument>,
    @InjectModel(Pet.name)
    private petModel: Model<PetDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatRoomSetting.name)
    private chatRoomSettingModel: Model<ChatRoomSettingDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private utilService: UtilService,
    private chatService: ChatService,
    private chatGateway: ChatGateway
  ) {}

  async createPetMateBoard({
    host,
    petIds,
    title,
    content,
    walkDate,
    place,
    maxPet,
  }) {
    try {
      const userAddressInfo = await this.utilService.getUserRecentAddress(host);
      const createPetMateBoard = new this.petMateBoardModel({
        host,
        title,
        content,
        place,
        maxPet,
        date: walkDate,
        address: userAddressInfo.eupMyeonDong,
        addressDetail: userAddressInfo.detail,
        location: {
          type: 'Point',
          coordinates: [
            Number(userAddressInfo.longitude),
            Number(userAddressInfo.latitude),
          ],
        },
      });
      const createPetMateBoardResult = await createPetMateBoard.save();
      const createParticipatingPets = new this.participatingListModel({
        petIds,
        boardId: createPetMateBoardResult._id,
        userEmail: host,
        isHostPet: true,
        isApproved: true,
      });

      await createParticipatingPets.save();

      return { statusCode: 201, data: { isCreated: true } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPetMateBoardList({ email, limit = 20, page = 0, isRecruiting }) {
    try {
      const userAddressInfo = await this.utilService.getUserRecentAddress(
        email
      );
      const skip = page * limit;
      const currentDate = new Date();
      const petMateBoardList = await this.petMateBoardModel.aggregate([
        {
          $geoNear: {
            maxDistance: 2000,
            near: {
              type: 'Point',
              coordinates: [
                Number(userAddressInfo.longitude),
                Number(userAddressInfo.latitude),
              ],
            },
            distanceField: 'distance',
            key: 'location',
          },
        },
        {
          $match: {
            date: { $gte: currentDate },
            isDeleted: false,
            ...(isRecruiting == 'true' && { status: '모집중' }),
          },
        },
        {
          $lookup: {
            from: 'participatinglists',
            let: { boardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boardId', '$$boardId'] },
                },
              },
              {
                $project: {
                  petCount: { $size: '$petIds' },
                  isHostPet: 1,
                },
              },
            ],
            as: 'participatingLists',
          },
        },
        {
          $addFields: {
            hostPetsCount: {
              $sum: {
                $map: {
                  input: '$participatingLists',
                  as: 'pet',
                  in: {
                    $cond: {
                      if: '$$pet.isHostPet',
                      then: '$$pet.petCount',
                      else: 0,
                    },
                  },
                },
              },
            },
            participatingPetsCount: {
              $sum: '$participatingLists.petCount',
            },
          },
        },
        {
          $addFields: {
            totalPets: {
              $add: ['$maxPet', '$hostPetsCount'],
            },
          },
        },
        {
          $project: {
            title: 1,
            date: 1,
            place: 1,
            hostPetsCount: 1,
            address: 1,
            participatingPetsCount: 1,
            maxPet: 1,
            totalPets: 1,
            status: 1,
            remainingPetsCount: {
              $subtract: ['$totalPets', '$participatingPetsCount'],
            },
          },
        },
        {
          $sort: { date: 1, remainingPetsCount: 1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: Number(limit),
        },
      ]);

      const result = petMateBoardList.map((petMateBoard) => {
        return {
          id: petMateBoard._id,
          title: petMateBoard.title,
          region: petMateBoard.address,
          date: dayjs.convertToKoreanDate(petMateBoard.date),
          totalPets: petMateBoard.totalPets,
          participatingPetsCount: petMateBoard.participatingPetsCount,
          status: petMateBoard.status,
        };
      });

      return { statusCode: 200, data: { petMateBoardList: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getParticipatingPets(petIds) {
    return petIds.map(async (petId) => {
      const petInfo = await this.petModel.findOne({ _id: petId });

      return {
        id: petId,
        image: petInfo.images[0],
        name: this.utilService.formatPetName(petInfo.name),
        type: petInfo.type,
      };
    });
  }

  private formatParticipatingList(participatingList) {
    return participatingList.map(async (participatingInfo) => {
      const ownerInfo = await this.userModel.findOne({
        email: participatingInfo.userEmail,
      });
      const pets = await Promise.all(
        this.getParticipatingPets(participatingInfo.petIds)
      );

      return {
        pets,
        nickname: ownerInfo.nickname,
        profileImage: ownerInfo.profileImage,
        ...(!!participatingInfo.isHostPet && { isHost: true }),
      };
    });
  }

  async getPetMateBoardInfo(email: string, id: string) {
    try {
      const petMateBoardInfoQuery = this.petMateBoardModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'participatinglists',
            let: { boardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boardId', '$$boardId'] },
                  isApproved: true,
                },
              },
              {
                $project: {
                  petCount: { $size: '$petIds' },
                  isHostPet: 1,
                },
              },
            ],
            as: 'participatingLists',
          },
        },
        {
          $addFields: {
            hostPetsCount: {
              $sum: {
                $map: {
                  input: '$participatingLists',
                  as: 'pet',
                  in: {
                    $cond: {
                      if: '$$pet.isHostPet',
                      then: '$$pet.petCount',
                      else: 0,
                    },
                  },
                },
              },
            },
            participatingPetsCount: {
              $sum: '$participatingLists.petCount',
            },
          },
        },
        {
          $addFields: {
            totalPets: {
              $add: ['$maxPet', '$hostPetsCount'],
            },
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            host: 1,
            date: 1,
            place: 1,
            hostPetsCount: 1,
            participatingPetsCount: 1,
            maxPet: 1,
            totalPets: 1,
            status: 1,
          },
        },
      ]);
      const [petMateBoardInfo, participatingList, requestedMate] =
        await Promise.all([
          petMateBoardInfoQuery,
          this.participatingListModel.find({
            boardId: id,
            isApproved: true,
          }),
          this.participatingListModel.find({ boardId: id, isApproved: false }),
        ]);
      const role = (() => {
        let result = 'visitor';
        for (const participants of participatingList) {
          if (participants.userEmail === email) {
            participants.isHostPet
              ? (result = 'host')
              : (result = 'participants');
          }
        }

        return result;
      })();
      const fomatParticipatingList = await Promise.all(
        this.formatParticipatingList(participatingList)
      );
      const result = {
        petMateBoardInfo: {
          title: petMateBoardInfo[0].title,
          content: petMateBoardInfo[0].content,
          date: dayjs.convertToKoreanDate(petMateBoardInfo[0].date),
          place: petMateBoardInfo[0].place,
          totalPets: petMateBoardInfo[0].totalPets,
          participatingPetsCount: petMateBoardInfo[0].participatingPetsCount,
          requestedMateCount: requestedMate.length,
          status: petMateBoardInfo[0].status,
          role,
        },
        participatingList: fomatParticipatingList,
      };

      return { statusCode: 200, data: result };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async applyForParticipation({ email, id, petIds, message }) {
    try {
      const petMateBoardInfoQuery = this.petMateBoardModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'participatinglists',
            let: { boardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boardId', '$$boardId'] },
                  isApproved: true,
                },
              },
              {
                $project: {
                  petCount: { $size: '$petIds' },
                  isHostPet: 1,
                },
              },
            ],
            as: 'participatingLists',
          },
        },
        {
          $addFields: {
            hostPetsCount: {
              $sum: {
                $map: {
                  input: '$participatingLists',
                  as: 'pet',
                  in: {
                    $cond: {
                      if: '$$pet.isHostPet',
                      then: '$$pet.petCount',
                      else: 0,
                    },
                  },
                },
              },
            },
            participatingPetsCount: {
              $sum: '$participatingLists.petCount',
            },
          },
        },
        {
          $addFields: {
            totalPets: {
              $add: ['$maxPet', '$hostPetsCount'],
            },
          },
        },
        {
          $project: {
            hostPetsCount: 1,
            participatingPetsCount: 1,
            maxPet: 1,
            totalPets: 1,
          },
        },
      ]);
      const petMateBoardInfo = await petMateBoardInfoQuery;
      const isExceededSelectedLimit =
        petIds.length + petMateBoardInfo[0].participatingPetsCount >
        petMateBoardInfo[0].totalPets;

      if (isExceededSelectedLimit) {
        throw new HttpException(
          '선택 가능 견수를 초과했습니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      const createParticipatingPets = new this.participatingListModel({
        petIds,
        message,
        boardId: id,
        userEmail: email,
      });

      await createParticipatingPets.save();

      return { statusCode: 201, data: { isApplyForParticipation: true } };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePetMateBoard(id: string) {
    try {
      await Promise.all([
        this.petMateBoardModel.updateOne({ _id: id }, { isDeleted: true }),
      ]);

      return { statusCode: 204, data: { isDeleted: true } };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async setRecruitmentStatus(id: string, status: '모집중' | '모집마감') {
    try {
      await this.petMateBoardModel.updateOne({ _id: id }, { status });

      return { statusCode: 200, data: { status } };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  formatApplicationList(applicationList) {
    return applicationList.map(async (applicationInfo) => {
      const ownerInfo = await this.userModel.findOne({
        email: applicationInfo.userEmail,
      });
      const pets = await Promise.all(
        this.getParticipatingPets(applicationInfo.petIds)
      );

      return {
        id: applicationInfo._id,
        pets,
        nickname: ownerInfo.nickname,
        profileImage: ownerInfo.profileImage,
        message: applicationInfo.message,
      };
    });
  }

  async getApplicationList(id: string) {
    try {
      const [applicationList, participationList, petMateBoardInfo] =
        await Promise.all([
          this.participatingListModel.find({
            boardId: id,
            isApproved: false,
          }),
          this.participatingListModel.find({
            boardId: id,
            isApproved: true,
            $or: [{ isHostPet: { $exists: false } }, { isHostPet: false }],
          }),
          this.petMateBoardModel.findOne({
            _id: id,
          }),
        ]);
      const availableSlots = participationList.reduce(
        (res, participationInfo) => {
          res -= participationInfo.petIds.length;
          return res;
        },
        petMateBoardInfo.maxPet
      );
      const newApplicationList = await Promise.all(
        this.formatApplicationList(applicationList)
      );

      return {
        statusCode: 200,
        data: { availableSlots, applicationList: newApplicationList },
      };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async approveParticipantApplication(
    boardId: string,
    participatingId: string
  ) {
    try {
      const approveParticipantApplicationQuery =
        this.participatingListModel.updateOne(
          { _id: participatingId },
          { isApproved: true }
        );
      const [chatRoomInfo, participatingInfo, _] = await Promise.all([
        this.chatRoomModel.findOne({ boardId }),
        this.participatingListModel.findOne({ _id: participatingId }),
        approveParticipantApplicationQuery,
      ]);

      if (!chatRoomInfo) {
        await this.chatService.createPetMateChatRoom(boardId);
      } else {
        await this.chatService.joinPetMateChatRoom(
          participatingInfo.userEmail,
          boardId
        );
      }

      const result = await this.getApplicationList(boardId);

      return result;
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private formatScheduledWalkInfo(scheduledWalkInfo) {
    return scheduledWalkInfo.map((info) => {
      return {
        id: info.id,
        address: info.address,
        date: dayjs.convertToKoreanDate(info.date),
        title: info.title,
      };
    });
  }

  async getScheduledWalkInfo(email: string) {
    try {
      const todayStart = dayjs().toDate();
      const tomorrowEnd = dayjs().add(1, 'day').endOf('day').toDate();
      const scheduledWalkInfo = await this.participatingListModel.aggregate([
        {
          $match: {
            userEmail: email,
          },
        },
        {
          $lookup: {
            from: 'petmateboards',
            localField: 'boardId',
            foreignField: '_id',
            as: 'petMateBoard',
          },
        },
        {
          $unwind: '$petMateBoard',
        },
        {
          $match: {
            'petMateBoard.date': { $gte: todayStart, $lte: tomorrowEnd },
          },
        },
        {
          $project: {
            _id: 0,
            id: '$petMateBoard._id',
            date: '$petMateBoard.date',
            address: '$petMateBoard.address',
            title: '$petMateBoard.title',
          },
        },
      ]);
      const result = this.formatScheduledWalkInfo(scheduledWalkInfo);

      return { statusCode: 200, data: { scheduledWalkInfo: result } };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getWalkParticipation(email: string) {
    try {
      const scheduledWalkInfo = await this.participatingListModel.aggregate([
        {
          $match: {
            userEmail: email,
          },
        },
        {
          $lookup: {
            from: 'petmateboards',
            localField: 'boardId',
            foreignField: '_id',
            as: 'petMateBoard',
          },
        },
        {
          $unwind: '$petMateBoard',
        },
        {
          $project: {
            _id: 0,
            id: '$petMateBoard._id',
            date: '$petMateBoard.date',
            address: '$petMateBoard.address',
            title: '$petMateBoard.title',
          },
        },
      ]);
      const result = this.formatScheduledWalkInfo(scheduledWalkInfo);

      return {
        statusCode: 200,
        data: { participationWalkScheduleList: result },
      };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPetMatePosts(email: string) {
    try {
      const getPetMateList = await this.petMateBoardModel.find({ host: email });
      const result = this.formatScheduledWalkInfo(getPetMateList);

      return { statusCode: 200, data: { writtenPosts: result } };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async leavePetMate(email: string, boardId) {
    try {
      const [userInfo, chatRoomInfo] = await Promise.all([
        this.userModel.findOne({ email }),
        this.chatRoomModel.findOne({ boardId }),
      ]);
      console.log(chatRoomInfo);
      const message = `${userInfo.nickname}님이 나갔습니다.`;
      const timestamp = dayjs(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      ).toDate();
      await Promise.all([
        this.participatingListModel.deleteOne({ boardId, userEmail: email }),
        this.chatRoomModel.updateOne(
          { _id: chatRoomInfo._id },
          { $pull: { users: email } }
        ),
        this.chatRoomSettingModel.deleteOne({
          chatRoomId: chatRoomInfo._id,
          userId: email,
        }),
        new this.messageModel({
          chatRoomId: chatRoomInfo._id,
          type: 'action',
          details: {
            timestamp,
            type: 'comingAndGoing',
            sender: email,
            content: message,
          },
        }).save(),
        this.chatRoomModel.updateOne(
          {
            _id: chatRoomInfo._id,
          },
          {
            lastChat: message,
            lastChatAt: timestamp,
          }
        ),
      ]);

      const [boardInfo, ...ignore] = await Promise.all([
        this.getPetMateBoardInfo(email, boardId),
        this.chatGateway.broadcastChatList(chatRoomInfo._id),
        this.chatGateway.broadcastChatRoomList(chatRoomInfo._id),
      ]);
      // const boardInfo = await this.getPetMateBoardInfo(email, boardId);

      return { statusCode: 200, data: boardInfo.data };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async formatEditBoardInfo(boardInfo, email) {
    const { petIds } = await this.participatingListModel.findOne({
      boardId: boardInfo._id,
      userEmail: email,
    });
    const petInfoList = await Promise.all(
      petIds.map(async (petId) => {
        return this.petModel.findOne({ _id: petId });
      })
    );
    const pets = petInfoList.map((petInfo) => {
      return { id: petInfo._id, name: petInfo.name };
    });

    return {
      pets,
      title: boardInfo.title,
      content: boardInfo.content,
      date: boardInfo.date,
      place: boardInfo.place,
      maxPet: boardInfo.maxPet,
    };
  }

  async getEditBoardInfo(id: string, email: string) {
    try {
      const boardInfo = await this.petMateBoardModel.findOne({ _id: id });
      const result = await this.formatEditBoardInfo(boardInfo, email);

      return { statusCode: 200, data: { editPetMateBoardInfo: result } };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editPetMateBoard({
    email,
    boardId,
    petIds,
    title,
    content,
    walkDate,
    place,
    maxPet,
  }) {
    try {
      await Promise.all([
        this.petMateBoardModel.updateOne(
          { _id: boardId },
          {
            title,
            content,
            place,
            maxPet,
            date: walkDate,
          }
        ),
        this.participatingListModel.updateOne(
          { boardId, userEmail: email },
          {
            petIds,
          }
        ),
      ]);

      return { statusCode: 200, data: { isUpdated: true } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
