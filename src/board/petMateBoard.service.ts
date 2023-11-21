import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model } from 'mongoose';
import {
  participatingPets,
  participatingPetsDocument,
} from 'src/schema/participatingPetsSchema.schema';
import {
  PetMateBoard,
  PetMateBoardDocument,
} from 'src/schema/petMateBoardSchema.schema';
import { UtilService } from 'src/utils/util.service';

@Injectable()
export class PetMateBoardService {
  constructor(
    @InjectModel(PetMateBoard.name)
    private petMateBoardModel: Model<PetMateBoardDocument>,
    @InjectModel(participatingPets.name)
    private participatingPetsModel: Model<participatingPetsDocument>,
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
      const createPetMateBoard = new this.petMateBoardModel({
        host,
        title,
        content,
        place,
        maxPet,
        date: walkDate,
      });
      const createPetMateBoardResult = await createPetMateBoard.save();
      const createParticipatingPets = petIds.map((petId) => {
        return new this.participatingPetsModel({
          boardId: createPetMateBoardResult._id,
          petId: petId,
          isHostPet: true,
        }).save();
      });

      await Promise.all(createParticipatingPets);

      return { statusCode: 201, data: { isCreated: true } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPetMateBoardList(limit: number = 20, page: number = 0) {
    try {
      const skip = page * limit;
      const currentDate = new Date();
      const petMateBoardList = await this.petMateBoardModel.aggregate([
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
          $limit: limit,
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
}
