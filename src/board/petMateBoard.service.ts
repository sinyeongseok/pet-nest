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
}
