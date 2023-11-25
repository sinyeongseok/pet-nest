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
          },
        },
        {
          $lookup: {
            from: 'participatingpets',
            localField: '_id',
            foreignField: 'boardId',
            as: 'participatingPets',
          },
        },
        {
          $addFields: {
            hostPetsCount: {
              $size: {
                $filter: {
                  input: '$participatingPets',
                  as: 'pet',
                  cond: { $eq: ['$$pet.isHostPet', true] },
                },
              },
            },
            participatingPetsCount: {
              $size: {
                $filter: {
                  input: '$participatingPets',
                  as: 'pet',
                  cond: {
                    $or: [
                      { $eq: ['$$pet.isHostPet', true] },
                      { $not: { $ifNull: ['$$pet.isHostPet', false] } },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalPets: {
              $add: ['$maxPet', '$participatingPetsCount'],
            },
          },
        },
        ...(isRecruiting === 'true'
          ? [
              {
                $match: {
                  $expr: {
                    $ne: [
                      {
                        $subtract: ['$totalPets', '$participatingPetsCount'],
                      },
                      0,
                    ],
                  },
                },
              },
            ]
          : []),
        {
          $project: {
            title: 1,
            date: 1,
            place: 1,
            hostPetsCount: 1,
            participatingPetsCount: 1,
            maxPet: 1,
            totalPets: 1,
            status: {
              $cond: {
                if: {
                  $eq: [
                    { $subtract: ['$totalPets', '$participatingPetsCount'] },
                    0,
                  ],
                },
                then: '모집마감',
                else: '모집중',
              },
            },
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
          region: '신림동',
          date: this.utilService.formatDate(petMateBoard.date),
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

  private async getParticipatingList(participatingPets) {
    const result = {};
    for await (const pet of participatingPets) {
      const petInfo = await this.petModel.findOne({ _id: pet.petId });
      const ownerInfo = await this.userModel.findOne({
        email: petInfo.userEmail,
      });

      if (!result[ownerInfo.nickname]) {
        result[ownerInfo.nickname] = {
          petCount: 0,
          ...(!!pet.isHostPet && { isHost: true }),
        };
      }

      result[ownerInfo.nickname].profileImage = ownerInfo.profileImage;
      result[ownerInfo.nickname].petCount++;
    }

    return result;
  }

  async getPetMateBoardInfo(id: string) {
    try {
      const petMateBoardInfoQuery = this.petMateBoardModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'participatingpets',
            localField: '_id',
            foreignField: 'boardId',
            as: 'participatingPets',
          },
        },
        {
          $addFields: {
            hostPetsCount: {
              $size: {
                $filter: {
                  input: '$participatingPets',
                  as: 'pet',
                  cond: { $eq: ['$$pet.isHostPet', true] },
                },
              },
            },
            participatingPetsCount: {
              $size: {
                $filter: {
                  input: '$participatingPets',
                  as: 'pet',
                  cond: {
                    $or: [
                      { $eq: ['$$pet.isHostPet', true] },
                      { $not: { $ifNull: ['$$pet.isHostPet', false] } },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalPets: {
              $add: ['$maxPet', '$participatingPetsCount'],
            },
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            date: 1,
            place: 1,
            hostPetsCount: 1,
            participatingPetsCount: 1,
            maxPet: 1,
            totalPets: 1,
            status: {
              $cond: {
                if: {
                  $eq: [
                    {
                      $subtract: ['$totalPets', '$participatingPetsCount'],
                    },
                    0,
                  ],
                },
                then: '모집마감',
                else: '모집중',
              },
            },
          },
        },
      ]);
      const [petMateBoardInfo, participatingPets] = await Promise.all([
        petMateBoardInfoQuery,
        this.participatingListModel.find({
          boardId: id,
        }),
      ]);
      const participatingList = await this.getParticipatingList(
        participatingPets
      );
      const result = {
        petMateBoardInfo: {
          title: petMateBoardInfo[0].title,
          content: petMateBoardInfo[0].content,
          date: this.utilService.formatDate(petMateBoardInfo[0].date),
          place: petMateBoardInfo[0].place,
          totalPets: petMateBoardInfo[0].totalPets,
          participatingPetsCount: petMateBoardInfo[0].participatingPetsCount,
          status: petMateBoardInfo[0].status,
        },
        participatingList,
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
}
