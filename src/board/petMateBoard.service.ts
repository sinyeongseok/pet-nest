import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model, Types } from 'mongoose';
import {
  ParticipatingList,
  ParticipatingListDocument,
} from 'src/schema/ParticipatingList.schema';
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
    private utilService: UtilService
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
        name: petInfo.name,
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
      const [petMateBoardInfo, participatingList] = await Promise.all([
        petMateBoardInfoQuery,
        this.participatingListModel.find({
          boardId: id,
          isApproved: true,
        }),
      ]);
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
          status: petMateBoardInfo[0].status,
          ...(petMateBoardInfo[0].host === email && {
            isHost: petMateBoardInfo[0].host === email,
          }),
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
        this.petMateBoardModel.deleteOne({ _id: id }),
        this.participatingListModel.deleteOne({ boardId: id }),
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
}
